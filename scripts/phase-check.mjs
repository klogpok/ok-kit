// Runs the automated checks of the `/phase-check` skill in order and stops at the first failure.
// Each step's full output goes to `dist/phase-check/<step>.log`; the console gets one line per
// step, the error tail of a failed step, and at the end the lines the phase report quotes
// (tests, coverage, stories, captures, budget warnings).
//
// Usage:
//   pnpm phase-check
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { STEPS, facts, tail } from './phase-check.lib.mjs';

const logDir = join('dist', 'phase-check');
mkdirSync(logDir, { recursive: true });

// A worktree starts at `origin/master`, which lags the local `master`.
if (spawnSync('git', ['merge-base', '--is-ancestor', 'master', 'HEAD']).status !== 0) {
  console.error('The branch does not contain the local master: run `git merge --ff-only master`.');
  process.exit(1);
}

const report = [];
for (const step of STEPS) {
  const started = Date.now();
  const run = spawnSync('pnpm', step.args, {
    shell: true,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  const log = join(logDir, `${step.name.replace(/:/g, '-')}.log`);
  writeFileSync(log, output);
  const seconds = Math.round((Date.now() - started) / 1000);
  if (run.status !== 0) {
    console.log(`FAIL ${step.name} (${seconds}s), full log: ${log}`);
    console.log(tail(output).join('\n'));
    process.exit(1);
  }
  console.log(`ok   ${step.name} (${seconds}s)`);
  const found = facts(step, output);
  if (found.length > 0) report.push(`${step.name}:`, ...found.map((line) => `  ${line}`));
}

console.log('\nAll steps passed. For the report:');
console.log(report.join('\n'));
