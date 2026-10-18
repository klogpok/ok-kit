// Tests of the pure logic of `sync-to-client.mjs`. Run with `pnpm test:scripts`.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';

import {
  checkTarget,
  planSync,
  readTree,
  renderSyncedMd,
  rewriteImports,
  syncTarget,
} from './sync-to-client.lib.mjs';

const temp = await mkdtemp(join(tmpdir(), 'sync-to-client-'));
after(() => rm(temp, { recursive: true, force: true }));

let fixtures = 0;
/** Writes `files` (path → content) into a new folder and returns its path. */
async function folder(files) {
  const root = join(temp, String(fixtures++));
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
  return root;
}

const text = (plan) => Object.fromEntries([...plan].map(([path, data]) => [path, String(data)]));

describe('syncTarget and checkTarget', () => {
  const synced = (commit) => renderSyncedMd({ commit, dirty: false });
  const plan = (files, commit = 'aaa111') =>
    new Map([...Object.entries(files), ['SYNCED.md', synced(commit)]]);

  it('writes a new target, then mirrors the kit: changed files rewritten, removed ones deleted', async () => {
    const parent = await folder({ 'app.ts': 'app' });
    const target = join(parent, 'ui-kit');
    await syncTarget(target, plan({ 'core/a.ts': 'a', 'menu/m.ts': 'm', 'menu/sub/s.html': 's' }));
    assert.deepEqual(
      await checkTarget(
        target,
        plan({ 'core/a.ts': 'a', 'menu/m.ts': 'm', 'menu/sub/s.html': 's' }),
      ),
      {
        added: [],
        changed: [],
        removed: [],
      },
    );

    const next = plan({ 'core/a.ts': 'a2', 'core/b.ts': 'b' }, 'bbb222');
    assert.deepEqual(await checkTarget(target, next), {
      added: ['core/b.ts'],
      changed: ['core/a.ts'],
      removed: ['menu/m.ts', 'menu/sub/s.html'],
    });
    await syncTarget(target, next);
    assert.deepEqual(text(await readTree(target)), {
      'SYNCED.md': synced('bbb222'),
      'core/a.ts': 'a2',
      'core/b.ts': 'b',
    });
    assert.deepEqual((await readdir(target)).sort(), ['SYNCED.md', 'core']);
    assert.deepEqual(text(await readTree(parent)), {
      'app.ts': 'app',
      ...Object.fromEntries(
        Object.entries(text(await readTree(target))).map(([p, d]) => [`ui-kit/${p}`, d]),
      ),
    });
  });

  it('ignores the source commit of SYNCED.md in a check', async () => {
    const target = join(await folder({ 'x.ts': 'x' }), 'ui-kit');
    await syncTarget(target, plan({ 'core/a.ts': 'a' }, 'aaa111'));
    assert.deepEqual(await checkTarget(target, plan({ 'core/a.ts': 'a' }, 'ccc333')), {
      added: [],
      changed: [],
      removed: [],
    });
  });

  it('reports a hand edit and a missing target', async () => {
    const parent = await folder({ 'x.ts': 'x' });
    const target = join(parent, 'ui-kit');
    assert.deepEqual(await checkTarget(target, plan({ 'core/a.ts': 'a' })), {
      added: ['SYNCED.md', 'core/a.ts'],
      changed: [],
      removed: [],
    });
    await syncTarget(target, plan({ 'core/a.ts': 'a' }));
    await writeFile(join(target, 'core/a.ts'), 'edited');
    assert.deepEqual((await checkTarget(target, plan({ 'core/a.ts': 'a' }))).changed, [
      'core/a.ts',
    ]);
  });

  it('treats a CRLF checkout of the copy as matching, and leaves its files alone', async () => {
    const target = join(await folder({ 'x.ts': 'x' }), 'ui-kit');
    const files = { 'core/a.ts': 'a\nb\n', 'styles/s.scss': 'a {}\n' };
    await syncTarget(target, plan(files));
    // What git with core.autocrlf=true writes on a fresh checkout of the committed copy.
    for (const [path, data] of await readTree(target)) {
      await writeFile(join(target, path), String(data).replace(/\n/g, '\r\n'));
    }
    const none = { added: [], changed: [], removed: [] };
    assert.deepEqual(await checkTarget(target, plan(files)), none);
    assert.deepEqual(await syncTarget(target, plan(files)), none);
    assert.equal(String((await readTree(target)).get('core/a.ts')), 'a\r\nb\r\n');

    const edited = { ...files, 'core/a.ts': 'a\nc\n' };
    assert.deepEqual(await checkTarget(target, plan(edited)), { ...none, changed: ['core/a.ts'] });
    assert.deepEqual(await syncTarget(target, plan(edited)), { ...none, changed: ['core/a.ts'] });
    assert.equal(String((await readTree(target)).get('core/a.ts')), 'a\nc\n');
  });

  it('compares a file that is not UTF-8 byte for byte', async () => {
    const target = join(await folder({ 'x.ts': 'x' }), 'ui-kit');
    // No NUL byte, and both decode to the same text once invalid bytes become U+FFFD.
    const before = Buffer.from([0xff, 0x0d, 0x0a, 0x41]);
    const after = Buffer.from([0xfe, 0x0d, 0x0a, 0x41]);
    await syncTarget(target, plan({ 'styles/font.bin': before }));
    const none = { added: [], changed: [], removed: [] };
    assert.deepEqual(await checkTarget(target, plan({ 'styles/font.bin': before })), none);
    const changed = { ...none, changed: ['styles/font.bin'] };
    assert.deepEqual(await checkTarget(target, plan({ 'styles/font.bin': after })), changed);
    assert.deepEqual(await syncTarget(target, plan({ 'styles/font.bin': after })), changed);
    assert.deepEqual((await readTree(target)).get('styles/font.bin'), after);
  });

  it('refuses a target that holds files it did not write', async () => {
    const parent = await folder({ 'ui-kit/button.ts': 'theirs' });
    await assert.rejects(
      syncTarget(join(parent, 'ui-kit'), plan({ 'core/a.ts': 'a' })),
      /has files that sync-to-client\.mjs did not write/,
    );
    const other = await folder({ 'ui-kit/SYNCED.md': '# Someone else' });
    await assert.rejects(
      syncTarget(join(other, 'ui-kit'), plan({ 'core/a.ts': 'a' })),
      /has files that sync-to-client\.mjs did not write/,
    );
  });

  it('refuses a target whose parent folder does not exist', async () => {
    const parent = await folder({ 'x.ts': 'x' });
    await assert.rejects(
      syncTarget(join(parent, 'missing', 'ui-kit'), plan({ 'core/a.ts': 'a' })),
      /parent folder .* does not exist/,
    );
  });

  it('never writes outside the target', async () => {
    const parent = await folder({ 'x.ts': 'x' });
    await assert.rejects(
      syncTarget(join(parent, 'ui-kit'), plan({ '../escape.ts': 'e' })),
      /outside the target/,
    );
    assert.deepEqual(await readdir(parent), ['x.ts']);
  });
});

