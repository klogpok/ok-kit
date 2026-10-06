// Coverage thresholds: the Angular 20 unit-test builder has no threshold option and starts Vitest
// with `config: false`, so the thresholds are checked here, against the `json-summary` report the
// builder writes to `coverage/coverage-summary.json`. Fails when any total is below its threshold.
//
// Usage:
//   pnpm test:coverage   (runs the tests with coverage, then this script)
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Minimum share of covered items per metric, in percent. Branches was 90 under Vitest 5, whose v8
 * coverage remaps through the AST; Vitest 3 remaps the compiled output and counts more branches,
 * so the same suite reads about 81% (see DECISIONS).
 */
const THRESHOLDS = { statements: 94, branches: 80, functions: 88, lines: 96 };

const summaryPath = resolve('coverage/coverage-summary.json');
const { total } = JSON.parse(await readFile(summaryPath, 'utf8'));

const failures = Object.entries(THRESHOLDS).filter(([metric, min]) => total[metric].pct < min);
for (const [metric, min] of Object.entries(THRESHOLDS)) {
  const { pct } = total[metric];
  console.log(
    `${pct < min ? 'FAIL' : 'ok  '} ${metric.padEnd(10)} ${pct.toFixed(2)}% (min ${min}%)`,
  );
}
if (failures.length > 0) {
  console.error(`Coverage is below the threshold for ${failures.map(([m]) => m).join(', ')}.`);
  process.exit(1);
}
