// Visual regression: takes a screenshot of every story of the built Storybook in the modes of
// `test-storybook` (light/rtl, dark/rtl, light/ltr) and compares it with the baseline in
// `visual/`. Differences above 0.1% of the pixels fail; the diff and the new screenshot are
// written to `dist/visual-diff/`. Uses the installed Edge through playwright-core.
//
// Usage:
//   pnpm build-storybook && pnpm test-visual [--filter <story id part>]
//   pnpm test-visual:update [--filter <story id part>]   (writes new or changed baselines)
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { chromium } from 'playwright-core';
import { MODES, loadStories, openStory, option, startServer } from './storybook-pages.mjs';

const baselineDir = resolve('visual');
const diffDir = resolve('dist/visual-diff');
const filter = option('--filter');
const update = process.argv.includes('--update');
/** Share of pixels that may differ. */
const MAX_DIFF_RATIO = 0.001;
/** Parallel pages. */
const WORKERS = 4;
/** "Today" in calendars, so the baselines do not change every day. */
const NOW = new Date('2026-09-25T10:00:00+03:00');

const stories = await loadStories(filter);
const server = await startServer();
await mkdir(baselineDir, { recursive: true });
await rm(diffDir, { recursive: true, force: true });

const browser = await chromium.launch({ channel: 'msedge' });
const context = await browser.newContext({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  colorScheme: 'light',
  locale: 'he-IL',
  timezoneId: 'Asia/Jerusalem',
});
await context.clock.setFixedTime(NOW);

/** Screenshot of the story root and its open overlays (dialogs, menus live outside the root). */
async function capture(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
  await page.waitForTimeout(150);
  const clip = await page.evaluate(() => {
    const boxes = [
      document.querySelector('#storybook-root'),
      ...document.querySelectorAll('.cdk-overlay-pane'),
    ]
      .filter(Boolean)
      .map((element) => element.getBoundingClientRect())
      .filter((box) => box.width > 0 && box.height > 0);
    if (!boxes.length) return null;
    const x = Math.floor(Math.min(...boxes.map((box) => box.left + scrollX)));
    const y = Math.floor(Math.min(...boxes.map((box) => box.top + scrollY)));
    const right = Math.ceil(Math.max(...boxes.map((box) => box.right + scrollX)));
    const bottom = Math.ceil(Math.max(...boxes.map((box) => box.bottom + scrollY)));
    return {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: right - Math.max(0, x),
      height: bottom - Math.max(0, y),
    };
  });
  return page.screenshot({
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    ...(clip ? { clip } : {}),
  });
}

/** Number of differing pixels, or `Infinity` when the sizes differ. */
function compare(expected, actual, diff) {
  if (expected.width !== actual.width || expected.height !== actual.height) return Infinity;
  return pixelmatch(expected.data, actual.data, diff?.data ?? null, actual.width, actual.height, {
    threshold: 0.1,
  });
}

async function readBaseline(file) {
  try {
    return PNG.sync.read(await readFile(file));
  } catch {
    return null;
  }
}

const jobs = stories.flatMap((story) => MODES.map((mode) => ({ story, mode })));
const failures = [];
const written = [];
const names = new Set();

async function run(job) {
  const { story, mode } = job;
  const name = `${story.id}.${mode.theme}-${mode.dir}`;
  names.add(`${name}.png`);
  const file = join(baselineDir, `${name}.png`);
  const page = job.page;
  try {
    await openStory(page, server.base, story.id, mode);
    let buffer = await capture(page);
    let actual = PNG.sync.read(buffer);
    const expected = await readBaseline(file);
    const limit = (png) => png.width * png.height * MAX_DIFF_RATIO;
    let differing = expected ? compare(expected, actual) : Infinity;
    // A late render (images, fonts, deferred views) gets one more chance.
    if (expected && differing > limit(actual)) {
      await page.waitForTimeout(500);
      buffer = await capture(page);
      actual = PNG.sync.read(buffer);
      differing = compare(expected, actual);
    }
    if (expected && differing <= limit(actual)) return;
    if (update) {
      await writeFile(file, buffer);
      written.push(name);
      return;
    }
    await mkdir(diffDir, { recursive: true });
    await writeFile(join(diffDir, `${name}.actual.png`), buffer);
    if (!expected) {
      failures.push(`${name}: no baseline (run pnpm test-visual:update)`);
    } else if (differing === Infinity) {
      failures.push(
        `${name}: size ${actual.width}×${actual.height}, baseline ${expected.width}×${expected.height}`,
      );
    } else {
      const diff = new PNG({ width: actual.width, height: actual.height });
      compare(expected, actual, diff);
      await writeFile(join(diffDir, `${name}.diff.png`), PNG.sync.write(diff));
      const ratio = (differing / (actual.width * actual.height)) * 100;
      failures.push(`${name}: ${differing} pixels differ (${ratio.toFixed(2)}%)`);
    }
  } catch (error) {
    failures.push(`${name}: ${error.message.split('\n')[0]}`);
  }
}

await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    const page = await context.newPage();
    for (let job = jobs.shift(); job; job = jobs.shift()) await run({ ...job, page });
    await page.close();
  }),
);

// Baselines of stories that no longer exist (only known when every story ran).
const stale = filter
  ? []
  : (await readdir(baselineDir)).filter((file) => file.endsWith('.png') && !names.has(file));
if (update) for (const file of stale) await rm(join(baselineDir, file));

await browser.close();
server.close();

console.log(`Compared ${stories.length} stories in ${MODES.length} modes.`);
if (update) {
  console.log(`Wrote ${written.length} baseline(s), removed ${stale.length} stale one(s).`);
  for (const name of written) console.log(`  ${name}`);
}
for (const file of update ? [] : stale) failures.push(`${file}: baseline of a removed story`);
if (failures.length) {
  failures.sort();
  console.error(`${failures.length} problem(s):\n  ${failures.join('\n  ')}`);
  if (!update) console.error(`Screenshots and diffs: ${diffDir}`);
  process.exit(1);
}
if (!update) console.log('No visual changes.');
