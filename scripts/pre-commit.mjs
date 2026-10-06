// Pre-commit checks on the staged files: Prettier on what `pnpm format:check` covers, ESLint and
// Stylelint on what `pnpm lint` covers, and the `.scratch/` tracker check. The checks read the
// working tree, so a file staged in part is checked as it is on disk.
//
// Installed by `pnpm install` (`prepare` sets `core.hooksPath` to `.githooks`).
import { execFileSync, spawnSync } from 'node:child_process';

const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

const pick = (pattern) => staged.filter((file) => pattern.test(file));
const checks = [
  [
    'prettier',
    'node_modules/prettier/bin/prettier.cjs',
    ['--check'],
    pick(/^(projects|scripts)\/.*\.(ts|mts|mjs|html|scss|json)$/),
  ],
  ['eslint', 'node_modules/eslint/bin/eslint.js', [], pick(/^projects\/.*\.(ts|mts|html)$/)],
  ['stylelint', 'node_modules/stylelint/bin/stylelint.mjs', [], pick(/^projects\/.*\.scss$/)],
  ['check-scratch', 'scripts/check-scratch.mjs', [], pick(/^\.scratch\//)],
];

let failed = false;
for (const [name, script, args, files] of checks) {
  if (files.length === 0) continue;
  // The tracker check always reads the whole `.scratch/` tree, so it takes no file list.
  const fileArgs = name === 'check-scratch' ? [] : files;
  const result = spawnSync(process.execPath, [script, ...args, ...fileArgs], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`pre-commit: ${name} failed`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
