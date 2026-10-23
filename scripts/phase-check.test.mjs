// Tests of the output parsing of `phase-check.mjs`. Run with `pnpm test-scripts`.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { STEPS, facts, tail } from './phase-check.lib.mjs';

const step = (name) => STEPS.find((s) => s.name === name);
const esc = String.fromCharCode(27);

describe('facts', () => {
  it('keeps the test count and the four coverage totals', () => {
    const output = [
      ' Test Files  98 passed (98)',
      `${esc}[32m      Tests  1000 passed (1000)${esc}[39m\r`,
      'All files          |   98.67 |    83.61 |    94.5 |   98.67 |',
      'ok   statements 98.67% (min 94%)',
      'ok   branches   83.61% (min 80%)',
      'ok   functions  94.50% (min 88%)',
      'FAIL lines      95.00% (min 96%)',
    ].join('\n');
    assert.deepEqual(facts(step('test:coverage'), output), [
      'Tests  1000 passed (1000)',
      'ok   statements 98.67% (min 94%)',
      'ok   branches   83.61% (min 80%)',
      'ok   functions  94.50% (min 88%)',
      'FAIL lines      95.00% (min 96%)',
    ]);
  });

  it('keeps the budget warnings of the playground build, each once', () => {
    const output = [
      '▲ [WARNING] bundle initial exceeded maximum budget. Budget 500 kB was not met by 12 kB.',
      'Output location: dist/playground',
      '▲ [WARNING] bundle initial exceeded maximum budget. Budget 500 kB was not met by 12 kB.',
    ].join('\n');
    assert.deepEqual(facts(step('build:playground'), output), [
      '▲ [WARNING] bundle initial exceeded maximum budget. Budget 500 kB was not met by 12 kB.',
    ]);
  });

  it('keeps the story and capture counts', () => {
    assert.deepEqual(
      facts(
        step('test-host-css'),
        'Checked 314 stories, 716 captures (light-rtl).\n9 capture(s) where only…\nnoise',
      ),
      ['Checked 314 stories, 716 captures (light-rtl).', '9 capture(s) where only…'],
    );
    assert.deepEqual(facts(step('test-visual'), 'Compared 314 stories in 3 modes.'), [
      'Compared 314 stories in 3 modes.',
    ]);
  });

  it('keeps the pass count of both node:test reporters', () => {
    assert.deepEqual(facts(step('test-scripts'), 'ℹ tests 40\nℹ pass 40\n# pass 3'), [
      'ℹ pass 40',
      '# pass 3',
    ]);
  });

  it('keeps nothing for a step without facts', () => {
    assert.deepEqual(facts(step('lint'), 'All files pass linting.'), []);
  });
});

describe('tail', () => {
  it('returns the last non-empty lines without colours', () => {
    const output = `a\n\nb\r\n${esc}[31mX [ERROR] TS2322${esc}[39m\n\n`;
    assert.deepEqual(tail(output, 2), ['b', 'X [ERROR] TS2322']);
  });
});
