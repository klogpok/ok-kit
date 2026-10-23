// Tests of the pure logic of `orchestrator.mjs`, `orchestrator-heartbeat.mjs`,
// `orchestrator-statusline.mjs` and `guard-tool-use.mjs`, and of the scripts themselves on a
// throwaway git repo with two specs.
// Run with `pnpm test-scripts`.
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  agentSpec,
  blockedForGood,
  countInFlight,
  duration,
  featureOf,
  findStale,
  flightSpans,
  forecast,
  frontier,
  heartbeatFor,
  isDescendant,
  killTargets,
  legacyMoves,
  lockStatus,
  parseTicket,
  pathsOverlap,
  phaseTimes,
  progressBar,
  range,
  renderGraph,
  renderIndex,
  renderProgress,
  renderStatusLine,
  renderTime,
  renderTimeline,
  skipsGitHooks,
  ticketTimes,
  validatePlan,
} from './orchestrator.lib.mjs';

describe('parseTicket', () => {
  const ticket = (body) => parseTicket('03-overlays.md', body);

  it('reads the number, title, status and blockers of the English part', () => {
    const parsed = ticket(
      [
        '# 03: Overlays fit the viewport',
        '',
        '**Blocked by:** 01 (Tooltip defaults 2), 02',
        '',
        '**Status:** ready-for-agent',
        '',
        '## Русский перевод',
        '',
        '**Статус:** ready-for-agent',
      ].join('\n'),
    );
    assert.deepEqual(parsed, {
      id: '03',
      title: 'Overlays fit the viewport',
      status: 'ready-for-agent',
      open: true,
      deferred: false,
      blockedBy: ['01', '02'],
    });
  });

  it('treats "None" as no blockers and a plain Status line like the bold one', () => {
    const parsed = ticket('# T\n\nBlocked by: None (can start immediately)\n\nStatus: done\n');
    assert.deepEqual(parsed.blockedBy, []);
    assert.equal(parsed.status, 'done');
    assert.equal(parsed.open, false);
  });

  it('keeps a deferred ticket open and flags it', () => {
    const parsed = ticket('# T\n\n**Status:** needs-info\n\nDeferred until phase 10.\n');
    assert.equal(parsed.open, true);
    assert.equal(parsed.deferred, true);
  });

  it('ignores files without a number', () => {
    assert.equal(parseTicket('README.md', '# Notes'), undefined);
  });
});

describe('pathsOverlap', () => {
  it('matches equal paths and a folder with a file inside it', () => {
    assert.ok(pathsOverlap('projects/ui-kit/select', 'projects/ui-kit/select/select.ts'));
    assert.ok(pathsOverlap('./a/b.ts', 'a\\b.ts'));
    assert.ok(!pathsOverlap('projects/ui-kit/select', 'projects/ui-kit/select-items/x.ts'));
  });
});

describe('validatePlan', () => {
  const t = (id, blockedBy = []) => ({ id, blockedBy });

  it('accepts selected and closed blockers', () => {
    assert.doesNotThrow(() => validatePlan([t('01'), t('02', ['01']), t('05', ['03'])], ['03']));
  });

  it('rejects a blocker that is neither selected nor closed, and a cycle', () => {
    assert.throws(() => validatePlan([t('05', ['04'])]), /05 is blocked by 04/);
    assert.throws(() => validatePlan([t('01', ['02']), t('02', ['01'])]), /cycle between 01, 02/);
  });
});

describe('frontier', () => {
  const t = (status, blockedBy = [], files) => ({ status, blockedBy, files });
  const state = (tickets) => ({ tickets });

  it('starts every pending ticket whose blockers are merged and whose files are free', () => {
    const s = state({
      '01': t('merged', [], ['a']),
      '02': t('pending', ['01'], ['b']),
      '03': t('pending', ['04'], ['c']),
      '04': t('running', [], ['d']),
      '05': t('pending', ['99'], ['e']),
    });
    assert.deepEqual(frontier(s), ['02', '05']);
  });

  it('holds back a ticket whose files overlap one in flight or one picked before it', () => {
    const s = state({
      '01': t('review', [], ['projects/ui-kit/select']),
      '02': t('pending', [], ['projects/ui-kit/select/select.ts']),
      '03': t('pending', [], ['x']),
      '04': t('pending', [], ['x/y.ts']),
    });
    assert.deepEqual(frontier(s), ['03']);
  });

  it('keeps at most `max` tickets in flight', () => {
    const s = state({
      '01': t('running', [], ['a']),
      '02': t('pending', [], ['b']),
      '03': t('pending', [], ['c']),
    });
    assert.deepEqual(frontier(s, 2), ['02']);
    assert.deepEqual(frontier(s, 1), []);
  });
});

describe('countInFlight', () => {
  it('counts running, review and merging tickets', () => {
    const tickets = Object.fromEntries(
      ['pending', 'running', 'review', 'merging', 'merged', 'failed'].map((status, i) => [
        `0${i}`,
        { status },
      ]),
    );
    assert.equal(countInFlight({ tickets }), 3);
    assert.equal(countInFlight(undefined), 0);
  });
});

