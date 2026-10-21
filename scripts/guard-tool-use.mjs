// PreToolUse hook of this repo (`.claude/settings.json`), for the Bash, PowerShell and Skill tools.
// Exit code 2 blocks the tool call and shows stderr to the agent. It blocks:
// - killing a process that this Claude Code session did not start: a kill by name or pattern, a
//   kill whose target is not a literal PID, and a PID that is not a descendant of `CLAUDE_PID`;
// - `git commit` that skips the hooks (`--no-verify`, `-n`, a `core.hooksPath` override);
// - starting `/orchestrate-spec` while another live session holds `.orchestrator/lock`.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { isDescendant, killTargets, lockStatus, skipsGitHooks } from './orchestrator.lib.mjs';

const block = (message) => {
  process.stderr.write(`Blocked by scripts/guard-tool-use.mjs: ${message}\n`);
  process.exit(2);
};

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

if (input.tool_name === 'Skill') {
  if (/(^|:)orchestrate-spec$/.test(input.tool_input?.skill ?? '')) {
    const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? '.';
    const file = join(root, '.orchestrator', 'lock');
    const lock = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined;
    if (lockStatus(lock, input.session_id, isAlive) === 'held') {
      block(
        `another Claude Code session (${lock.session}, pid ${lock.pid}) has been orchestrating ` +
          `this checkout since ${lock.at}. Wait for it to finish, or ask the user to stop it.`,
      );
    }
  }
  process.exit(0);
}

const command = input.tool_input?.command ?? '';
if (!command) process.exit(0);

if (skipsGitHooks(command)) {
  block(
    'git commit must run the hooks. Fix what the pre-commit hook reports instead of skipping it.',
  );
}

const targets = killTargets(command);
const hint =
  'Kill only processes this session started, by their literal PID: `Stop-Process -Id <pid>` ' +
  '(PowerShell) or `taskkill //PID <pid> //T //F` (Bash). Stop a background task with TaskStop.';
if (targets.byName) {
  block(`${targets.byName} kills processes by name or pattern and can hit the user's own. ${hint}`);
}
if (targets.unresolved.length) {
  block(`cannot tell whose process \`${targets.unresolved.join(' ')}\` is. ${hint}`);
}
if (!targets.pids.length) process.exit(0);

/** `pid → ppid` and `pid → name` of every process. */
function processTable() {
  const parents = new Map();
  const names = new Map();
  const rows =
    process.platform === 'win32'
      ? spawnSync(
          'powershell.exe',
          [
            '-NoProfile',
            '-Command',
            'Get-CimInstance Win32_Process | ForEach-Object { "$($_.ProcessId) $($_.ParentProcessId) $($_.Name)" }',
          ],
          { encoding: 'utf8' },
        ).stdout
      : spawnSync('ps', ['-A', '-o', 'pid=,ppid=,comm='], { encoding: 'utf8' }).stdout;
  for (const line of (rows ?? '').split(/\r?\n/)) {
    const [pid, ppid, ...name] = line.trim().split(/\s+/);
    if (!pid) continue;
    parents.set(Number(pid), Number(ppid));
    names.set(Number(pid), name.join(' '));
  }
  return { parents, names };
}

/** A Git Bash `kill` takes MSYS PIDs on Windows; `/proc/<pid>/winpid` maps one to Windows. */
function windowsPid(msysPid) {
  const bash = process.env.CLAUDE_CODE_GIT_BASH_PATH || 'bash';
  const out = spawnSync(bash, ['-c', `cat /proc/${msysPid}/winpid`], { encoding: 'utf8' }).stdout;
  const pid = Number(out?.trim());
  return pid > 0 ? pid : undefined;
}

const { parents, names } = processTable();
let rootPid = Number(process.env.CLAUDE_PID);
if (!rootPid) {
  // Fall back to the nearest ancestor of this hook that is the Claude Code binary.
  for (let pid = process.ppid; pid > 0 && !rootPid; pid = parents.get(pid) ?? 0) {
    if (/^claude(\.exe)?$/i.test(names.get(pid) ?? '')) rootPid = pid;
  }
}
if (!rootPid) block(`cannot find this Claude Code process, so no kill can be checked. ${hint}`);

for (const target of targets.pids) {
  const pid =
    target.msys && process.platform === 'win32'
      ? (windowsPid(target.pid) ?? target.pid)
      : target.pid;
  if (!pid || !isDescendant(parents, pid, rootPid)) {
    const name = names.get(pid) ? ` (${names.get(pid)})` : '';
    block(`process ${target.pid}${name} was not started by this Claude Code session. ${hint}`);
  }
}
process.exit(0);
