// State keeper of the `/orchestrate-spec` skill (`.claude/skills/orchestrate-spec/SKILL.md`).
// Everything lives in `.orchestrator/` of the main checkout (git-ignored), whichever worktree the
// command runs from: `lock`, `plan.json`, `state.json`, one `<ticket>.json` heartbeat per ticket
// and `progress.md`, which every write re-renders. The heartbeats are written by the hook
// `scripts/orchestrator-heartbeat.mjs` on every tool call of a ticket agent; `beat` only adds a
// description of the step.
//
// Usage (`node <main checkout>/scripts/orchestrator.mjs <command>`):
//   lock acquire | release | status   one orchestration per checkout, owned by a Claude Code session
//   tickets <spec dir>                the tickets of a spec as JSON, closed ones included
//   init [<plan.json>] [--force]      checks the plan and writes state.json; refuses to replace an
//                                     unfinished orchestration without --force
//   next [--max <n>]                  the tickets to launch now (default: at most 4 in flight)
//   status                            every ticket with its agent, worktree and last heartbeat
//   set <ticket> <status> [--agent <id>] [--worktree <path>] [--branch <name>] [--note <text>]
//   phase <name>                      the current phase: implement, review, verify, done
//   log <text>                        adds a line to the log of progress.md
//   beat <ticket> <step>              describes the current step of a ticket agent
//   watch [--stale <s>] [--every <s>] waits until an agent is silent for --stale seconds (prints
//                                     STALE <ids>) or nothing runs (prints IDLE), then exits
//   progress                          re-renders progress.md and prints its path
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';

import {
  STATES,
  blockedForGood,
  findStale,
  frontier,
  lockStatus,
  parseTicket,
  renderProgress,
  validatePlan,
} from './orchestrator.lib.mjs';

const fail = (message) => {
  console.error(`orchestrator: ${message}`);
  process.exit(1);
};

const gitDir = execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim();
const root = dirname(resolve(gitDir));
const dir = join(root, '.orchestrator');
mkdirSync(dir, { recursive: true });

const path = (name) => join(dir, name);
const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined);
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const now = () => new Date().toISOString();

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

function readTickets(specDir) {
  const issues = join(resolve(root, specDir), 'issues');
  if (!existsSync(issues)) fail(`no issues folder in ${specDir}`);
  return readdirSync(issues)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const ticket = parseTicket(name, readFileSync(join(issues, name), 'utf8'));
      return ticket && { ...ticket, path: join(issues, name) };
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
}

function readBeats(state) {
  return Object.fromEntries(
    Object.keys(state?.tickets ?? {}).flatMap((id) => {
      const beat = readJson(path(`${id}.json`));
      return beat ? [[id, beat]] : [];
    }),
  );
}

function loadState() {
  const state = readJson(path('state.json'));
  if (!state) fail('no orchestration: run `init <plan.json>` first');
  return state;
}

function saveState(state) {
  writeJson(path('state.json'), state);
  writeFileSync(path('progress.md'), renderProgress(state, readBeats(state), Date.now()));
}