describe('featureOf', () => {
  it('takes the folder name under .scratch from a name or a path', () => {
    assert.equal(featureOf('popup-listbox-field'), 'popup-listbox-field');
    assert.equal(featureOf('.scratch/phase-10/'), 'phase-10');
    assert.equal(featureOf('D:\\projects\\ui-kit-20\\.scratch\\phase_10.b'), 'phase_10.b');
  });

  it('rejects what cannot be a folder name', () => {
    assert.throws(() => featureOf(''), /not a spec/);
    assert.throws(() => featureOf('..'), /not a spec/);
    assert.throws(() => featureOf(undefined), /not a spec/);
  });
});

describe('agentSpec', () => {
  it('finds the spec whose running ticket the agent works on', () => {
    const states = {
      a: { tickets: { '01': { status: 'running', agent: 'a1' } } },
      b: { tickets: { '01': { status: 'running', agent: 'b1' } } },
      c: { tickets: { '01': { status: 'merged', agent: 'c1' } } },
      d: {},
    };
    assert.equal(agentSpec(states, 'b1'), 'b');
    assert.equal(agentSpec(states, 'a1'), 'a');
    assert.equal(agentSpec(states, 'c1'), undefined);
    assert.equal(agentSpec(states, 'zz'), undefined);
    assert.equal(agentSpec(states, undefined), undefined);
  });
});

describe('legacyMoves', () => {
  const state = { spec: '.scratch/popup-listbox-field', phase: 'review', tickets: {} };

  it('moves everything of a top-level orchestration into the folder of its spec, state last', () => {
    const names = ['plan.json', 'lock', '01.json', 'progress.md', 'verify', 'x'];
    assert.deepEqual(
      legacyMoves(state, ['state.json', ...names, 'verify.lock', 'other'], ['other']),
      { feature: 'popup-listbox-field', names: [...names, 'state.json'] },
    );
  });

  it('finishes a move cut short: the folder of its spec without a state is not in the way', () => {
    assert.deepEqual(legacyMoves(state, ['state.json', 'popup-listbox-field', 'x'], []), {
      feature: 'popup-listbox-field',
      names: ['x', 'state.json'],
    });
  });

  it('refuses when the folder of its spec already holds an orchestration', () => {
    assert.throws(
      () => legacyMoves(state, ['state.json', 'popup-listbox-field'], ['popup-listbox-field']),
      /already holds/,
    );
  });
});

describe('blockedForGood', () => {
  it('lists pending tickets behind a failed or skipped blocker', () => {
    const s = {
      tickets: {
        '01': { status: 'failed', blockedBy: [] },
        '02': { status: 'pending', blockedBy: ['01'] },
        '03': { status: 'pending', blockedBy: [] },
      },
    };
    assert.deepEqual(blockedForGood(s), ['02']);
  });
});

describe('findStale', () => {
  const now = Date.parse('2026-10-21T12:00:00Z');
  const state = {
    tickets: {
      '01': { status: 'running', startedAt: '2026-10-21T11:00:00Z' },
      '02': { status: 'running', startedAt: '2026-10-21T11:59:00Z' },
      '03': { status: 'running', startedAt: '2026-10-21T11:00:00Z' },
      '04': { status: 'merged', startedAt: '2026-10-21T10:00:00Z' },
      '05': { status: 'running', startedAt: '2026-10-21T11:00:00Z' },
      '06': { status: 'running', startedAt: '2026-10-21T11:00:00Z' },
    },
  };

  it('returns running tickets silent for longer than the limit', () => {
    const beats = {
      '03': { at: '2026-10-21T11:55:00Z' },
      '05': { at: '2026-10-21T11:45:00Z', inTool: true },
      '06': { at: '2026-10-21T11:35:00Z', inTool: true },
    };
    assert.deepEqual(findStale(state, beats, now, 10 * 60_000), ['01', '06']);
  });
});

describe('heartbeatFor', () => {
  const state = {
    tickets: {
      '01': { status: 'running', agent: 'a1' },
      '02': { status: 'merged', agent: 'a2' },
    },
  };
  const now = Date.parse('2026-10-21T12:00:00Z');
  const event = (agent, hook = 'PostToolUse') => ({
    agent_id: agent,
    hook_event_name: hook,
    tool_name: 'Bash',
    cwd: 'D:\\wt\\t01',
  });

  it('beats for the agent of a running ticket and keeps its step', () => {
    const beats = { '01': { at: '2026-10-21T11:00:00Z', step: 'red: test' } };
    assert.deepEqual(heartbeatFor(state, beats, event('a1', 'PreToolUse'), now), {
      id: '01',
      beat: {
        ticket: '01',
        at: '2026-10-21T12:00:00.000Z',
        step: 'red: test',
        tool: 'Bash',
        inTool: true,
        cwd: 'D:\\wt\\t01',
      },
    });
    assert.equal(heartbeatFor(state, beats, event('a1'), now).beat.inTool, false);
  });

  it('ignores the orchestrator, finished tickets and unknown agents', () => {
    assert.equal(heartbeatFor(state, {}, event(undefined), now), undefined);
    assert.equal(heartbeatFor(state, {}, event('a2'), now), undefined);
    assert.equal(heartbeatFor(state, {}, event('zz'), now), undefined);
    assert.equal(heartbeatFor(undefined, {}, event('a1'), now), undefined);
  });
});

