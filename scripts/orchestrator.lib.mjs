// Pure logic of the `/orchestrate-spec` skill (`scripts/orchestrator.mjs`), of its heartbeat hook
// (`scripts/orchestrator-heartbeat.mjs`) and of the PreToolUse guard (`scripts/guard-tool-use.mjs`).
// Nothing here touches the disk or spawns a process, so `scripts/orchestrator.test.mjs` covers
// all of it.

// ---------------------------------------------------------------------------------------------
// Tickets

/** Statuses that need no work. Every other ticket, deferred ones included, is offered. */
const CLOSED = new Set(['done', 'wontfix', 'resolved']);

/**
 * Reads one ticket file of `.scratch/<feature>/issues/NN-<slug>.md`. Only the English part above
 * `## Русский перевод` is parsed. `deferred` is true when that part calls the ticket deferred or
 * postponed: such tickets are open and must be offered like the others.
 */
export function parseTicket(fileName, text) {
  const id = /^(\d+)/.exec(fileName)?.[1];
  if (!id) return undefined;
  const english = text.split(/^## Русский перевод/m)[0];
  const field = (label) =>
    new RegExp(`^(?:\\*\\*)?${label}:(?:\\*\\*)?\\s*(.+?)\\s*$`, 'mi').exec(english)?.[1];
  const status = field('Status')?.toLowerCase() ?? 'needs-triage';
  const blocked = (field('Blocked by') ?? '').replace(/\([^)]*\)/g, '');
  return {
    id,
    title: /^#\s+(?:\d+:\s*)?(.+?)\s*$/m.exec(english)?.[1] ?? fileName,
    status,
    open: !CLOSED.has(status),
    deferred: /\b(deferred|postponed)\b/i.test(english),
    blockedBy: [...blocked.matchAll(/\b(\d{2,})\b/g)].map((match) => match[1]),
  };
}

// ---------------------------------------------------------------------------------------------
// Plan and frontier

const normalize = (path) => path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');

/** Two predicted paths overlap when they are equal or one is a folder that holds the other. */
export function pathsOverlap(a, b) {
  const [x, y] = [normalize(a), normalize(b)];
  return x === y || x.startsWith(`${y}/`) || y.startsWith(`${x}/`);
}

const touchesAny = (files, taken) => files.some((file) => taken.some((t) => pathsOverlap(file, t)));

/**
 * The name of a spec folder under `.scratch/`, from that name or from a path to the folder. It
 * names the folder of the orchestration, `.orchestrator/<feature>/`. Throws when it cannot be a
 * folder name.
 */
export function featureOf(spec) {
  const name = normalize(String(spec ?? ''))
    .split('/')
    .pop();
  if (!/^\w[\w.-]*$/.test(name)) throw new Error(`not a spec folder name: ${spec}`);
  return name;
}

/**
 * Checks the selected tickets before an orchestration: every blocker is selected or closed
 * (`doneIds`), and the blockers have no cycle. Throws with the first problem.
 *
 * @param {{ id: string, blockedBy: string[] }[]} tickets
 * @param {Iterable<string>} doneIds
 */
export function validatePlan(tickets, doneIds = []) {
  const done = new Set(doneIds);
  const selected = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  for (const ticket of tickets) {
    const missing = ticket.blockedBy.filter((id) => !selected.has(id) && !done.has(id));
    if (missing.length) {
      throw new Error(`${ticket.id} is blocked by ${missing.join(', ')}, which is not selected`);
    }
  }
  const finished = new Set();
  while (finished.size < tickets.length) {
    const ready = tickets.filter(
      (t) => !finished.has(t.id) && t.blockedBy.every((id) => done.has(id) || finished.has(id)),
    );
    if (!ready.length) {
      const left = tickets.filter((t) => !finished.has(t.id)).map((t) => t.id);
      throw new Error(`dependency cycle between ${left.join(', ')}`);
    }
    ready.forEach((t) => finished.add(t.id));
  }
}

/** Ticket states in `.orchestrator/<feature>/state.json`, in the order a ticket passes them. */
export const STATES = ['pending', 'running', 'review', 'merging', 'merged', 'failed', 'skipped'];

/** States whose ticket holds its files: an agent works on them or a merge is under way. */
const IN_FLIGHT = new Set(['running', 'review', 'merging']);