describe('renderSyncedMd', () => {
  it('names the source commit, a dirty tree and how to load the kit', () => {
    const md = renderSyncedMd({ commit: '0123abc', dirty: true });
    assert.match(md, /Generated by `scripts\/sync-to-client\.mjs`.*Do not edit/s);
    assert.match(md, /`0123abc`, working tree dirty/);
    assert.match(md, /pnpm sync:client/);
    assert.match(md, /<ui-embed-styles \/>/);
    assert.match(md, /provideUiLabels/);
    assert.match(
      renderSyncedMd({ commit: '0123abc', dirty: false }),
      /`0123abc`, working tree clean/,
    );
  });
});

describe('planSync', () => {
  it('copies the entry points and styles, without what serves only the kit build', async () => {
    const kit = await folder({
      'package.json': '{}',
      'ng-package.json': '{}',
      'tsconfig.lib.json': '{}',
      'README.md': '# kit',
      'src/public-api.ts': "export * from '@vplans/ui-kit/core';",
      'core/public-api.ts': "export * from './x';",
      'core/x.ts': 'export const x = 1;',
      'core/x.spec.ts': 'test',
      'core/ng-package.json': '{}',
      'core/package.json': '{}',
      'core/tsconfig.spec.json': '{}',
      'select/public-api.ts': "export { x } from '@vplans/ui-kit/core';",
      'select/select.stories.ts': 'story',
      'select/parts/option.html': '<li></li>',
      'select/parts/option.scss': ':host { display: block; }',
      'select/notes.mdx': 'docs',
      'styles/_base.scss': 'a {}',
      'styles/tokens.css': ':root {}',
      'tokens/tokens.json': '{}',
      'tokens/build-tokens.mts': 'build',
      'docs/forms.mdx': 'docs',
      'test-setup/setup.ts': 'setup',
      'test-setup.ts': 'setup',
      '.storybook/main.ts': 'main',
      'drafts/x.ts': 'no public api',
    });
    const { files, rewritten } = await planSync(kit);
    assert.equal(rewritten, 1);
    assert.deepEqual(text(files), {
      'core/public-api.ts': "export * from './x';",
      'core/x.ts': 'export const x = 1;',
      'select/parts/option.html': '<li></li>',
      'select/parts/option.scss': ':host { display: block; }',
      'select/public-api.ts': "export { x } from '../core/public-api';",
      'styles/_base.scss': 'a {}',
      'styles/tokens.css': ':root {}',
    });
  });
});

