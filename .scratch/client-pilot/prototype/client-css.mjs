// Builds the client's global CSS (bootstrap + styles.scss + ol + ckeditor5) into the scratchpad.
// Tailwind is left out: no preflight, its utilities only hit elements with tailwind classes.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sass = await import(pathToFileURL('C:/vplans/ok-kit-20/node_modules/.pnpm/sass@1.105.0/node_modules/sass/sass.node.mjs').href);
const client = 'C:/vplans/client';
const out = process.argv[2];

const scss = sass.compile(`${client}/src/styles.scss`, {
  loadPaths: [`${client}/src`, `${client}/node_modules`],
  importers: [new sass.NodePackageImporter(client)],
  silenceDeprecations: ['import', 'global-builtin', 'mixed-decls', 'color-functions'],
  quietDeps: true,
  logger: sass.Logger.silent,
});

const parts = [
  ['bootstrap', await readFile(`${client}/node_modules/bootstrap/dist/css/bootstrap.min.css`, 'utf8')],
  ['styles.scss', scss.css],
  ['ol', await readFile(`${client}/node_modules/ol/ol.css`, 'utf8')],
  ['ckeditor5', await readFile(`${client}/node_modules/ckeditor5/dist/ckeditor5.css`, 'utf8')],
];
await writeFile(out, parts.map(([name, css]) => `/* ==== ${name} ==== */\n${css}`).join('\n'));
console.log(parts.map(([name, css]) => `${name}: ${css.length}`).join('\n'));
