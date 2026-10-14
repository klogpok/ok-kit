// Compiles every component .scss of the relocated copy (partials skipped) with no includePaths.
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const sass = await import(pathToFileURL('C:/vplans/ok-kit-20/node_modules/.pnpm/sass@1.105.0/node_modules/sass/sass.node.mjs').href);
const root = 'C:/vplans/ok-kit-20/dist/client-check/ok-kit';

async function walk(dir) {
  const items = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(items.map((i) => (i.isDirectory() ? walk(join(dir, i.name)) : [join(dir, i.name)])))).flat();
}

const files = (await walk(root)).filter((f) => f.endsWith('.scss') && !/[\\/]_[^\\/]+$/.test(f));
const failed = [];
for (const file of files) {
  try {
    sass.compile(file, { silenceDeprecations: ['import'] });
  } catch (error) {
    failed.push(`${file}: ${error.message.split('\n')[0]}`);
  }
}
console.log(`compiled ${files.length - failed.length}/${files.length}`);
for (const line of failed) console.log(line);