/** The tickets of one orchestration in flight. */
export const countInFlight = (state) =>
  Object.values(state?.tickets ?? {}).filter((ticket) => IN_FLIGHT.has(ticket.status)).length;

const byId = ([a], [b]) => a.localeCompare(b, 'en', { numeric: true });

/**
 * The tickets to launch now, in ticket order: pending, every blocker merged (a blocker outside
 * the orchestration was closed before it), no predicted file overlapping a ticket in flight or
 * one picked before it, and no more than `max` tickets in flight in all. The other orchestrations of
 * the checkout share the limit: the caller takes their tickets in flight off `max`.
 */
export function frontier(state, max = Infinity) {
  const entries = Object.entries(state.tickets).sort(byId);
  const inFlight = entries.filter(([, t]) => IN_FLIGHT.has(t.status));
  const taken = inFlight.flatMap(([, t]) => t.files);
  const merged = (id) => !state.tickets[id] || state.tickets[id].status === 'merged';
  const ready = [];
  for (const [id, ticket] of entries) {
    if (inFlight.length + ready.length >= max) break;
    if (ticket.status !== 'pending' || !ticket.blockedBy.every(merged)) continue;
    if (touchesAny(ticket.files, taken)) continue;
    ready.push(id);
    taken.push(...ticket.files);
  }
  return ready;
}

/** Pending tickets that can never start, because a ticket they are blocked by failed or was
 * skipped. */
export function blockedForGood(state) {
  const dead = (id) => ['failed', 'skipped'].includes(state.tickets[id]?.status);
  return Object.entries(state.tickets)
    .filter(([, t]) => t.status === 'pending' && t.blockedBy.some(dead))
    .map(([id]) => id)
    .sort();
}

// ---------------------------------------------------------------------------------------------
// Heartbeats and progress

/**
 * The running tickets whose agent has gone silent: the last heartbeat (or the start, when there is
 * none yet) is more than `maxAgeMs` old. While the agent is inside a tool call (`inTool`, written
 * on PreToolUse) the limit doubles, because one Bash call may legally run for 10 minutes.
 */
export function findStale(state, beats, now, maxAgeMs) {
  return Object.entries(state.tickets)
    .filter(([, ticket]) => ticket.status === 'running')
    .filter(([id, ticket]) => {
      const beat = beats[id];
      const last = Date.parse(beat?.at ?? ticket.startedAt ?? '');
      const limit = beat?.inTool ? maxAgeMs * 2 : maxAgeMs;
      return !Number.isFinite(last) || now - last > limit;
    })
    .map(([id]) => id)
    .sort();
}

/**
 * The feature, among the orchestrations `feature → state`, that has a running ticket worked on by
 * the agent. Agent ids are unique across specs, so the agent never has to say its spec.
 */
export function agentSpec(states, agentId) {
  if (!agentId) return undefined;
  return Object.keys(states).find((feature) =>
    Object.values(states[feature]?.tickets ?? {}).some(
      (ticket) => ticket.status === 'running' && ticket.agent === agentId,
    ),
  );
}

/**
 * The heartbeat a hook event writes. Only a tool call of the agent of a running ticket beats: it
 * records the time, the tool, whether the call is still under way and the agent's working folder,
 * and keeps the step the agent described with `beat`. Undefined for every other event.
 */
export function heartbeatFor(state, beats, event, now) {
  if (!event.agent_id || !state?.tickets) return undefined;
  const entry = Object.entries(state.tickets).find(
    ([, ticket]) => ticket.status === 'running' && ticket.agent === event.agent_id,
  );
  if (!entry) return undefined;
  const [id] = entry;
  return {
    id,
    beat: {
      ...beats[id],
      ticket: id,
      at: new Date(now).toISOString(),
      tool: event.tool_name,
      inTool: event.hook_event_name === 'PreToolUse',
      cwd: event.cwd,
    },
  };
}

