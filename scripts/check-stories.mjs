// Runs axe (WCAG 2.1 A/AA) on every story of the built Storybook, in the light and dark themes
// and in RTL, and fails on violations or console errors. Uses the installed Edge through
// playwright-core, so no browser download is needed.
//
// Usage: pnpm build-storybook && pnpm test-storybook [--filter <story id part>]
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import { MODES, loadStories, openStory, option, startServer } from './storybook-pages.mjs';

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const stories = await loadStories(option('--filter'));
const server = await startServer();

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
  for (const mode of MODES) {
    errors.length = 0;
    const playError = await openStory(page, server.base, story.id, mode).catch((error) => {
      failures.push(`${story.id} [${mode.theme}/${mode.dir}] ${error.message}`);
      return undefined;
    });
    if (playError === undefined) continue;
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
    const name = `${mode.theme}/${mode.dir}`;
    if (playError) failures.push(`${story.id} [${name}] play function: ${playError}`);
    for (const v of violations) {
      failures.push(`${story.id} [${name}] ${v.id}: ${v.help}\n      ${v.nodes.join('\n      ')}`);
    }
    for (const error of errors) {
      // The preview logs a failed play function too, with its stack.
      if (playError && error.includes(playError)) continue;
      failures.push(`${story.id} [${name}] console: ${error}`);
    }
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
