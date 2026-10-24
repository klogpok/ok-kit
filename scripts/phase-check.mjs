// Runs the automated checks of the `/phase-check` skill in order and stops at the first failure.
// Each step's full output goes to `dist/phase-check/<step>.log`; the console gets one line per
// step, the error tail of a failed step, and the lines the phase report quotes (tests, coverage,
// stories, captures, budget warnings) of every step that passed, also when a later one fails.
//
// Usage:
//   pnpm phase-check
//   pnpm phase-check --from <step>   resume an interrupted run at <step>: the earlier steps are
//                                    not run, so their builds (dist/, storybook-static/) must
//                                    still be those of this commit
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { facts, stepsFrom, tail } from './phase-check.lib.mjs';

const logDir = join('dist', 'phase-check');
mkdirSync(logDir, { recursive: true });

// A worktree starts at `origin/master`, which lags the local `master`.
if (spawnSync('git', ['merge-base', '--is-ancestor', 'master', 'HEAD']).status !== 0) {
  console.error('The branch does not contain the local master: run `git merge --ff-only master`.');
  process.exit(1);
}

const { from } = parseArgs({ options: { from: { type: 'string' } } }).values;
let steps;
try {
  steps = stepsFrom(from);
} catch (error) {
  console.error(`phase-check: ${error.message}`);
  process.exit(1);
}
if (from) console.log(`Starting at ${from}; the steps before it were not run.`);

const report = [];
const printReport = (heading) => {
  if (report.length === 0) return;
  console.log(`\n${heading}`);
  console.log(report.join('\n'));
};
for (const step of steps) {
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
    printReport('The steps that passed, for the report:');
    process.exit(1);
  }
  console.log(`ok   ${step.name} (${seconds}s)`);
  const found = facts(step, output);
  if (found.length > 0) report.push(`${step.name}:`, ...found.map((line) => `  ${line}`));
}

console.log('\nAll steps passed.');
printReport('For the report:');
