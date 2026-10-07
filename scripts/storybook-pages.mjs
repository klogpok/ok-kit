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

// The preview emits `storyFinished` once a story has rendered and its play function has run, and
// `playFunctionThrewException` before it when the play function threw or an `expect` in it
// failed. (`storyFinished` reports `success` then too: its status only counts the reporters, such
// as the a11y addon.) The channel is created before any story renders, so a setter on its global
// catches it.
const LISTEN_FOR_FINISH = `(() => {
  let channel;
  Object.defineProperty(globalThis, '__STORYBOOK_ADDONS_CHANNEL__', {
    configurable: true,
    get: () => channel,
    set: (value) => {
      channel = value;
      value.on('playFunctionThrewException', (error) => { globalThis.__uiPlayError = error.message; });
      value.on('storyFinished', () => { globalThis.__uiStoryFinished = true; });
    },
  });
})();`;
const listening = new WeakSet();

/**
 * Opens a story and waits until it has rendered and its play function (if any) has finished.
 * Returns the message of a failed play function, or `null`.
 */
export async function openStory(page, base, id, mode) {
  if (!listening.has(page)) {
    await page.addInitScript(LISTEN_FOR_FINISH);
    listening.add(page);
  }
  await page.goto(storyUrl(base, id, mode));
  const finished = await page
    .waitForFunction(() => globalThis.__uiStoryFinished, null, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!finished) throw new Error(`${id} did not finish rendering in 15 s`);
  return page.evaluate(() => globalThis.__uiPlayError ?? null);
}
