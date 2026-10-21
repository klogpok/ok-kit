// Pure logic of the `/orchestrate-spec` skill (`scripts/orchestrator.mjs`) and of the PreToolUse
// guard (`scripts/guard-tool-use.mjs`). Nothing here touches the disk or spawns a process, so
// `scripts/orchestrator.test.mjs` covers all of it.

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
// Batches

const normalize = (path) => path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');

/** Two predicted paths overlap when they are equal or one is a folder that holds the other. */
export function pathsOverlap(a, b) {
  const [x, y] = [normalize(a), normalize(b)];
  return x === y || x.startsWith(`${y}/`) || y.startsWith(`${x}/`);
}

const touchesAny = (files, taken) => files.some((file) => taken.some((t) => pathsOverlap(file, t)));

/**
 * Splits the selected tickets into batches that can run in parallel. A ticket joins a batch once
 * every ticket it is blocked by sits in an earlier batch, and only if none of its predicted files
 * overlaps a file of a ticket already in that batch. Blockers that are closed (`doneIds`) are
 * satisfied; a blocker that is neither selected nor closed is an error, as is a cycle.
 *
 * @param {{ id: string, blockedBy: string[], files: string[] }[]} tickets
 * @param {Iterable<string>} doneIds
 * @returns {string[][]}
 */
export function computeBatches(tickets, doneIds = []) {
  const done = new Set(doneIds);
  const selected = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  for (const ticket of tickets) {
    const missing = ticket.blockedBy.filter((id) => !selected.has(id) && !done.has(id));
    if (missing.length) {
      throw new Error(`${ticket.id} is blocked by ${missing.join(', ')}, which is not selected`);
    }
  }

  const scheduled = new Set();
  const batches = [];
  const byId = (a, b) => a.id.localeCompare(b.id, 'en', { numeric: true });
  while (scheduled.size < tickets.length) {
    const ready = tickets
      .filter((t) => !scheduled.has(t.id))
      .filter((t) => t.blockedBy.every((id) => done.has(id) || scheduled.has(id)))
      .sort(byId);
    if (!ready.length) {
      const left = tickets.filter((t) => !scheduled.has(t.id)).map((t) => t.id);
      throw new Error(`dependency cycle between ${left.join(', ')}`);
    }
    const batch = [];
    const taken = [];
    for (const ticket of ready) {
      if (batch.length && touchesAny(ticket.files, taken)) continue;
      batch.push(ticket.id);
      taken.push(...ticket.files);
    }
    batch.forEach((id) => scheduled.add(id));
    batches.push(batch);
  }
  return batches;
}

// ---------------------------------------------------------------------------------------------
// Heartbeats and progress

/** Ticket states in `.orchestrator/state.json`, in the order a ticket goes through them. */
export const STATES = ['pending', 'running', 'review', 'merging', 'merged', 'failed', 'skipped'];

/**
 * The running tickets whose agent has gone silent: the last heartbeat (or the start, when there is
 * none yet) is more than `maxAgeMs` old.
 */
export function findStale(state, beats, now, maxAgeMs) {
  return Object.entries(state.tickets)
    .filter(([, ticket]) => ticket.status === 'running')
    .filter(([id, ticket]) => {
      const last = Date.parse(beats[id]?.at ?? ticket.startedAt ?? '');
      return !Number.isFinite(last) || now - last > maxAgeMs;
    })
    .map(([id]) => id);
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

/** `.orchestrator/progress.md`: what the user reads while the orchestration runs. */
export function renderProgress(state, beats, now) {
  const tickets = Object.entries(state.tickets);
  const count = (status) => tickets.filter(([, t]) => t.status === status).length;
  const lines = [
    `# Orchestration: ${state.spec}`,
    '',
    `Integration branch \`${state.branch}\` from \`${state.base}\`. Started ${state.startedAt}, ` +
      `updated ${new Date(now).toISOString()}.`,
    '',
    `Merged ${count('merged')} of ${tickets.length}; running ${count('running')}; ` +
      `failed ${count('failed')}. Phase: **${state.phase}**.`,
    '',
    '| Batch | Ticket | Status | Last heartbeat | Step | Note |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  state.batches.forEach((batch, index) => {
    for (const id of batch) {
      const ticket = state.tickets[id];
      const beat = beats[id];
      lines.push(
        `| ${index + 1} | ${id} ${cell(ticket.title)} | ${ticket.status} | ` +
          `${beat ? ago(beat.at, now) : '—'} | ${cell(beat?.step)} | ${cell(ticket.note)} |`,
      );
    }
  });
  if (state.log?.length) {
    lines.push('', '## Log', '', ...state.log.map((entry) => `- ${entry.at} ${entry.text}`));
  }
  return `${lines.join('\n')}\n`;
}

// ---------------------------------------------------------------------------------------------
// Lock

/**
 * `free` (no lock), `own` (this session holds it), `stale` (its Claude Code process is gone) or
 * `held` (another live session holds it).
 */
export function lockStatus(lock, sessionId, isAlive) {
  if (!lock) return 'free';
  if (lock.session === sessionId) return 'own';
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