describe('rewriteImports', () => {
  it('rewrites an entry import relative to the folder of the file', () => {
    const source = "import { UiOption } from '@vplans/ui-kit/core';\n";
    assert.deepEqual(rewriteImports(source, 'select/select.ts'), {
      text: "import { UiOption } from '../core/public-api';\n",
      count: 1,
    });
  });

  it('climbs out of nested folders', () => {
    const source = 'export { UiIcon } from "@vplans/ui-kit/icon";';
    assert.equal(
      rewriteImports(source, 'table/cells/cell.ts').text,
      'export { UiIcon } from "../../icon/public-api";',
    );
  });

  it('rewrites a multi-line import, a dynamic import and an import type', () => {
    const source = [
      'import {',
      '  UiA,',
      '  UiB,',
      "} from '@vplans/ui-kit/listbox';",
      "const lazy = () => import('@vplans/ui-kit/dialog');",
      "type T = import('@vplans/ui-kit/core').UiSize;",
    ].join('\n');
    const result = rewriteImports(source, 'select/select-base.ts');
    assert.equal(result.count, 3);
    assert.equal(
      result.text,
      [
        'import {',
        '  UiA,',
        '  UiB,',
        "} from '../listbox/public-api';",
        "const lazy = () => import('../dialog/public-api');",
        "type T = import('../core/public-api').UiSize;",
      ].join('\n'),
    );
  });

  it('leaves comments alone', () => {
    const source = [
      '// `UiOptionItem` from `@vplans/ui-kit/select`, which re-exports them.',
      "/** import { UiButton } from '@vplans/ui-kit/button'; */",
      'export const x = 1;',
    ].join('\n');
    assert.deepEqual(rewriteImports(source, 'listbox/public-api.ts'), { text: source, count: 0 });
  });

  it('fails on @vplans/ui-kit left outside a comment', () => {
    assert.throws(
      () => rewriteImports("import { UiButton } from '@vplans/ui-kit';\n", 'menu/menu.ts'),
      /menu\/menu\.ts:1: @vplans\/ui-kit is still named outside a comment/,
    );
    assert.throws(
      () => rewriteImports("export const name = '@vplans/ui-kit/core';\n", 'core/x.ts'),
      /core\/x\.ts:1:/,
    );
  });
});
