// Copies projects/ui-kit into dist/client-check/ok-kit (as if under apartment-changes-new),
// rewrites @vplans/ui-kit/<entry> to relative paths, and writes a tsconfig with the client's options.
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';

const kit = 'C:/vplans/ok-kit-20/projects/ui-kit';
const out = 'C:/vplans/ok-kit-20/dist/client-check';
const dest = join(out, 'ok-kit');
const SKIP_DIRS = new Set(['.storybook', 'docs', 'src', 'node_modules']);
const SKIP_FILE = /(\.spec\.ts|\.stories\.ts|ng-package\.json|package\.json|tsconfig.*\.json|test-setup.*|\.md|\.mdx|\.mts)$/;

await rm(out, { recursive: true, force: true });
await mkdir(dest, { recursive: true });

const entries = [];
for (const e of await readdir(kit, { withFileTypes: true })) {
  if (!e.isDirectory() || SKIP_DIRS.has(e.name) || e.name.startsWith('test-setup')) continue;
  entries.push(e.name);
  await cp(join(kit, e.name), join(dest, e.name), {
    recursive: true,
    filter: (src) => !SKIP_FILE.test(src),
  });
}

async function walk(dir) {
  const items = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(items.map((i) => (i.isDirectory() ? walk(join(dir, i.name)) : [join(dir, i.name)])))).flat();
}

let rewritten = 0;
const leftovers = [];
for (const file of (await walk(dest)).filter((f) => f.endsWith('.ts'))) {
  let text = await readFile(file, 'utf8');
  const next = text.replace(/(['"])@vplans\/ui-kit\/([a-z-]+)\1/g, (_, q, entry) => {
    rewritten++;
    let rel = relative(dirname(file), join(dest, entry, 'public-api')).replaceAll('\\', '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return q + rel + q;
  });
  if (/@vplans\/ui-kit/.test(next)) leftovers.push(file);
  if (next !== text) await writeFile(file, next);
}

const client = JSON.parse(await readFile('C:/vplans/client/tsconfig.json', 'utf8'));
const tsconfig = {
  compilerOptions: { ...client.compilerOptions, baseUrl: undefined, outDir: './out-tsc', noEmit: true, sourceMap: false },
  angularCompilerOptions: client.angularCompilerOptions,
  files: entries.filter((e) => !['styles', 'tokens'].includes(e)).map((e) => `./ok-kit/${e}/public-api.ts`),
};
await writeFile(join(out, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

console.log(JSON.stringify({ entries: entries.length, rewritten, leftovers }, null, 2));
