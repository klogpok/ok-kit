// State keeper of the `/orchestrate-spec` skill (`.claude/skills/orchestrate-spec/SKILL.md`).
// Several specs can be orchestrated at once. Each orchestration lives in `.orchestrator/<feature>/`
// of the main checkout (git-ignored), whichever worktree the command runs from: `lock`,
// `plan.json`, `state.json`, one `<ticket>.json` heartbeat per ticket, `progress.md`, which every
// write re-renders, and the logs of its checks. `<feature>` is the folder name under `.scratch/`.
// At the top level, `progress.md` is an index with one line per spec, and `verify.lock` lets one
// spec at a time run the full checks of its verify phase. All specs share one limit of agents in
// flight. The heartbeats are written by the hook `scripts/orchestrator-heartbeat.mjs` on every tool
// call of a ticket agent, into the folder of the spec whose running ticket names that agent; `beat`
// only adds a description of the step. An orchestration of an earlier run, kept at the top level,
// moves into the folder of its spec on the first command.
//
// Usage (`node <main checkout>/scripts/orchestrator.mjs <command> --spec <feature>`):
//   lock acquire | release | status   one orchestration per spec, owned by a Claude Code session
//   tickets <spec dir>                the tickets of a spec as JSON, closed ones included; takes no
//                                     --spec
//   init [<plan.json>] [--force]      checks the plan and writes state.json; refuses to replace an
//                                     unfinished orchestration without --force
//   next [--max <n>]                  the tickets to launch now (default: at most 4 in flight,
//                                     counted across every spec)
//   status                            every ticket with its agent, worktree and last heartbeat
//   set <ticket> <status> [--agent <id>] [--worktree <path>] [--branch <name>] [--note <text>]
//   phase <name>                      the current phase: implement, review, verify, done; leaving
//                                     verify releases the verify lock
//   log <text>                        adds a line to the log of progress.md
//   beat <ticket> <step>              describes the current step of a ticket agent
//   watch [--stale <s>] [--every <s>] waits until an agent is silent for --stale seconds (prints
//                                     STALE <ids>) or nothing runs (prints IDLE), then exits
//   verify-lock acquire [--every <s>] | release | status
//                                     acquire waits while another spec verifies, then takes it
//   progress                          re-renders progress.md and the index and prints the path
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';

import {
  STATES,
  blockedForGood,
  countInFlight,
  featureOf,
  findStale,
  frontier,
  legacyMoves,
  lockStatus,
  parseTicket,
  renderIndex,
  renderProgress,
  validatePlan,
} from './orchestrator.lib.mjs';

const fail = (message) => {
  console.error(`orchestrator: ${message}`);
  process.exit(1);
};

const gitDir = execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim();
const root = dirname(resolve(gitDir));
const base = join(root, '.orchestrator');
mkdirSync(base, { recursive: true });

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined);
const writeJson = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const now = () => new Date().toISOString();

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

/** The Claude Code session and process that own a lock. */
function claude() {
  const session = process.env.CLAUDE_CODE_SESSION_ID;
  const pid = Number(process.env.CLAUDE_PID);
  if (!session || !pid) fail('run it from a Claude Code tool: CLAUDE_CODE_SESSION_ID is not set');
  return { session, pid };
}

/** Every orchestration of the checkout, `feature → state`. A broken one is left out. */
function readStates() {
  const states = {};
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const state = readJson(join(base, entry.name, 'state.json'));
      if (state) states[entry.name] = state;
    } catch {
      console.error(`orchestrator: skipped the broken .orchestrator/${entry.name}/state.json`);
    }
  }
  return states;
}

const renderIndexFile = () =>
  writeFileSync(join(base, 'progress.md'), renderIndex(readStates(), Date.now()));

/**
 * Moves an orchestration of an earlier run, kept at the top level, into the folder of its spec.
 * `state.json` moves last, so a move cut short is finished by the next command; an entry another
 * command moved meanwhile is skipped.
 */
