// Tests of the pure logic of `orchestrator.mjs`, `orchestrator-heartbeat.mjs` and
// `guard-tool-use.mjs`. Run with `pnpm test-scripts`.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  blockedForGood,
  findStale,
  frontier,
  heartbeatFor,
  isDescendant,
  killTargets,
  lockStatus,
  parseTicket,
  pathsOverlap,
  renderProgress,
  skipsGitHooks,
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
    assert.match(md, /Merged 1 of 2; running 1; failed 0/);
    assert.match(
      md,
      /\| 01 One \\\| two \| — \| running \| 30 s ago \(Bash\) \| red: select test \|  \|\n\| 02 Three \| 01 \|/,
    );
    assert.match(md, /- 2026-10-21T11:00:00Z started/);
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