const ago = (iso, now) => {
  const seconds = Math.round((now - Date.parse(iso)) / 1000);
  if (!Number.isFinite(seconds)) return '—';
  return seconds < 120 ? `${seconds} s ago` : `${Math.round(seconds / 60)} min ago`;
};
const cell = (text) =>
  String(text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');

const counter = (tickets) => (status) => tickets.filter((t) => t.status === status).length;

/**
 * How long a running agent may stay silent before the progress warns about it: half the 10 minutes
 * after which the watcher reports it `STALE`, so the warning comes before the restart.
 */
export const QUIET_MS = 5 * 60_000;

/** The mark of each ticket state in `progress.md` and the status line. */
export const ICONS = {
  pending: '⚪',
  running: '🔵',
  review: '🟡',
  merging: '🟣',
  merged: '🟢',
  failed: '🔴',
  skipped: '⚫',
};
const QUIET = '⚠';
const BLOCKED = '⛔';

/** A text progress bar of `width` cells: `█` for the done part, `░` for the rest. */
export function progressBar(done, total, width) {
  const full = total ? Math.round((done / total) * width) : 0;
  return '█'.repeat(full) + '░'.repeat(width - full);
}

/** The tickets whose agent went quiet and the tickets that can never start. */
function marks(state, beats, now) {
  const quiet = new Set(findStale(state, beats, now, QUIET_MS));
  const blocked = new Set(blockedForGood(state));
  return { quiet, blocked };
}

/** One line of at most `max` characters, without the backticks of code spans. */
const shortText = (text, max) => {
  const plain = String(text ?? '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
};

/** Text that Mermaid shows as written inside a quoted label. */
const mermaidText = (text, max) =>
  shortText(text, max)
    .replace(/#/g, '#35;')
    .replace(/"/g, '#quot;')
    .replace(/</g, '#lt;')
    .replace(/>/g, '#gt;');

const NODE_STYLES = {
  pending: 'fill:#f1f3f5,stroke:#adb5bd,color:#343a40',
  running: 'fill:#d0ebff,stroke:#1c7ed6,color:#0b3d6e',
  review: 'fill:#fff3bf,stroke:#f08c00,color:#5c3c00',
  merging: 'fill:#e5dbff,stroke:#7048e8,color:#2b1a6b',
  merged: 'fill:#d3f9d8,stroke:#2f9e44,color:#1b4332',
  failed: 'fill:#ffe3e3,stroke:#e03131,color:#6b0f0f',
  skipped: 'fill:#e9ecef,stroke:#868e96,color:#495057,stroke-dasharray:4',
  quiet: 'fill:#d0ebff,stroke:#e03131,stroke-width:3px,color:#0b3d6e',
  blocked: 'fill:#f1f3f5,stroke:#e03131,stroke-dasharray:4,color:#343a40',
};

/**
 * A Mermaid flowchart of the tickets: one node per ticket colored by its state, an arrow from each
 * blocker to the ticket it blocks. A running ticket shows its step; a quiet agent and a ticket that
 * can never start get a red border.
 */
export function renderGraph(state, beats, now) {
  const { quiet, blocked } = marks(state, beats, now);
  const tickets = Object.entries(state.tickets).sort(byId);
  const lines = ['```mermaid', 'flowchart LR'];
  for (const [id, ticket] of tickets) {
    const kind = quiet.has(id) ? 'quiet' : blocked.has(id) ? 'blocked' : ticket.status;
    const mark = quiet.has(id) ? QUIET : blocked.has(id) ? BLOCKED : (ICONS[ticket.status] ?? '');
    const step = IN_FLIGHT.has(ticket.status) && beats[id]?.step;
    const label =
      `${mark} ${id} ${mermaidText(ticket.title, 40)}` +
      (step ? `<br/><small>${mermaidText(step, 50)}</small>` : '');
    lines.push(`  t${id}["${label}"]:::${NODE_STYLES[kind] ? kind : 'pending'}`);
  }
  for (const [id, ticket] of tickets) {
    for (const blocker of ticket.blockedBy) {
      if (state.tickets[blocker]) lines.push(`  t${blocker} --> t${id}`);
    }
  }
  for (const [kind, style] of Object.entries(NODE_STYLES))
    lines.push(`  classDef ${kind} ${style}`);
  lines.push('```');
  return lines;
}

/**
 * The spans each ticket was in flight, read from the log (`<id> → <state>`): a span opens when the
 * ticket enters running, review or merging and closes when it leaves them. A span still open ends
 * at `now`. `end` is the state it closed with, undefined while open.
 */
export function flightSpans(state, now) {
  const spans = [];
  const open = {};
  for (const entry of state.log ?? []) {
    const match = /^(\S+) → (\w+)/.exec(entry.text);
    const at = Date.parse(entry.at);
    if (!match || !Number.isFinite(at)) continue;
    const [, id, status] = match;
    if (IN_FLIGHT.has(status)) {
      open[id] ??= { id, start: at };
    } else if (open[id]) {
      spans.push({ ...open[id], stop: at, end: status });
      delete open[id];
    }
  }
  for (const span of Object.values(open)) spans.push({ ...span, stop: now });
  return spans.sort((a, b) => byId([a.id], [b.id]) || a.start - b.start);
}

/** A Mermaid gantt of the spans in flight: done when merged, critical when it failed, active while open. */
export function renderTimeline(state, now) {
  const spans = flightSpans(state, now);
  if (!spans.length) return [];
  const lines = ['```mermaid', 'gantt', '  dateFormat X', '  axisFormat %H:%M'];
  const tries = {};
  for (const span of spans) {
    tries[span.id] = (tries[span.id] ?? 0) + 1;
    // A gantt task name ends at `:`, and `#` or `;` would start an entity.
    const title = shortText(state.tickets[span.id]?.title?.replace(/[:;#]/g, ' '), 30);
    const name = `${span.id} ${title}${tries[span.id] > 1 ? ` (try ${tries[span.id]})` : ''}`;
    const tag = !span.end ? 'active, ' : span.end === 'merged' ? 'done, ' : 'crit, ';
    const seconds = (ms) => Math.floor(ms / 1000);
    // A span of a few seconds still gets a visible bar.
    lines.push(
      `  ${name} :${tag}${seconds(span.start)}, ${Math.max(seconds(span.stop), seconds(span.start) + 30)}`,
    );
  }
  lines.push('```');
  return lines;
}

// ---------------------------------------------------------------------------------------------
// Time

/** `ms` as `45 s`, `13 min` or `1 h 44 min`; `—` when unknown. */
export function duration(ms) {
  if (!Number.isFinite(ms)) return '—';
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** The log as events: `{ at, id, status }` for a ticket, `{ at, phase }` for a phase. */
function logEvents(state) {
  return (state.log ?? []).flatMap((entry) => {
    const at = Date.parse(entry.at);
    if (!Number.isFinite(at)) return [];
    const phase = /^phase: (\w+)/.exec(entry.text);
    if (phase) return [{ at, phase: phase[1] }];
    const ticket = /^(\S+) → (\w+)/.exec(entry.text);
    return ticket ? [{ at, id: ticket[1], status: ticket[2] }] : [];
  });
}

/**
 * Where the time of each ticket went, read from the log: `work` (running or review), `merge`
 * (merging), `tries` (starts from outside flight), `started` (the first start), `merged` (when),
 * and `wait`, from the moment its last blocker merged (or the plan, without blockers) to its first
 * start. `wait` is undefined while a blocker is not merged. A state still open counts up to `now`.
 */
export function ticketTimes(state, now) {
  const times = Object.fromEntries(
    Object.keys(state.tickets).map((id) => [id, { work: 0, merge: 0, tries: 0 }]),
  );
  const add = (time, status, ms) => {
    if (status === 'running' || status === 'review') time.work += ms;
    if (status === 'merging') time.merge += ms;
  };
  const current = {};
  for (const event of logEvents(state)) {
    const time = times[event.id];
    if (!time) continue;
    const previous = current[event.id];
    if (previous) add(time, previous.status, event.at - previous.at);
    if (event.status === 'running' && !IN_FLIGHT.has(previous?.status)) {
      time.tries += 1;
      time.started ??= event.at;
    }
    if (event.status === 'merged') time.merged = event.at;
    current[event.id] = event;
  }
  for (const [id, event] of Object.entries(current)) add(times[id], event.status, now - event.at);
  const planned = Date.parse(state.startedAt);
  for (const [id, ticket] of Object.entries(state.tickets)) {
    const blockers = (ticket.blockedBy ?? []).filter((blocker) => times[blocker]);
    if (blockers.some((blocker) => times[blocker].merged === undefined)) continue;
    const ready = Math.max(planned, ...blockers.map((blocker) => times[blocker].merged));
    times[id].wait = (times[id].started ?? now) - ready;
  }
  return times;
}

/**
 * The phases in order with their time: implement from the start, then each `phase: <name>` of the
 * log until the next one; the open one counts up to `now`. `done` ends the last and has no time.
 */
export function phaseTimes(state, now) {
  const marks = [
    { phase: 'implement', at: Date.parse(state.startedAt) },
    ...logEvents(state).filter((event) => event.phase),
  ];
  return marks
    .filter((mark) => mark.phase !== 'done')
    .map((mark) => {
      const next = marks[marks.indexOf(mark) + 1];
      return { phase: mark.phase, ms: (next?.at ?? now) - mark.at, open: !next };
    });
}

/** The value at share `q` (0 to 1) of sorted numbers, between the two nearest. */
const quantile = (sorted, q) => {
  const at = (sorted.length - 1) * q;
  const below = sorted[Math.floor(at)];
  return below + (sorted[Math.ceil(at)] - below) * (at - Math.floor(at));
};
const median = (values) =>
  quantile(
    [...values].sort((a, b) => a - b),
    0.5,
  );
const MIN_LEFT = 60_000;
const AFTER_IMPLEMENT = ['review', 'verify'];

/**
 * How long the orchestration still needs, from `now`: `low` and `high` in ms, from the quartiles
 * of the time a merged ticket took (worked and merged) in this run and in `history`, the earlier
 * orchestrations of the checkout. A ticket in flight needs that less what it spent, at least a
 * minute; a ticket that needs no more work needs nothing. Tickets run once their blockers are
 * done, with no limit on agents, so the longest chain decides: `path` names it. Review and verify
 * add the median of their earlier finished runs (`phases` says whether there were any). Undefined
 * when no ticket has been merged yet anywhere, or when the orchestration is done.
 */
export function forecast(state, now, history = []) {
  if (state.phase === 'done') return undefined;
  const runs = [state, ...history];
  const samples = runs
    .flatMap((run) => Object.values(ticketTimes(run, now)))
    .filter((time) => time.merged !== undefined)
    .map((time) => time.work + time.merge)
    .sort((a, b) => a - b);
  if (!samples.length) return undefined;
  const times = ticketTimes(state, now);
  const dead = new Set(blockedForGood(state));
  const left = (id, estimate) => {
    const { status } = state.tickets[id];
    if (status === 'pending' && !dead.has(id)) return estimate;
    if (!IN_FLIGHT.has(status)) return 0;
    return Math.max(estimate - times[id].work - times[id].merge, MIN_LEFT);
  };
  const chain = (estimate) => {
    const finish = {};
    const via = (id) => {
      if (!finish[id]) {
        const blockers = (state.tickets[id].blockedBy ?? []).filter(
          (blocker) => state.tickets[blocker],
        );
        const before = blockers.map(via).sort((a, b) => b.ms - a.ms)[0];
        const ms = (before?.ms ?? 0) + left(id, estimate);
        finish[id] = {
          ms,
          path: ms > (before?.ms ?? 0) ? [...(before?.path ?? []), id] : (before?.path ?? []),
        };
      }
      return finish[id];
    };
    return (
      Object.keys(state.tickets)
        .sort((a, b) => byId([a], [b]))
        .map(via)
        .sort((a, b) => b.ms - a.ms)[0] ?? { ms: 0, path: [] }
    );
  };
  const current = phaseTimes(state, now).at(-1);
  const order = ['implement', ...AFTER_IMPLEMENT];
  const finished = history
    .filter((run) => run.phase === 'done')
    .flatMap((run) => phaseTimes(run, now));
  let after = 0;
  let counted = false;
  for (const phase of AFTER_IMPLEMENT) {
    const earlier = finished.filter((p) => p.phase === phase).map((p) => p.ms);
    if (!earlier.length || order.indexOf(phase) < order.indexOf(current.phase)) continue;
    counted = true;
    after +=
      phase === current.phase ? Math.max(median(earlier) - current.ms, MIN_LEFT) : median(earlier);
  }
  const [low, high] = [quantile(samples, 0.25), quantile(samples, 0.75)].map(chain);
  return {
    low: low.ms + after,
    high: high.ms + after,
    path: high.path,
    phases: counted,
    samples: samples.length,
  };
}

/** A forecast as `25–60 min`, `45 s–2 min`, or `~30 min` when both ends read the same. */
export function range({ low, high }) {
  const [from, to] = [duration(low), duration(high)];
  if (from === to) return `~${to}`;
  const unit = / (s|min)$/.exec(from)?.[0];
  return unit && to.endsWith(unit) && !to.includes(' h ')
    ? `${from.slice(0, -unit.length)}–${to}`
    : `${from}–${to}`;
}

/** The `## Time` section of `progress.md`. */
export function renderTime(state, now, history = []) {
  const times = ticketTimes(state, now);
  const phases = phaseTimes(state, now);
  const doneAt = logEvents(state).find((event) => event.phase === 'done')?.at;
  const agents = Object.values(times).reduce((sum, time) => sum + time.work + time.merge, 0);
  const implement = phases.find((phase) => phase.phase === 'implement')?.ms ?? 0;
  const lines = [
    '## Time',
    '',
    `Elapsed ${duration((doneAt ?? now) - Date.parse(state.startedAt))}; ` +
      `agents worked and merged ${duration(agents)} in all` +
      (implement && agents
        ? `, ${(agents / implement).toFixed(1)} at a time while implementing.`
        : '.'),
  ];
  const next = forecast(state, now, history);
  if (next) {
    lines.push(
      '',
      `Forecast: done in **${range(next)}**` +
        (next.path.length ? `; the longest chain left is ${next.path.join(' → ')}` : '') +
        (next.phases
          ? ', review and verify included'
          : ', review and verify not counted (no earlier run)') +
        ` (by ${next.samples} merged tickets).`,
    );
  }
  lines.push(
    '',
    '| Ticket | Waited | Worked | Merging | Tries | Start to merge |',
    '| --- | --- | --- | --- | --- | --- |',
  );
  for (const [id, time] of Object.entries(times).sort(byId)) {
    const total = time.started === undefined ? undefined : (time.merged ?? now) - time.started;
    const show = (ms, used = ms) => (used ? duration(ms) : '—');
    lines.push(
      `| ${id} | ${time.wait === undefined ? '—' : duration(time.wait)} | ${show(time.work, time.tries)} | ` +
        `${show(time.merge)} | ${time.tries || '—'} | ${total === undefined ? '—' : duration(total)} |`,
    );
  }
  lines.push('', '| Phase | Time |', '| --- | --- |');
  for (const phase of phases)
    lines.push(`| ${phase.phase}${phase.open ? ' (now)' : ''} | ${duration(phase.ms)} |`);
  return lines;
}

/** `.orchestrator/<feature>/progress.md`: what the user reads while the orchestration runs. The
 * earlier orchestrations of the checkout (`history`) calibrate the forecast. */
export function renderProgress(state, beats, now, history = []) {
  const tickets = Object.entries(state.tickets).sort(byId);
  const count = counter(tickets.map(([, t]) => t));
  const { quiet, blocked } = marks(state, beats, now);
  const merged = count('merged');
  const lines = [
    `# Orchestration: ${state.spec}`,
    '',
    `Integration branch \`${state.branch}\` from \`${state.base}\`. Started ${state.startedAt}, ` +
      `updated ${new Date(now).toISOString()}.`,
    '',
    `\`${progressBar(merged, tickets.length, 20)}\` ` +
      `**${tickets.length ? Math.round((merged / tickets.length) * 100) : 0}%**`,
    '',
    `Merged ${merged} of ${tickets.length}; running ${count('running')}; ` +
      `failed ${count('failed')}. Phase: **${state.phase}**.`,
    '',
    '| Ticket | Blocked by | Status | Last heartbeat | Step | Note |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const [id, ticket] of tickets) {
    const beat = beats[id];
    const heartbeat = beat ? `${ago(beat.at, now)}${beat.tool ? ` (${beat.tool})` : ''}` : '—';
    const status =
      `${ICONS[ticket.status] ?? ''} ${ticket.status}`.trim() +
      (blocked.has(id) ? ` ${BLOCKED} blocked for good` : '');
    lines.push(
      `| ${id} ${cell(ticket.title)} | ${ticket.blockedBy.join(', ') || '—'} | ${status} | ` +
        `${quiet.has(id) ? `${QUIET} ` : ''}${heartbeat} | ${cell(beat?.step)} | ${cell(ticket.note)} |`,
    );
  }
  lines.push(
    '',
    `${Object.entries(ICONS)
      .map(([status, icon]) => `${icon} ${status}`)
      .join(' · ')} · ${QUIET} silent for ${QUIET_MS / 60_000} min · ${BLOCKED} blocker failed`,
    '',
    '## Graph',
    '',
    ...renderGraph(state, beats, now),
    '',
    ...renderTime(state, now, history),
  );
  const timeline = renderTimeline(state, now);
  if (timeline.length) lines.push('', '## Timeline', '', ...timeline);
  if (state.log?.length) {
    lines.push('', '## Log', '', ...state.log.map((entry) => `- ${entry.at} ${entry.text}`));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * The Claude Code status line: one part per orchestration not yet done (`states` is
 * `feature → state`, `beatsOf` is `feature → beats`), with a bar of merged tickets, the tickets in
 * flight, the quiet and failed ones, the time since the start and the forecast. Empty when nothing
 * runs.
 */
export function renderStatusLine(states, beatsOf, now) {
  const parts = [];
  for (const feature of Object.keys(states).sort()) {
    const state = states[feature];
    if (!state?.tickets || state.phase === 'done') continue;
    const tickets = Object.values(state.tickets);
    const count = counter(tickets);
    const inFlight = tickets.filter((t) => IN_FLIGHT.has(t.status)).length;
    const quiet = findStale(state, beatsOf[feature] ?? {}, now, QUIET_MS);
    const others = Object.entries(states)
      .filter(([name, other]) => name !== feature && other?.tickets)
      .map(([, other]) => other);
    const next = forecast(state, now, others);
    parts.push(
      [
        `${feature} ${state.phase}`,
        `${progressBar(count('merged'), tickets.length, 10)} ${count('merged')}/${tickets.length}`,
        inFlight ? `${ICONS.running}${inFlight}` : '',
        count('failed') ? `${ICONS.failed}${count('failed')}` : '',
        quiet.length ? `${QUIET} ${quiet.join(',')} silent` : '',
        Number.isFinite(Date.parse(state.startedAt))
          ? `⏱ ${duration(now - Date.parse(state.startedAt))}`
          : '',
        next ? `ETA ${range(next)}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
    );
  }
  return parts.join('  │  ');
}

/** `.orchestrator/progress.md`: one line per orchestration (`feature → state`) of a checkout. */
export function renderIndex(states, now) {
  const lines = [
    '# Orchestrations',
    '',
    `One line per spec; updated ${new Date(now).toISOString()}.`,
    '',
  ];
  for (const feature of Object.keys(states).sort()) {
    const tickets = Object.values(states[feature].tickets ?? {});
    const count = counter(tickets);
    lines.push(
      `- [${feature}](${feature}/progress.md): phase **${states[feature].phase}**; ` +
        `merged ${count('merged')} of ${tickets.length}; running ${count('running')}; ` +
        `failed ${count('failed')}.`,
    );
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Where an orchestration of an earlier run, kept at the top level of `.orchestrator/`, moves: the
 * folder of its spec. Every top-level entry (`names`) moves there except the verify lock and the
 * folders that already hold an orchestration (`specDirs`). `state.json` comes last: while it is
 * at the top level, the move is unfinished. Throws when its own folder holds an orchestration.
 */
export function legacyMoves(state, names, specDirs) {
  const feature = featureOf(state.spec);
  if (specDirs.includes(feature)) {
    throw new Error(
      `.orchestrator/${feature}/ already holds an orchestration; ` +
        'move the top-level .orchestrator/state.json and its files by hand',
    );
  }
  const stay = new Set(['verify.lock', 'state.json', feature, ...specDirs]);
  return { feature, names: [...names.filter((name) => !stay.has(name)), 'state.json'] };
}

// ---------------------------------------------------------------------------------------------
// Lock

/**
 * `free` (no lock), `own` (this session holds it), `stale` (its Claude Code process is gone) or
 * `held` (another live session holds it). The owner is the field `key` of the lock: the session
 * for the lock of a spec, the spec for the verify lock.
 */
export function lockStatus(lock, owner, isAlive, key = 'session') {
  if (!lock) return 'free';
  if (lock[key] === owner) return 'own';
  return isAlive(lock.pid) ? 'held' : 'stale';
}

// ---------------------------------------------------------------------------------------------
// Guard: process kills

/** Quoted strings hold messages and paths, never a kill or a flag; drop them before matching. */
const unquote = (command) => command.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""');

/** Kills by name or pattern: they can hit the user's own processes and have no PID to check. */
const BY_NAME = [
  [/\btaskkill\b[^|;&\n]*\s[/-]+im\b/i, 'taskkill /IM'],
  [/\btaskkill\b[^|;&\n]*\s[/-]+fi\b/i, 'taskkill /FI'],
  [/\b(Stop-Process|spps)\b[^|;&\n]*-(Name|ProcessName)\b/i, 'Stop-Process -Name'],
  [/\|\s*(Stop-Process|spps|kill)\b/i, 'piping processes into a kill'],
  [/(?<!\bprocess)\.Kill\(/i, '.Kill()'],
  [/\bInvoke-CimMethod\b[^\n]*Terminate/i, 'Invoke-CimMethod Terminate'],
  [/\bwmic\b[^\n]*\b(delete|terminate)\b/i, 'wmic delete/terminate'],
  [/\b(pkill|killall)\b/i, 'pkill/killall'],
];

/**
 * The processes a shell command would kill.
 * - `byName`: the label of a kill by name or pattern (always blocked);
 * - `pids`: the literal PIDs, each `{ pid, msys }`; `msys` marks a Git Bash `kill`, whose PID is
 *   an MSYS one on Windows;
 * - `unresolved`: a kill whose target is not a literal PID (a variable, a job, `0`, `-1`).
 */
export function killTargets(command) {
  const result = { byName: undefined, pids: [], unresolved: [] };
  for (const [pattern, label] of BY_NAME) {
    if (pattern.test(command)) {
      result.byName = label;
      return result;
    }
  }
  const add = (raw, msys) => {
    const pid = Number(raw);
    if (/^\d+$/.test(raw) && pid > 0) result.pids.push({ pid, msys });
    else result.unresolved.push(raw);
  };

  // Quotes split segments too: a nested command (`powershell -Command "Stop-Process -Id 5"`)
  // starts a segment, while a kill in the middle of a message ("fix: kill the server") does not.
  for (const segment of command.split(/[;&|\n"'`]+|\$\(|\(/)) {
    const words = segment.trim().split(/\s+/);
    const at = /^(sudo|exec|command)$/i.test(words[0]) ? 1 : 0;
    if (!/^(taskkill(\.exe)?|Stop-Process|spps|kill)$/i.test(words[at] ?? '')) continue;
    const verb = words[at].toLowerCase().replace(/\.exe$/, '');
    const args = words.slice(at + 1).filter(Boolean);
    if (verb === 'taskkill') {
      args.forEach((arg, i) => /^[/-]+pid$/i.test(arg) && add(args[i + 1] ?? '', false));
    } else if (verb === 'stop-process' || verb === 'spps') {
      const id = args.findIndex((arg) => /^-Id$/i.test(arg));
      const value = id === -1 ? args.find((arg) => !arg.startsWith('-')) : args[id + 1];
      (value ?? '').split(',').forEach((pid) => add(pid, false));
    } else {
      // kill [-9 | -s SIG | -SIGTERM | -W] <pid>...; `kill -l` only lists signals.
      if (args.some((arg) => /^-l$/i.test(arg))) continue;
      const windows = args.some((arg) => /^-W$/.test(arg));
      args
        .filter((arg, i) => !arg.startsWith('-') && !/^-s$/i.test(args[i - 1] ?? ''))
        .forEach((pid) => add(pid, !windows));
    }
  }
  for (const match of command.matchAll(/\bprocess\.kill\(\s*([^,)\s]+)/g)) add(match[1], false);
  return result;
}

/** Whether `pid` is a descendant of `rootPid` (not the root itself) in a `pid → ppid` table. */
export function isDescendant(parents, pid, rootPid) {
  const seen = new Set();
  let current = parents.get(pid);
  while (current !== undefined && current > 0 && !seen.has(current)) {
    if (current === rootPid) return true;
    seen.add(current);
    current = parents.get(current);
  }
  return false;
}

// ---------------------------------------------------------------------------------------------
// Guard: git hooks

/** A `git commit` that skips the hooks: `--no-verify`, `-n` (alone or in a flag group), or a
 * `core.hooksPath` override. */
export function skipsGitHooks(command) {
  const text = unquote(command);
  return text.split(/[;&|\n]+/).some((segment) => {
    const words = segment.trim().split(/\s+/);
    const git = words.findIndex((word) => /^git(\.exe)?$/i.test(word));
    if (git === -1) return false;
    const commit = words.indexOf('commit', git + 1);
    if (commit === -1) return false;
    const before = words.slice(git + 1, commit).join(' ');
    if (/core\.hooksPath/i.test(before)) return true;
    return words
      .slice(commit + 1)
      .some((word) => word === '--no-verify' || /^-[a-zA-Z]*n[a-zA-Z]*$/.test(word));
  });
}
