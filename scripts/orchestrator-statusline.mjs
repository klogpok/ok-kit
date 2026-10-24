// Status line of this repo (`.claude/settings.json`): the orchestrations of `/orchestrate-spec`
// that are not done yet, read from `.orchestrator/` of the main checkout. It finds that folder
// upwards from the session's folder, so a session in `.claude/worktrees/<name>` shows it too. An
// orchestration whose lock is gone or names a dead process shows `no session`. It never fails: no orchestration, a half-written file or any other error prints nothing.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { lockStatus, renderStatusLine } from './orchestrator.lib.mjs';

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
};

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

/** The nearest `.orchestrator` folder at or above `dir`. */
function findBase(dir) {
  for (let current = dir; ; current = dirname(current)) {
    if (existsSync(join(current, '.orchestrator'))) return join(current, '.orchestrator');
    if (dirname(current) === current) return undefined;
  }
}

try {
  let event = {};
  try {
    event = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    // No input: start from the current folder.
  }
  const base = findBase(event.workspace?.current_dir ?? event.cwd ?? process.cwd());
  if (base) {
    const states = {};
    const beatsOf = {};
    const locks = {};
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const state = readJson(join(base, entry.name, 'state.json'));
      if (!state?.tickets) continue;
      states[entry.name] = state;
      locks[entry.name] = lockStatus(readJson(join(base, entry.name, 'lock')), undefined, isAlive);
      beatsOf[entry.name] = Object.fromEntries(
        Object.keys(state.tickets).flatMap((id) => {
          const beat = readJson(join(base, entry.name, `${id}.json`));
          return beat ? [[id, beat]] : [];
        }),
      );
    }
    const line = renderStatusLine(states, beatsOf, Date.now(), locks);
    if (line) console.log(line);
  }
} catch {
  // A status line must never show an error.
}