function migrateLegacy() {
  const legacy = readJson(join(base, 'state.json'));
  if (!legacy) return;
  const entries = readdirSync(base, { withFileTypes: true });
  const specDirs = entries
    .filter((entry) => entry.isDirectory() && existsSync(join(base, entry.name, 'state.json')))
    .map((entry) => entry.name);
  let moves;
  try {
    moves = legacyMoves(
      legacy,
      entries.map((entry) => entry.name),
      specDirs,
    );
  } catch (error) {
    fail(error.message);
  }
  mkdirSync(join(base, moves.feature), { recursive: true });
  for (const name of moves.names) {
    try {
      renameSync(join(base, name), join(base, moves.feature, name));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  renderIndexFile();
  console.error(
    `orchestrator: moved the orchestration of ${legacy.spec} to .orchestrator/${moves.feature}/`,
  );
}

/** Takes `--spec <feature>` (or `--spec=<feature>`) out of the arguments. */
function takeSpec(args) {
  const at = args.findIndex((arg) => arg === '--spec' || arg.startsWith('--spec='));
  if (at === -1) return { rest: args };
  const spaced = args[at] === '--spec';
  const value = spaced ? args[at + 1] : args[at].slice('--spec='.length);
  try {
    return { feature: featureOf(value), rest: args.toSpliced(at, spaced ? 2 : 1) };
  } catch (error) {
    return fail(error.message);
  }
}

migrateLegacy();

const [command, ...args] = process.argv.slice(2);
const { feature, rest } = command === 'tickets' ? { rest: args } : takeSpec(args);
if (!feature && command !== 'tickets' && command !== 'progress' && command) {
  fail(`${command} needs --spec <feature>, the folder name of the spec under .scratch/`);
}
const dir = feature && join(base, feature);
const path = (name) => join(dir, name);

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
  if (!state)
    fail(`no orchestration of ${feature}: run \`init <plan.json> --spec ${feature}\` first`);
  return state;
}

function saveState(state) {
  writeJson(path('state.json'), state);
  writeFileSync(path('progress.md'), renderProgress(state, readBeats(state), Date.now()));
  renderIndexFile();
}

/** Tickets in flight in the other orchestrations of the checkout. */
const inFlightElsewhere = () =>
  Object.entries(readStates())
    .filter(([name]) => name !== feature)
    .reduce((sum, [, state]) => sum + countInFlight(state), 0);

const verifyLockFile = join(base, 'verify.lock');

/** Drops the verify lock when this spec holds it. */
function releaseVerifyLock() {
  let lock;
  try {
    lock = readJson(verifyLockFile);
  } catch {
    return false;
  }
  if (lockStatus(lock, feature, isAlive, 'spec') !== 'own') return false;
  rmSync(verifyLockFile, { force: true });
  return true;
}

switch (command) {
  case 'lock': {
    const { session, pid } = claude();
    const lock = readJson(path('lock'));
    const status = lockStatus(lock, session, isAlive);
    if (rest[0] === 'status') {
      console.log(status === 'free' ? 'free' : `${status}: ${JSON.stringify(lock)}`);
    } else if (rest[0] === 'acquire') {
      if (status === 'held') {
        fail(
          `session ${lock.session} (pid ${lock.pid}) holds the lock of ${feature} since ${lock.at}`,
        );
      }
      writeJson(path('lock'), { session, pid, at: now(), root });
      console.log(status === 'stale' ? `took over a stale lock of ${lock.session}` : 'acquired');
    } else if (rest[0] === 'release') {
      if (status === 'held') fail(`the lock of ${feature} belongs to session ${lock.session}`);
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
    if (featureOf(plan.spec) !== feature) fail(`the plan is for ${plan.spec}, not for ${feature}`);
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
    console.log(
      `planned ${selected.length} tickets; first to launch: ${frontier(state, 4 - inFlightElsewhere())}`,
    );
    break;
  }

  case 'next': {
    const { values } = parseArgs({
      args: rest,
      options: { max: { type: 'string', default: '4' } },
    });
    const state = loadState();
    const elsewhere = inFlightElsewhere();
    console.log(
      JSON.stringify({
        launch: frontier(state, Number(values.max) - elsewhere),
        inFlight: countInFlight(state),
        elsewhere,
        pending: Object.values(state.tickets).filter((t) => t.status === 'pending').length,
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
    if (command === 'phase' && text !== 'verify' && releaseVerifyLock()) {
      state.log.push({ at: now(), text: 'released the verify lock' });
    }
    saveState(state);
    break;
  }

  case 'beat': {
    const [id, ...step] = rest;
    if (!id || !step.length) fail('beat <ticket> <step> --spec <feature>');
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

  case 'verify-lock': {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { every: { type: 'string', default: '30' } },
    });
    const { session, pid } = claude();
    const status = (lock) => lockStatus(lock, feature, isAlive, 'spec');
    if (positionals[0] === 'status') {
      const lock = readJson(verifyLockFile);
      console.log(status(lock) === 'free' ? 'free' : `${status(lock)}: ${JSON.stringify(lock)}`);
    } else if (positionals[0] === 'acquire') {
      // A lock that cannot be read is being written; one still unreadable a round later is stale.
      const read = () => {
        try {
          return readJson(verifyLockFile);
        } catch {
          return { spec: 'an unknown spec', broken: true };
        }
      };
      let waiting = false;
      let broken = 0;
      for (;;) {
        const lock = read();
        broken = lock?.broken ? broken + 1 : 0;
        const current = lock?.broken ? (broken < 2 ? 'held' : 'stale') : status(lock);
        if (current === 'own') {
          console.log('acquired');
          break;
        }
        if (current === 'stale') {
          // Delete only the stale lock that was read, not one another spec took meanwhile.
          const again = read();
          if (again?.broken ? lock.broken : again?.at === lock.at && again?.pid === lock.pid) {
            rmSync(verifyLockFile, { force: true });
          }
        }
        if (current !== 'held') {
          try {
            // `wx` fails when another spec created the lock since it was read.
            writeFileSync(
              verifyLockFile,
              `${JSON.stringify({ spec: feature, session, pid, at: now() }, null, 2)}\n`,
              { flag: 'wx' },
            );
            console.log(
              current === 'stale' ? `took over a stale verify lock of ${lock.spec}` : 'acquired',
            );
            break;
          } catch (error) {
            if (error.code !== 'EEXIST') throw error;
            continue;
          }
        }
        if (!waiting && !lock.broken) {
          console.log(`waiting: ${lock.spec} is in verify since ${lock.at}`);
          waiting = true;
        }
        await sleep(
          (lock.broken ? Math.min(Number(values.every), 1) : Number(values.every)) * 1000,
        );
      }
    } else if (positionals[0] === 'release') {
      const lock = readJson(verifyLockFile);
      const current = status(lock);
      if (current === 'held') fail(`the verify lock belongs to ${lock.spec}`);
      if (current === 'own') releaseVerifyLock();
      if (current === 'stale') rmSync(verifyLockFile, { force: true });
      console.log(
        current === 'stale' ? `released a stale verify lock of ${lock.spec}` : 'released',
      );
    } else fail('verify-lock acquire | release | status');
    break;
  }

  case 'progress': {
    if (feature) saveState(loadState());
    else renderIndexFile();
    console.log(feature ? path('progress.md') : join(base, 'progress.md'));
    break;
  }

  default:
    fail(
      'commands: lock, tickets, init, next, status, set, phase, log, beat, watch, verify-lock, ' +
        'progress; every one but tickets takes --spec <feature>',
    );
}