const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case 'lock': {
    const session = process.env.CLAUDE_CODE_SESSION_ID;
    const pid = Number(process.env.CLAUDE_PID);
    if (!session || !pid) fail('run it from a Claude Code tool: CLAUDE_CODE_SESSION_ID is not set');
    const lock = readJson(path('lock'));
    const status = lockStatus(lock, session, isAlive);
    if (rest[0] === 'status') {
      console.log(status === 'free' ? 'free' : `${status}: ${JSON.stringify(lock)}`);
    } else if (rest[0] === 'acquire') {
      if (status === 'held') {
        fail(`session ${lock.session} (pid ${lock.pid}) holds the lock since ${lock.at}`);
      }
      writeJson(path('lock'), { session, pid, at: now(), root });
      console.log(status === 'stale' ? `took over a stale lock of ${lock.session}` : 'acquired');
    } else if (rest[0] === 'release') {
      if (status === 'held') fail(`the lock belongs to session ${lock.session}`);
      rmSync(path('lock'), { force: true });
      console.log('released');
    } else fail('lock acquire | release | status');
    break;
  }

  case 'tickets': {
    if (!rest[0]) fail('tickets <spec dir>');
    console.log(JSON.stringify(readTickets(rest[0]), null, 2));
    break;
  }

  case 'init': {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { force: { type: 'boolean', default: false } },
    });
    const previous = readJson(path('state.json'));
    if (previous && previous.phase !== 'done' && !values.force) {
      fail(
        `an orchestration of ${previous.spec} is unfinished (phase ${previous.phase}): ` +
          'resume it (`status`), or pass --force to discard it',
      );
    }
    const plan = readJson(resolve(positionals[0] ?? path('plan.json')));
    if (!plan?.spec || !plan.branch || !plan.base || !plan.tickets?.length) {
      fail('the plan needs spec, base, branch and a non-empty tickets list');
    }
    const all = new Map(readTickets(plan.spec).map((ticket) => [ticket.id, ticket]));
    const selected = plan.tickets.map(({ id, files }) => {
      const ticket = all.get(id) ?? fail(`no ticket ${id} in ${plan.spec}`);
      if (!files?.length) fail(`ticket ${id} has no predicted files`);
      return { ...ticket, files };
    });
    const done = [...all.values()].filter((ticket) => !ticket.open).map((ticket) => ticket.id);
    try {
      validatePlan(selected, done);
    } catch (error) {
      fail(error.message);
    }
    for (const ticket of selected) rmSync(path(`${ticket.id}.json`), { force: true });
    const state = {
      spec: plan.spec,
      base: plan.base,
      branch: plan.branch,
      startedAt: now(),
      phase: 'implement',
      tickets: Object.fromEntries(
        selected.map((t) => [
          t.id,
          {
            title: t.title,
            path: t.path,
            files: t.files,
            blockedBy: t.blockedBy,
            status: 'pending',
          },
        ]),
      ),
      log: [{ at: now(), text: `planned ${selected.length} tickets` }],
    };
    saveState(state);
    console.log(`planned ${selected.length} tickets; first to launch: ${frontier(state, 4)}`);
    break;
  }

  case 'next': {
    const { values } = parseArgs({
      args: rest,
      options: { max: { type: 'string', default: '4' } },
    });
    const state = loadState();
    const statuses = Object.values(state.tickets).map((ticket) => ticket.status);
    console.log(
      JSON.stringify({
        launch: frontier(state, Number(values.max)),
        inFlight: statuses.filter((s) => ['running', 'review', 'merging'].includes(s)).length,
        pending: statuses.filter((s) => s === 'pending').length,
        blockedForGood: blockedForGood(state),
      }),
    );
    break;
  }

  case 'status': {
    const state = loadState();
    const beats = readBeats(state);
    const tickets = Object.entries(state.tickets).map(([id, t]) => ({
      id,
      status: t.status,
      agent: t.agent,
      worktree: t.worktree ?? beats[id]?.cwd,
      branch: t.branch,
      beat: beats[id] && { at: beats[id].at, step: beats[id].step, tool: beats[id].tool },
      note: t.note,
    }));
    console.log(
      JSON.stringify(
        { spec: state.spec, branch: state.branch, phase: state.phase, tickets },
        null,
        2,
      ),
    );
    break;
  }

  case 'set': {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: {
        agent: { type: 'string' },
        worktree: { type: 'string' },
        branch: { type: 'string' },
        note: { type: 'string' },
      },
    });
    const [id, status] = positionals;
    if (!STATES.includes(status)) fail(`status must be one of ${STATES.join(', ')}`);
    const state = loadState();
    const ticket = state.tickets[id] ?? fail(`ticket ${id} is not in this orchestration`);
    Object.assign(ticket, values, { status });
    if (status === 'running') ticket.startedAt = now();
    state.log.push({
      at: now(),
      text: `${id} → ${status}${values.note ? `: ${values.note}` : ''}`,
    });
    saveState(state);
    break;
  }

  case 'phase':
  case 'log': {
    if (!rest.length) fail(`${command} <text>`);
    const state = loadState();
    const text = rest.join(' ');
    if (command === 'phase') state.phase = text;
    state.log.push({ at: now(), text: command === 'phase' ? `phase: ${text}` : text });
    saveState(state);
    break;
  }

  case 'beat': {
    const [id, ...step] = rest;
    if (!id || !step.length) fail('beat <ticket> <step>');
    const beat = readJson(path(`${id}.json`));
    writeJson(path(`${id}.json`), { ...beat, ticket: id, at: now(), step: step.join(' ') });
    const state = readJson(path('state.json'));
    if (state) saveState(state);
    break;
  }

  case 'watch': {
    const { values } = parseArgs({
      args: rest,
      options: {
        stale: { type: 'string', default: '600' },
        every: { type: 'string', default: '300' },
      },
    });
    const token = `${process.pid}-${Date.now()}`;
    const state = loadState();
    state.watcher = token;
    saveState(state);
    for (;;) {
      await sleep(Number(values.every) * 1000);
      const current = loadState();
      if (current.watcher !== token) {
        console.log('REPLACED by a newer watcher');
        break;
      }
      saveState(current);
      const stale = findStale(current, readBeats(current), Date.now(), Number(values.stale) * 1000);
      if (stale.length) {
        console.log(`STALE ${stale.join(' ')}`);
        break;
      }
      if (!Object.values(current.tickets).some((ticket) => ticket.status === 'running')) {
        console.log('IDLE');
        break;
      }
    }
    break;
  }

  case 'progress': {
    saveState(loadState());
    console.log(path('progress.md'));
    break;
  }

  default:
    fail('commands: lock, tickets, init, next, status, set, phase, log, beat, watch, progress');
}
