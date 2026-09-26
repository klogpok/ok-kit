// Shared helpers of the scripts that open every story of the built Storybook
// (`check-stories.mjs`, `check-visual.mjs`): a static server for `dist/storybook/ui-kit`, the
// story list from its `index.json` and the theme/direction modes.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

export const root = resolve('dist/storybook/ui-kit');

/** Every story is checked in these modes. */
export const MODES = [
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

/** Value of a `--name value` command line option, or `fallback`. */
export function option(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index > 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

/** Serves the built Storybook on a free port. */
export async function startServer() {
  const server = createServer(async (request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname));
    const file = join(root, path.endsWith('/') ? `${path}index.html` : path);
    if (!file.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => server.close(),
  };
}

/** Stories (not docs pages) whose id contains `filter`. */
export async function loadStories(filter = '') {
  const index = JSON.parse(await readFile(join(root, 'index.json'), 'utf8'));
  return Object.values(index.entries).filter(
    (entry) => entry.type === 'story' && entry.id.includes(filter),
  );
}

/** URL of a story alone (no Storybook UI) in a theme and direction. */
export function storyUrl(base, id, { theme, dir }) {
  return `${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};dir:${dir}`;
}

/** Opens a story and waits until it has rendered. */
export async function openStory(page, base, id, mode) {
  await page.goto(storyUrl(base, id, mode));
  await page.waitForSelector('#storybook-root > *', { timeout: 10000 }).catch(() => undefined);
}
