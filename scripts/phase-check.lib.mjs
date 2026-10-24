// Steps of `pnpm phase-check` and the report lines each one leaves. See `phase-check.mjs`.

/**
 * The automated checks of the `/phase-check` skill, in order: later steps use earlier builds.
 * `facts` pick the lines the phase report quotes out of a step's output.
 */
export const STEPS = [
  { name: 'tokens', args: ['tokens'] },
  { name: 'lint', args: ['lint'] },
  { name: 'format:check', args: ['format:check'] },
  {
    name: 'test:coverage',
    args: ['test:coverage'],
    facts: [/^\s*Tests\s+\d+ passed/, /^(ok {2}|FAIL) \w+\s+[\d.]+% \(min/],
  },
  { name: 'test:playground', args: ['test:playground'], facts: [/^\s*Tests\s+\d+ passed/] },
  { name: 'test-scripts', args: ['test-scripts'], facts: [/^[ℹ#] (pass|fail) \d+/] },
  { name: 'build', args: ['build'] },
  { name: 'build:playground', args: ['build:playground'], facts: [/budget/i] },
  { name: 'build-storybook', args: ['build-storybook'] },
  {
    name: 'stories:types',
    args: ['exec', 'ngc', '-p', 'projects/ui-kit/.storybook/tsconfig.json', '--noEmit'],
  },
  { name: 'test-storybook', args: ['test-storybook'], facts: [/^Checked \d+ stories/] },
  { name: 'test-visual', args: ['test-visual'], facts: [/^Compared \d+ stories/] },
  {
    name: 'test-host-css',
    args: ['test-host-css'],
    facts: [/^Checked \d+ stories, \d+ captures/, /^\d+ capture\(s\)/],
  },
];

/** The steps from the one named `from` on (all of them without a name). */
export function stepsFrom(from) {
  if (from === undefined) return STEPS;
  const index = STEPS.findIndex((step) => step.name === from);
  if (index < 0) {
    throw new Error(`unknown step "${from}"; steps: ${STEPS.map((step) => step.name).join(', ')}`);
  }
  return STEPS.slice(index);
}

const ANSI = /\u001b\[[0-9;]*m/g;

/** The output as plain lines: colours, carriage returns and trailing spaces removed. */
export function lines(output) {
  return output
    .replace(ANSI, '')
    .split('\n')
    .map((line) => line.replace(/\r/g, '').trimEnd());
}

/** The lines of `output` that match one of the step's `facts`, each once, in output order. */
export function facts(step, output) {
  const patterns = step.facts ?? [];
  const found = lines(output).filter((line) => patterns.some((pattern) => pattern.test(line)));
  return [...new Set(found.map((line) => line.trim()))];
}

/** The last `count` non-empty lines of `output`, where a failing tool prints its error. */
export function tail(output, count = 40) {
  return lines(output)
    .filter((line) => line.trim() !== '')
    .slice(-count);
}
