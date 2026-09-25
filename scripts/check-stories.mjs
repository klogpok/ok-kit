// Runs axe (WCAG 2.1 A/AA) on every story of the built Storybook, in the light and dark themes
// and in RTL, and fails on violations or console errors. Uses the installed Edge through
// playwright-core, so no browser download is needed.
//
// Usage: pnpm build-storybook && pnpm test-storybook [--filter <story id part>]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const root = resolve('dist/storybook/ui-kit');
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const filterIndex = process.argv.indexOf('--filter');
const filter = filterIndex > 0 ? process.argv[filterIndex + 1] : '';

const MODES = [
  { theme: 'light', dir: 'rtl' },
  { theme: 'dark', dir: 'rtl' },
  { theme: 'light', dir: 'ltr' },
];

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};

const server = createServer(async (request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname));
  const file = join(root, path.endsWith('/') ? `${path}index.html` : path);
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;

const index = JSON.parse(await readFile(join(root, 'index.json'), 'utf8'));
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && entry.id.includes(filter),
);

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
const errors = [];
page.on('console', (message) => {
  // Failed requests are reported with their URL below.
  if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
    errors.push(message.text());
  }
});
page.on('pageerror', (error) => errors.push(error.message));
// A missing favicon is not a story problem; report other failed requests with their URL.
page.on('response', (response) => {
  const url = response.url();
  if (response.status() >= 400 && !url.endsWith('/favicon.ico')) {
    errors.push(`HTTP ${response.status()} ${url}`);
  }
});

const failures = [];
for (const story of stories) {
  for (const { theme, dir } of MODES) {
    errors.length = 0;
    const url = `${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};dir:${dir}`;
    await page.goto(url);
    await page.waitForSelector('#storybook-root > *', { timeout: 10000 }).catch(() => undefined);
    // Let entry animations finish, so colours are measured at rest.
    await page.waitForTimeout(400);
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      });
      return result.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 3),
      }));
    });
    const mode = `${theme}/${dir}`;
    for (const v of violations) {
      failures.push(`${story.id} [${mode}] ${v.id}: ${v.help}\n      ${v.nodes.join('\n      ')}`);
    }
    for (const error of errors) failures.push(`${story.id} [${mode}] console: ${error}`);
  }
}

await browser.close();
server.close();

console.log(`Checked ${stories.length} stories in ${MODES.length} modes.`);
if (failures.length) {
  console.error(`${failures.length} problem(s):\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('No accessibility violations or console errors.');
