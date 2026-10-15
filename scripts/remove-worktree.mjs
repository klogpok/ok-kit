// Removes a git worktree under `.claude/worktrees/` and repairs the main checkout after it:
// - refuses a worktree with uncommitted changes;
// - unlocks it (agent worktrees are locked, and `git worktree prune` skips a locked one);
// - deletes the folder with `cmd /c rmdir /s /q`, which does not follow the junctions pnpm leaves;
// - when a file stays busy, lists it and the processes whose command line names it, and stops;
// - prunes the worktree, deletes its branch when it is merged, reinstalls the root `node_modules`
//   (pnpm relinks them into a worktree) and checks that `@angular/core` resolves from the root.
//
// Usage, from the main checkout, with the PowerShell tool (pnpm gets "Access denied" from Bash):
//   node scripts/remove-worktree.mjs <name>   (a folder name in .claude/worktrees/, or its path)
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, relative, resolve, sep } from 'node:path';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const fail = (message) => {
  console.error(`remove-worktree: ${message}`);
  process.exit(1);
};
const same = (a, b) => resolve(a).toLowerCase() === resolve(b).toLowerCase();

const arg = process.argv[2];
if (!arg) fail('usage: node scripts/remove-worktree.mjs <name>');

const root = git('rev-parse', '--show-toplevel');
if (!same(git('rev-parse', '--absolute-git-dir'), join(root, '.git'))) {
  fail('run it from the main checkout, not from a worktree');
}

const path = resolve(root, '.claude', 'worktrees', basename(arg));
const entry = git('worktree', 'list', '--porcelain')
  .split(/\n\n+/)
  .map((block) => Object.fromEntries(block.split('\n').map((line) => line.split(/ (.*)/s, 2))))
  .find((worktree) => worktree.worktree && same(worktree.worktree, path));
if (!entry) fail(`no worktree at ${path}`);
const branch = entry.branch?.replace('refs/heads/', '');

// After a run stopped by a busy file the `.git` file is gone, and `git -C` would read the main
// checkout instead.
if (existsSync(join(path, '.git')) && git('-C', path, 'status', '--porcelain')) {
  fail(`${path} has uncommitted changes; commit or discard them first`);
}

if ('locked' in entry) git('worktree', 'unlock', path);

spawnSync('cmd', ['/c', 'rmdir', '/s', '/q', path], { stdio: 'inherit' });
if (existsSync(path)) {
  const left = files(path).map((file) => relative(path, file));
  const needles = [basename(path), ...left].map((file) => file.split(sep).join('/').toLowerCase());
  const processes = JSON.parse(
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        'Get-CimInstance Win32_Process | Select-Object ProcessId, Name, CommandLine | ConvertTo-Json',
      ],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    ),
  ).filter(({ ProcessId, CommandLine }) => {
    const line = (CommandLine ?? '').replaceAll('\\', '/').toLowerCase();
    return ProcessId !== process.pid && needles.some((needle) => line.includes(needle));
  });
  console.error(`remove-worktree: ${path} is still there; busy files:`);
  for (const file of left) console.error(`  ${file}`);
  if (left.length === 0)
    console.error('  (no files: a folder is some process’s working directory)');
  for (const { ProcessId, Name, CommandLine } of processes) {
    console.error(`  PID ${ProcessId} ${Name}: ${CommandLine.slice(0, 160)}`);
  }
  const pids = processes.map(({ ProcessId }) => `/PID ${ProcessId}`).join(' ');
  fail(
    pids
      ? `stop them (taskkill ${pids} /F) and run this again`
      : 'no command line names them; look for a shell or `tail -f` started inside the folder',
  );
}

git('worktree', 'prune');
if (branch) {
  const deleted = spawnSync('git', ['branch', '-d', branch], { encoding: 'utf8' });
  console.log(
    deleted.status === 0
      ? `deleted branch ${branch}`
      : `kept branch ${branch}: ${deleted.stderr.trim()}`,
  );
}

const install = spawnSync('pnpm install --frozen-lockfile --prefer-offline', {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});
if (install.status !== 0) fail('pnpm install failed in the main checkout');

const core = createRequire(join(root, 'package.json')).resolve('@angular/core/package.json');
if (!core.toLowerCase().startsWith(resolve(root, 'node_modules').toLowerCase())) {
  fail(`@angular/core resolves outside the main checkout: ${core}`);
}
console.log(`removed ${path}; node_modules resolve from the main checkout`);

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const full = join(dir, item.name);
    return item.isDirectory() && !item.isSymbolicLink() ? files(full) : [full];
  });
}
