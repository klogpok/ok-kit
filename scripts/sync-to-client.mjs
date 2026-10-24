// Writes a self-contained copy of the kit into the VPlans client (`pnpm sync:client`).
//
//   pnpm sync:client [target]           write the copy (default: DEFAULT_TARGET in the client)
//   pnpm sync:client [target] --check   exit 1 when the target differs from what a sync writes
//   pnpm sync:client --verify           sync into dist/client-sync-verify/, compile it with ngc
//                                       using the client's tsconfig.json options and compile
//                                       every component stylesheet with sass, no includePaths
//
// The copy holds every entry point of projects/ui-kit (those with a public-api.ts) and styles/,
// without specs, stories and build files. Its only transformation: `@vplans/ui-kit/<entry>`
// imports become relative `../<entry>/public-api`. The script never writes outside the target
// and refuses a target it did not write (see sync-to-client.lib.mjs).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import ts from 'typescript';

import {
  checkTarget,
  planSync,
  renderSyncedMd,
  SYNCED_MD,
  syncTarget,
} from './sync-to-client.lib.mjs';

const DEFAULT_TARGET = 'src/app/pages/dashboard/apartment-changes-new/ui-kit';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const kit = join(repo, 'projects/ui-kit');
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();

let client;
try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      check: { type: 'boolean', default: false },
      verify: { type: 'boolean', default: false },
      client: { type: 'string' },
    },
  });
  client = resolve(values.client ?? defaultClient());
  if (values.verify) {
    if (positionals.length > 0 || values.check)
      throw new Error('--verify takes no target and no --check');
    process.exitCode = await verify();
  } else {
    if (positionals.length > 1) throw new Error('give at most one target');
    const target = resolve(positionals[0] ?? join(client, DEFAULT_TARGET));
    process.exitCode = values.check ? await check(target) : await sync(target);
  }
} catch (error) {
  console.error(`sync-to-client: ${error.message}`);
  process.exitCode = 1;
}

/** The client next to the main checkout, also when this runs in a worktree of it. */
function defaultClient() {
  const mainCheckout = dirname(git('rev-parse', '--path-format=absolute', '--git-common-dir'));
  return join(mainCheckout, '../client');
}

async function plan() {
  const { files, rewritten } = await planSync(kit);
  const dirty = git('status', '--porcelain', '--', 'projects/ui-kit') !== '';
  files.set(SYNCED_MD, renderSyncedMd({ commit: git('rev-parse', 'HEAD'), dirty }));
  return { files, rewritten, dirty };
}

async function sync(target) {
  const { files, rewritten, dirty } = await plan();
  const { added, changed, removed } = await syncTarget(target, files);
  console.log(
    `synced ${files.size} files into ${target}: ${added.length} added, ${changed.length} changed, ` +
      `${removed.length} removed; ${rewritten} imports rewritten`,
  );
  if (dirty)
    console.warn('the kit has uncommitted changes; SYNCED.md says the working tree was dirty');
  return 0;
}

async function check(target) {
  const { files } = await plan();
  const { added, changed, removed } = await checkTarget(target, files);
  const lines = [
    ...added.map((path) => `missing  ${path}`),
    ...changed.map((path) => `differs  ${path}`),
    ...removed.map((path) => `extra    ${path}`),
  ];
  if (lines.length === 0) {
    console.log(`${target} matches the kit (${files.size} files)`);
    return 0;
  }
  console.error(`${target} differs from the kit (run pnpm sync:client):`);
  for (const line of lines) console.error(`  ${line}`);
  return 1;
}

async function verify() {
  const root = join(repo, 'dist/client-sync-verify');
  const target = join(root, 'ui-kit');
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  const { files, rewritten } = await plan();
  await syncTarget(target, files);
  console.log(
    `copied ${files.size} files into ${relative(repo, target)}; ${rewritten} imports rewritten`,
  );

  const clientConfig = join(client, 'tsconfig.json');
  const { config, error } = ts.readConfigFile(clientConfig, ts.sys.readFile);
  if (error) {
    const reason = existsSync(client)
      ? ts.flattenDiagnosticMessageText(error.messageText, '\n')
      : `no client checkout at ${client}; name one with --client <path>`;
    throw new Error(`cannot read ${clientConfig}: ${reason}`);
  }
  const entries = [...files.keys()].filter((path) => /^[^/]+\/public-api\.ts$/.test(path));
  const tsconfig = {
    compilerOptions: {
      ...config.compilerOptions,
      baseUrl: undefined,
      outDir: './out-tsc',
      sourceMap: false,
      noEmit: true,
    },
    angularCompilerOptions: config.angularCompilerOptions,
    files: entries.map((path) => `./ui-kit/${path}`),
  };
  const tsconfigPath = join(root, 'tsconfig.json');
  await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  const require = createRequire(import.meta.url);
  const ngc = join(
    dirname(require.resolve('@angular/compiler-cli/package.json')),
    'bundles/src/bin/ngc.js',
  );
  const result = spawnSync(process.execPath, [ngc, '-p', tsconfigPath], {
    cwd: root,
    encoding: 'utf8',
  });
  // A pretty (colored) ngc report would hide the error codes from the count.
  const output = `${result.stdout}${result.stderr}`.replace(/\x1b\[[0-9;]*m/g, '').trim();
  const errors = output.match(/error (TS|NG)\d+/g)?.length ?? 0;
  const ngcFailed = result.status !== 0 || errors > 0;
  console.log(
    `ngc with the options of ${clientConfig}: ${entries.length} entry points, ${errors} errors` +
      (ngcFailed && errors === 0 ? ` (exit ${result.status})` : ''),
  );
  if (ngcFailed && output) console.error(output);

  // The client builds with the sass of its Angular CLI; @angular/build carries the same one here.
  const sass = createRequire(require.resolve('@angular/build/package.json'))('sass');
  const stylesheets = [...files.keys()].filter(
    (path) => path.endsWith('.scss') && !/(^|\/)_[^/]+$/.test(path),
  );
  const failed = [];
  for (const path of stylesheets) {
    try {
      sass.compile(join(target, path), { silenceDeprecations: ['import'] });
    } catch (error) {
      failed.push(`${path}: ${String(error.message).split('\n')[0]}`);
    }
  }
  console.log(
    `sass without includePaths: ${stylesheets.length - failed.length}/${stylesheets.length} stylesheets`,
  );
  for (const line of failed) console.error(`  ${line}`);
  return ngcFailed || failed.length > 0 ? 1 : 0;
}