describe('renderProgress', () => {
  it('lists every ticket with its blockers and last heartbeat', () => {
    const md = renderProgress(
      {
        spec: '.scratch/x',
        branch: 'spec/x',
        base: 'master',
        startedAt: '2026-10-21T11:00:00Z',
        phase: 'implement',
        tickets: {
          '02': { title: 'Three', status: 'merged', note: 'ok', blockedBy: ['01'] },
          '01': { title: 'One | two', status: 'running', blockedBy: [] },
        },
        log: [{ at: '2026-10-21T11:00:00Z', text: 'started' }],
      },
      { '01': { at: '2026-10-21T11:59:30Z', step: 'red: select test', tool: 'Bash' } },
      Date.parse('2026-10-21T12:00:00Z'),
    );
    assert.match(md, /`██████████░░░░░░░░░░` \*\*50%\*\*/);
    assert.match(md, /Merged 1 of 2; running 1; failed 0/);
    assert.match(
      md,
      /\| 01 One \\\| two \| — \| 🔵 running \| 30 s ago \(Bash\) \| red: select test \|  \|\n\| 02 Three \| 01 \| 🟢 merged \|/,
    );
    assert.match(md, /## Graph\n\n```mermaid\nflowchart LR\n/);
    assert.match(md, /- 2026-10-21T11:00:00Z started/);
    assert.doesNotMatch(md, /## Timeline/, 'no ticket ever ran per the log');
  });

  it('warns about a quiet agent and a ticket whose blocker failed', () => {
    const md = renderProgress(
      {
        spec: '.scratch/x',
        branch: 'spec/x',
        base: 'master',
        phase: 'implement',
        tickets: {
          '01': { title: 'One', status: 'running', blockedBy: [] },
          '02': { title: 'Two', status: 'failed', blockedBy: [] },
          '03': { title: 'Three', status: 'pending', blockedBy: ['02'] },
        },
        log: [{ at: '2026-10-21T11:00:00Z', text: '01 → running' }],
      },
      { '01': { at: '2026-10-21T11:54:00Z', tool: 'Bash' } },
      Date.parse('2026-10-21T12:00:00Z'),
    );
    assert.match(md, /\| 01 One \| — \| 🔵 running \| ⚠ 6 min ago \(Bash\) \|/);
    assert.match(md, /\| 03 Three \| 02 \| ⚪ pending ⛔ blocked for good \|/);
    assert.match(md, /## Timeline\n\n```mermaid\ngantt\n/);
  });
});

describe('progressBar', () => {
  it('fills the done share of the width', () => {
    assert.equal(progressBar(1, 4, 8), '██░░░░░░');
    assert.equal(progressBar(3, 3, 4), '████');
    assert.equal(progressBar(0, 0, 3), '░░░');
  });
});

describe('renderGraph', () => {
  const now = Date.parse('2026-10-21T12:00:00Z');
  const state = {
    tickets: {
      '01': { title: 'Corner `core/overlay.ts` "A" #1 <b>', status: 'merged', blockedBy: [] },
      '02': { title: 'Tooltip', status: 'running', blockedBy: ['01', '99'] },
      '03': { title: 'Popover', status: 'running', blockedBy: ['01'] },
    },
  };
  const beats = {
    '02': { at: '2026-10-21T11:59:00Z', step: 'red: a <gap>' },
    '03': { at: '2026-10-21T11:00:00Z' },
  };

  it('draws one node per ticket colored by state, and an arrow from each blocker', () => {
    const graph = renderGraph(state, beats, now).join('\n');
    assert.match(
      graph,
      /t01\["🟢 01 Corner core\/overlay\.ts #quot;A#quot; #35;1 #lt;b#gt;"\]:::merged/,
    );
    assert.match(graph, /t02\["🔵 02 Tooltip<br\/><small>red: a #lt;gap#gt;<\/small>"\]:::running/);
    assert.match(graph, /t03\["⚠ 03 Popover"\]:::quiet/);
    assert.match(graph, /t01 --> t02\n {2}t01 --> t03/);
    assert.doesNotMatch(graph, /t99/, 'a blocker outside the orchestration');
    assert.match(graph, /classDef merged fill:/);
  });
});

describe('flightSpans and renderTimeline', () => {
  const at = (minute) => `2026-10-21T11:${String(minute).padStart(2, '0')}:00Z`;
  const now = Date.parse(at(50));
  const state = {
    tickets: {
      '01': { title: 'One: first; #1' },
      '02': { title: 'Two' },
      '03': { title: 'Three' },
    },
    log: [
      { at: at(0), text: 'planned 3 tickets' },
      { at: at(1), text: '01 → running' },
      { at: at(5), text: '01 → merging' },
      { at: at(6), text: '01 → merged' },
      { at: at(7), text: '02 → running' },
      { at: at(9), text: '02 → failed: red' },
      { at: at(10), text: '02 → pending' },
      { at: at(11), text: '02 → running' },
      { at: at(12), text: '03 → running' },
    ],
  };

  it('opens a span when a ticket starts and closes it when it leaves flight', () => {
    assert.deepEqual(
      flightSpans(state, now).map(({ id, start, stop, end }) => [id, start, stop, end]),
      [
        ['01', Date.parse(at(1)), Date.parse(at(6)), 'merged'],
        ['02', Date.parse(at(7)), Date.parse(at(9)), 'failed'],
        ['02', Date.parse(at(11)), now, undefined],
        ['03', Date.parse(at(12)), now, undefined],
      ],
    );
  });

  it('draws a gantt bar per span: done, critical or active', () => {
    const seconds = (minute) => Date.parse(at(minute)) / 1000;
    const gantt = renderTimeline(state, now).join('\n');
    assert.match(gantt, /^```mermaid\ngantt\n {2}dateFormat X\n/);
    assert.ok(gantt.includes(`  01 One first 1 :done, ${seconds(1)}, ${seconds(6)}`), gantt);
    assert.ok(gantt.includes(`  02 Two :crit, ${seconds(7)}, ${seconds(9)}`));
    assert.ok(gantt.includes(`  02 Two (try 2) :active, ${seconds(11)}, ${seconds(50)}`));
    assert.deepEqual(renderTimeline({ tickets: {}, log: [] }, now), []);
  });
});

describe('time', () => {
  const at = (minute) =>
    new Date(Date.parse('2026-10-21T11:00:00Z') + minute * 60_000).toISOString();
  const now = Date.parse(at(60));
  const minutes = (ms) => (ms === undefined ? undefined : ms / 60_000);
  /** 01 runs 0–10 and merges in 1; 02 waits for it, fails once and runs again; 03 waits for 02. */
  const state = {
    startedAt: at(0),
    phase: 'implement',
    tickets: {
      '01': { status: 'merged', blockedBy: [] },
      '02': { status: 'running', blockedBy: ['01', '99'] },
      '03': { status: 'pending', blockedBy: ['02'] },
    },
    log: [
      { at: at(0), text: 'planned 3 tickets' },
      { at: at(1), text: '01 → running' },
      { at: at(11), text: '01 → merging' },
      { at: at(12), text: '01 → merged' },
      { at: at(13), text: '02 → running' },
      { at: at(20), text: '02 → failed: red' },
      { at: at(21), text: '02 → pending' },
      { at: at(22), text: '02 → running' },
      { at: at(40), text: '02 → running: restarted' },
    ],
  };
  /** An earlier run: tickets of 20 and 40 minutes, review 10, verify 20. */
  const earlier = {
    startedAt: at(-200),
    phase: 'done',
    tickets: { '01': { blockedBy: [] }, '02': { blockedBy: [] } },
    log: [
      { at: at(-200), text: '01 → running' },
      { at: at(-180), text: '01 → merged' },
      { at: at(-180), text: '02 → running' },
      { at: at(-140), text: '02 → merged' },
      { at: at(-140), text: 'phase: review' },
      { at: at(-130), text: 'phase: verify' },
      { at: at(-110), text: 'phase: done' },
    ],
  };

  it('formats durations and ranges', () => {
    assert.equal(duration(45_000), '45 s');
    assert.equal(duration(13 * 60_000 + 20_000), '13 min');
    assert.equal(duration(104 * 60_000), '1 h 44 min');
    assert.equal(duration(NaN), '—');
    assert.equal(range({ low: 25 * 60_000, high: 60 * 60_000 }), '25 min–1 h 0 min');
    assert.equal(range({ low: 25 * 60_000, high: 40 * 60_000 }), '25–40 min');
    assert.equal(range({ low: 45_000, high: 120_000 }), '45 s–2 min');
    assert.equal(range({ low: 30 * 60_000, high: 30 * 60_000 + 10_000 }), '~30 min');
  });

  it('splits the time of each ticket into waiting, work, merging and tries', () => {
    const times = ticketTimes(state, now);
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(times).map(([id, t]) => [
          id,
          [...[t.wait, t.work, t.merge].map(minutes), t.tries],
        ]),
      ),
      { '01': [1, 10, 1, 1], '02': [1, 7 + 38, 0, 2], '03': [undefined, 0, 0, 0] },
    );
    assert.equal(times['01'].merged, Date.parse(at(12)));
    assert.equal(times['03'].wait, undefined, 'its blocker is not merged');
  });

  it('times each phase until the next and leaves done out', () => {
    assert.deepEqual(
      phaseTimes(earlier, now).map((p) => [p.phase, minutes(p.ms), p.open]),
      [
        ['implement', 60, false],
        ['review', 10, false],
        ['verify', 20, false],
      ],
    );
    assert.deepEqual(phaseTimes(state, now).at(-1), {
      phase: 'implement',
      ms: 60 * 60_000,
      open: true,
    });
  });

  it('forecasts the longest chain left from the quartiles of merged tickets, then review and verify', () => {
    // Merged tickets took 11, 20 and 40 minutes: quartiles 15.5 and 30.
    // 02 spent 45: one minute left. 03 waits for it: 15.5 or 30. Review 10 and verify 20 follow.
    const next = forecast(state, now, [earlier]);
    assert.deepEqual(
      [minutes(next.low), minutes(next.high), next.path, next.phases, next.samples],
      [1 + 15.5 + 30, 1 + 30 + 30, ['02', '03'], true, 3],
    );
    assert.equal(forecast(state, now).phases, false, 'no earlier run');
    assert.equal(forecast({ ...state, phase: 'done' }, now, [earlier]), undefined);
    assert.equal(forecast({ ...state, log: [] }, now), undefined, 'nothing merged yet');
    const review = forecast(
      { ...state, phase: 'review', log: [...state.log, { at: at(55), text: 'phase: review' }] },
      now,
      [earlier],
    );
    assert.equal(minutes(review.low), 1 + 15.5 + 5 + 20, 'review has 5 of its 10 minutes left');
  });

  it('renders the section with the forecast and a row per ticket and phase', () => {
    const md = renderTime(state, now, [earlier]).join('\n');
    assert.match(md, /Elapsed 1 h 0 min; agents worked and merged 56 min in all, 0\.9 at a time/);
    assert.match(md, /Forecast: done in \*\*47 min–1 h 1 min\*\*/);
    assert.match(md, /the longest chain left is 02 → 03, review and verify included \(by 3 merged/);
    assert.match(md, /\| 01 \| 1 min \| 10 min \| 1 min \| 1 \| 11 min \|/);
    assert.match(md, /\| 02 \| 1 min \| 45 min \| — \| 2 \| 47 min \|/);
    assert.match(md, /\| 03 \| — \| — \| — \| — \| — \|/);
    assert.match(md, /\| implement \(now\) \| 1 h 0 min \|/);
  });
});

describe('renderStatusLine', () => {
  const now = Date.parse('2026-10-21T12:00:00Z');

  it('shows every orchestration not done: bar, tickets in flight, failed and quiet ones', () => {
    const line = renderStatusLine(
      {
        b: {
          phase: 'implement',
          tickets: {
            '01': { status: 'merged' },
            '02': { status: 'running', startedAt: '2026-10-21T11:00:00Z' },
            '03': { status: 'failed' },
            '04': { status: 'merging' },
          },
        },
        a: { phase: 'done', tickets: { '01': { status: 'merged' } } },
        c: { phase: 'verify', tickets: { '01': { status: 'merged' } } },
      },
      { b: { '02': { at: '2026-10-21T11:53:00Z' } } },
      now,
    );
    assert.equal(
      line,
      'b implement · ███░░░░░░░ 1/4 · 🔵2 · 🔴1 · ⚠ 02 silent  │  c verify · ██████████ 1/1',
    );
  });

  it('adds the time since the start and the forecast', () => {
    const line = renderStatusLine(
      {
        a: {
          startedAt: '2026-10-21T11:00:00Z',
          phase: 'implement',
          tickets: {
            '01': { status: 'merged', blockedBy: [] },
            '02': { status: 'pending', blockedBy: [] },
          },
          log: [
            { at: '2026-10-21T11:00:00Z', text: '01 → running' },
            { at: '2026-10-21T11:20:00Z', text: '01 → merged' },
          ],
        },
      },
      {},
      now,
    );
    assert.equal(line, 'a implement · █████░░░░░ 1/2 · ⏱ 1 h 0 min · ETA ~20 min');
  });

  it('is empty when nothing runs', () => {
    assert.equal(renderStatusLine({ a: { phase: 'done', tickets: {} } }, {}, now), '');
    assert.equal(renderStatusLine({}, {}, now), '');
  });
});

describe('renderIndex', () => {
  it('lists every spec with its phase, ticket counts and a link to its progress', () => {
    const md = renderIndex(
      {
        b: { phase: 'verify', tickets: { '01': { status: 'merged' } } },
        a: {
          phase: 'implement',
          tickets: {
            '01': { status: 'running' },
            '02': { status: 'merged' },
            '03': { status: 'failed' },
          },
        },
      },
      Date.parse('2026-10-21T12:00:00Z'),
    );
    assert.match(md, /updated 2026-10-21T12:00:00.000Z/);
    assert.match(
      md,
      /- \[a\]\(a\/progress\.md\): phase \*\*implement\*\*; merged 1 of 3; running 1; failed 1\.\n- \[b\]\(b\/progress\.md\): phase \*\*verify\*\*; merged 1 of 1;/,
    );
  });
});

describe('lockStatus', () => {
  const alive = (pid) => pid === 1;
  it('tells free, own, held and stale apart', () => {
    assert.equal(lockStatus(undefined, 's', alive), 'free');
    assert.equal(lockStatus({ session: 's', pid: 2 }, 's', alive), 'own');
    assert.equal(lockStatus({ session: 'o', pid: 1 }, 's', alive), 'held');
    assert.equal(lockStatus({ session: 'o', pid: 2 }, 's', alive), 'stale');
  });

  it('can compare another field of the lock, as the verify lock does with its spec', () => {
    assert.equal(lockStatus({ spec: 'a', pid: 1 }, 'a', alive, 'spec'), 'own');
    assert.equal(lockStatus({ spec: 'b', pid: 1 }, 'a', alive, 'spec'), 'held');
    assert.equal(lockStatus({ spec: 'b', pid: 2 }, 'a', alive, 'spec'), 'stale');
  });
});

describe('killTargets', () => {
  it('flags kills by name or pattern', () => {
    assert.equal(killTargets('taskkill /IM node.exe /F').byName, 'taskkill /IM');
    assert.equal(killTargets('taskkill //F //IM node.exe').byName, 'taskkill /IM');
    assert.equal(
      killTargets('Get-Process node | Stop-Process').byName,
      'piping processes into a kill',
    );
    assert.equal(killTargets('pkill -f vite').byName, 'pkill/killall');
  });

  it('reads literal PIDs of taskkill, Stop-Process, kill and process.kill', () => {
    assert.deepEqual(killTargets('taskkill //PID 120 //T //F').pids, [{ pid: 120, msys: false }]);
    assert.deepEqual(killTargets('Stop-Process -Id 5,6 -Force').pids, [
      { pid: 5, msys: false },
      { pid: 6, msys: false },
    ]);
    assert.deepEqual(killTargets('kill -9 77').pids, [{ pid: 77, msys: true }]);
    assert.deepEqual(killTargets('kill -s TERM 78').pids, [{ pid: 78, msys: true }]);
    assert.deepEqual(killTargets('kill -W 79').pids, [{ pid: 79, msys: false }]);
    assert.deepEqual(killTargets('node -e "process.kill(80)"').pids, [{ pid: 80, msys: false }]);
    assert.deepEqual(killTargets('powershell -Command "Stop-Process -Id 81"').pids, [
      { pid: 81, msys: false },
    ]);
  });

  it('marks targets that are not literal PIDs', () => {
    assert.deepEqual(killTargets('kill $PID').unresolved, ['$PID']);
    assert.deepEqual(killTargets('kill %1').unresolved, ['%1']);
    assert.deepEqual(killTargets('kill 0').unresolved, ['0']);
  });

  it('ignores the word kill outside a command position and kill -l', () => {
    const none = { byName: undefined, pids: [], unresolved: [] };
    assert.deepEqual(killTargets('git commit -m "fix: kill the stale server"'), none);
    assert.deepEqual(killTargets('kill -l'), none);
    assert.deepEqual(killTargets('grep -r skill .claude'), none);
  });
});

describe('isDescendant', () => {
  const parents = new Map([
    [10, 1],
    [20, 10],
    [30, 20],
    [40, 1],
  ]);
  it('walks up the parent chain to the root', () => {
    assert.ok(isDescendant(parents, 30, 10));
    assert.ok(!isDescendant(parents, 40, 10));
    assert.ok(!isDescendant(parents, 10, 10));
    assert.ok(
      !isDescendant(
        new Map([
          [5, 6],
          [6, 5],
        ]),
        5,
        10,
      ),
    );
  });
});

describe('skipsGitHooks', () => {
  it('catches --no-verify, -n and a hooksPath override on git commit', () => {
    assert.ok(skipsGitHooks('git commit --no-verify -m "x"'));
    assert.ok(skipsGitHooks('git add . && git commit -nm "x"'));
    assert.ok(skipsGitHooks('git -c core.hooksPath=/dev/null commit -m x'));
  });

  it('lets ordinary commits and other commands through', () => {
    assert.ok(!skipsGitHooks('git commit -m "skip --no-verify -n here"'));
    assert.ok(!skipsGitHooks('git commit -am "x"'));
    assert.ok(!skipsGitHooks('git log -n 5'));
    assert.ok(!skipsGitHooks('git push --no-verify'));
  });
});

// ---------------------------------------------------------------------------------------------
// The scripts on a throwaway repo: specs `a` and `b`, each with tickets 01-03.

describe('orchestrator.mjs and its heartbeat hook with two specs', () => {
  const script = fileURLToPath(new URL('./orchestrator.mjs', import.meta.url));
  const hook = fileURLToPath(new URL('./orchestrator-heartbeat.mjs', import.meta.url));
  /** No process has this pid, so a lock that names it is stale. */
  const DEAD = 999_999_999;
  let root;

  const env = ({ session = 's1', pid = process.pid } = {}) => ({
    ...process.env,
    CLAUDE_CODE_SESSION_ID: session,
    CLAUDE_PID: String(pid),
    CLAUDE_PROJECT_DIR: root,
  });
  const run = (args, who) =>
    spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8', env: env(who) });
  const orch = (args, who) => {
    const result = run(args, who);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const file = (...parts) => join(root, '.orchestrator', ...parts);
  const json = (...parts) => JSON.parse(readFileSync(file(...parts), 'utf8'));
  const write = (path, text) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  };
  const init = (feature) => {
    const plan = join(root, `${feature}-plan.json`);
    write(
      plan,
      JSON.stringify({
        spec: `.scratch/${feature}`,
        base: 'master',
        branch: `spec/${feature}`,
        tickets: ['01', '02', '03'].map((id) => ({ id, files: [`${feature}/${id}`] })),
      }),
    );
    orch(['init', plan, '--spec', feature]);
  };
  const beat = (agent) =>
    spawnSync(process.execPath, [hook], {
      cwd: root,
      encoding: 'utf8',
      env: env(),
      input: JSON.stringify({
        agent_id: agent,
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        cwd: join(root, 'wt'),
      }),
    });

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'orchestrator-'));
    execFileSync('git', ['init', '-q'], { cwd: root });
    for (const feature of ['a', 'b']) {
      for (const id of ['01', '02', '03']) {
        write(
          join(root, '.scratch', feature, 'issues', `${id}-t.md`),
          `# ${id}: Ticket ${id} of ${feature}\n\n**Status:** ready-for-agent\n`,
        );
      }
    }
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('needs --spec for every command but tickets', () => {
    assert.match(run(['next']).stderr, /--spec <feature>/);
    assert.match(run(['status', '--spec', '..']).stderr, /not a spec/);
    assert.equal(JSON.parse(orch(['tickets', '.scratch/a'])).length, 3);
  });

  it('keeps the state and heartbeats of two specs with the same ticket ids apart', () => {
    init('a');
    init('b');
    orch(['set', '--spec', 'a', '01', 'running', '--agent', 'agent-a']);
    orch(['set', '--spec', 'b', '01', 'running', '--agent', 'agent-b']);
    orch(['beat', '--spec', 'b', '01', 'red: a test of b']);
    assert.equal(beat('agent-a').status, 0);

    assert.equal(json('a', 'state.json').tickets['01'].agent, 'agent-a');
    assert.equal(json('b', 'state.json').tickets['01'].agent, 'agent-b');
    assert.equal(json('a', '01.json').tool, 'Bash');
    assert.equal(json('a', '01.json').step, undefined);
    assert.equal(json('b', '01.json').step, 'red: a test of b');
    assert.equal(json('b', '01.json').tool, undefined);
    assert.match(readFileSync(file('a', 'progress.md'), 'utf8'), /\(Bash\)/);
    assert.equal(
      JSON.parse(orch(['status', '--spec', 'b'])).tickets[0].beat.step,
      'red: a test of b',
    );
  });

  it('locks each spec on its own: held for the same spec, stale per spec', () => {
    assert.equal(orch(['lock', 'acquire', '--spec', 'a'], { session: 's1' }), 'acquired');
    assert.equal(orch(['lock', 'acquire', '--spec', 'b'], { session: 's2' }), 'acquired');
    const held = run(['lock', 'acquire', '--spec', 'a'], { session: 's2' });
    assert.equal(held.status, 1);
    assert.match(held.stderr, /session s1 .* holds the lock/);
    assert.match(orch(['lock', 'status', '--spec', 'b'], { session: 's1' }), /^held: /);

    orch(['lock', 'release', '--spec', 'a'], { session: 's1' });
    orch(['lock', 'acquire', '--spec', 'a'], { session: 's3', pid: DEAD });
    assert.equal(json('a', 'lock').session, 's3');
    assert.match(orch(['lock', 'status', '--spec', 'a'], { session: 's1' }), /^stale: /);
    assert.equal(
      orch(['lock', 'acquire', '--spec', 'a'], { session: 's1' }),
      'took over a stale lock of s3',
    );
    assert.match(orch(['lock', 'status', '--spec', 'b'], { session: 's1' }), /^held: /);
    assert.equal(orch(['lock', 'release', '--spec', 'a'], { session: 's1' }), 'released');
    assert.equal(run(['lock', 'release', '--spec', 'b'], { session: 's1' }).status, 1);
    assert.ok(!existsSync(file('a', 'lock')));
    assert.ok(existsSync(file('b', 'lock')));
  });

  it('shares the limit of agents in flight between specs', () => {
    init('a');
    init('b');
    for (const id of ['01', '02', '03']) {
      orch(['set', '--spec', 'a', id, 'running', '--agent', `agent-a${id}`]);
    }
    assert.deepEqual(JSON.parse(orch(['next', '--spec', 'b', '--max', '4'])), {
      launch: ['01'],
      inFlight: 0,
      elsewhere: 3,
      pending: 3,
      blockedForGood: [],
    });
    assert.deepEqual(JSON.parse(orch(['next', '--spec', 'a'])).launch, []);
  });

  it('binds the heartbeat hook to a spec by agent id and never fails', () => {
    assert.equal(beat('agent-b').status, 0, 'no .orchestrator folder');
    init('a');
    init('b');
    orch(['set', '--spec', 'b', '02', 'running', '--agent', 'agent-b']);
    write(file('a', 'state.json'), '{ broken');
    assert.equal(beat('agent-b').status, 0);
    assert.equal(json('b', '02.json').cwd, join(root, 'wt'));
    assert.ok(!existsSync(file('a', '02.json')));

    assert.equal(beat('nobody').status, 0);
    const garbage = spawnSync(process.execPath, [hook], { cwd: root, env: env(), input: 'x' });
    assert.equal(garbage.status, 0);
    assert.ok(!existsSync(file('b', '01.json')));
  });

  it('beats and watches only the spec it is given', () => {
    init('a');
    init('b');
    const before = readFileSync(file('b', 'state.json'), 'utf8');
    orch(['beat', '--spec', 'a', '02', 'green: done']);
    assert.equal(orch(['watch', '--spec', 'a', '--every', '0']), 'IDLE');

    assert.ok(json('a', 'state.json').watcher);
    assert.equal(readFileSync(file('b', 'state.json'), 'utf8'), before);
    assert.ok(existsSync(file('a', '02.json')));
    assert.ok(!existsSync(file('b', '02.json')));
  });

  it('lists every spec in the top-level progress.md', () => {
    init('a');
    init('b');
    orch(['phase', '--spec', 'b', 'review']);
    const index = readFileSync(file('progress.md'), 'utf8');
    assert.match(index, /- \[a\]\(a\/progress\.md\): phase \*\*implement\*\*; merged 0 of 3/);
    assert.match(index, /- \[b\]\(b\/progress\.md\): phase \*\*review\*\*/);
  });

  it('shows the orchestrations of the main checkout in the status line of a worktree session', () => {
    const statusLine = fileURLToPath(new URL('./orchestrator-statusline.mjs', import.meta.url));
    const worktree = join(root, '.claude', 'worktrees', 'x');
    mkdirSync(worktree, { recursive: true });
    const show = (input) =>
      spawnSync(process.execPath, [statusLine], { cwd: root, encoding: 'utf8', env: env(), input });

    assert.equal(show(JSON.stringify({ workspace: { current_dir: worktree } })).stdout, '');
    init('a');
    init('b');
    orch(['set', '--spec', 'a', '01', 'running', '--agent', 'agent-a']);
    orch(['phase', '--spec', 'b', 'done']);
    write(file('b', '01.json'), '{ half');
    const result = show(JSON.stringify({ workspace: { current_dir: worktree } }));
    assert.equal(result.status, 0);
    assert.match(result.stdout, /^a implement · ░░░░░░░░░░ 0\/3 · 🔵1 · ⏱ \d+ s\n$/);
    assert.match(show('x').stdout, /^a implement · /, 'from its own folder');
  });

  it('moves a top-level orchestration of an earlier run into the folder of its spec', () => {
    write(
      file('state.json'),
      JSON.stringify({
        spec: '.scratch/a',
        base: 'master',
        branch: 'spec/a',
        phase: 'review',
        tickets: { '01': { status: 'running', agent: 'agent-a', blockedBy: [], files: ['x'] } },
        log: [],
      }),
    );
    write(file('01.json'), JSON.stringify({ ticket: '01', at: new Date().toISOString() }));
    write(file('lock'), JSON.stringify({ session: 's1', pid: process.pid }));
    write(file('check-01.log'), 'ok');
    write(file('verify', 'build.log'), 'ok');

    const status = JSON.parse(orch(['status', '--spec', 'a']));
    assert.equal(status.phase, 'review');
    assert.equal(status.tickets[0].agent, 'agent-a');
    for (const name of ['state.json', '01.json', 'lock', 'check-01.log', 'verify']) {
      assert.ok(!existsSync(file(name)), `${name} left at the top level`);
    }
    assert.equal(json('a', 'lock').session, 's1');
    assert.ok(existsSync(file('a', 'verify', 'build.log')));
    assert.match(readFileSync(file('progress.md'), 'utf8'), /- \[a\]\(a\/progress\.md\)/);
    assert.equal(beat('agent-a').status, 0);
    assert.equal(json('a', '01.json').tool, 'Bash');
  });

  it('serializes verify between specs with the verify lock', { timeout: 30_000 }, async () => {
    assert.equal(orch(['verify-lock', 'acquire', '--spec', 'a'], { session: 's1' }), 'acquired');
    assert.equal(orch(['verify-lock', 'acquire', '--spec', 'a'], { session: 's1' }), 'acquired');
    assert.match(orch(['verify-lock', 'status', '--spec', 'b'], { session: 's2' }), /^held: /);
    assert.equal(run(['verify-lock', 'release', '--spec', 'b'], { session: 's2' }).status, 1);

    const waiter = spawn(
      process.execPath,
      [script, 'verify-lock', 'acquire', '--spec', 'b', '--every', '0.05'],
      { cwd: root, env: env({ session: 's2' }) },
    );
    let out = '';
    const waits = new Promise((done) =>
      waiter.stdout.on('data', (chunk) => {
        out += chunk;
        if (out.includes('waiting')) done();
      }),
    );
    const exited = new Promise((done) => waiter.on('exit', done));
    await waits;
    await new Promise((done) => setTimeout(done, 200));
    assert.equal(waiter.exitCode, null, 'b must wait while a verifies');
    assert.match(out, /^waiting: a is in verify/);

    init('a');
    orch(['phase', '--spec', 'a', 'done'], { session: 's1' });
    assert.equal(await exited, 0);
    assert.match(out, /acquired\s*$/);
    assert.equal(json('verify.lock').spec, 'b');

    write(file('verify.lock'), JSON.stringify({ spec: 'b', session: 's2', pid: DEAD }));
    assert.equal(
      orch(['verify-lock', 'acquire', '--spec', 'a'], { session: 's1' }),
      'took over a stale verify lock of b',
    );

    write(file('verify.lock'), '');
    assert.equal(
      orch(['verify-lock', 'acquire', '--spec', 'b', '--every', '0.05'], { session: 's2' }),
      'took over a stale verify lock of an unknown spec',
    );
    write(file('verify.lock'), JSON.stringify({ spec: 'a', session: 's1', pid: DEAD }));
    assert.equal(
      orch(['verify-lock', 'release', '--spec', 'b'], { session: 's2' }),
      'released a stale verify lock of a',
    );
    assert.ok(!existsSync(file('verify.lock')));
  });
});
