// Opens every story of the built kit Storybook (light, RTL), captures it, then prepends the client's
// global CSS to <head> (so kit styles still win ties, as in the app) and captures again.
// Reports pixel differences and, per kit element, which computed properties the client CSS changed.
// Run from C:/vplans/ok-kit-20:  node <this> <client-global.css> <outDir>
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const kit = 'C:/vplans/ok-kit-20';
const imp = (p) => import(pathToFileURL(join(kit, p)).href);
const { default: pixelmatch } = await import(pathToFileURL(join(kit, 'node_modules/pixelmatch/index.js')).href);
const { PNG } = (await import(pathToFileURL(join(kit, 'node_modules/pngjs/lib/png.js')).href)).default;
const { chromium } = await import(pathToFileURL(join(kit, 'node_modules/playwright-core/index.mjs')).href);
const { loadStories, openStory, startServer } = await imp('scripts/storybook-pages.mjs');

const [cssFile, outDir] = process.argv.slice(2);
const hostCss = await readFile(cssFile, 'utf8');
await mkdir(outDir, { recursive: true });

const PROPS = [
  'display', 'box-sizing', 'margin-top', 'margin-bottom', 'margin-inline-start', 'margin-inline-end',
  'padding-top', 'padding-bottom', 'padding-inline-start', 'padding-inline-end',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color',
  'background-color', 'background-image', 'border-top-width', 'border-top-style', 'border-top-color',
  'border-radius', 'box-shadow', 'outline-style', 'outline-width', 'vertical-align', 'text-align',
  'text-decoration-line', 'text-transform', 'cursor', 'list-style-type', 'white-space', 'overflow',
  'position', 'opacity', 'fill', 'width', 'height', 'min-height', 'appearance',
];

const SNAPSHOT = `(props) => {
  const roots = [document.querySelector('#storybook-root'), ...document.querySelectorAll('.cdk-overlay-container')].filter(Boolean);
  const out = [];
  for (const root of roots) for (const el of root.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const cls = [...el.classList].find((c) => c.startsWith('ui-')) ?? '';
    const host = el.closest('[class*="ui-"]');
    const owner = host ? ([...host.classList].find((c) => /^ui-[a-z-]+$/.test(c)) ?? host.tagName.toLowerCase()) : '';
    out.push({ key: el.tagName.toLowerCase() + (cls ? '.' + cls : ''), owner, values: props.map((p) => cs.getPropertyValue(p)) });
  }
  return out;
}`;

async function capture(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
  await page.waitForTimeout(100);
  return PNG.sync.read(await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' }));
}

const stories = await loadStories(process.argv[4] ?? '');
const server = await startServer();
const browser = await chromium.launch({ channel: 'msedge' });
const context = await browser.newContext({
  viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, reducedMotion: 'reduce',
  colorScheme: 'light', locale: 'he-IL', timezoneId: 'Asia/Jerusalem',
});
await context.clock.setFixedTime(new Date('2026-09-25T10:00:00+03:00'));

const results = [];
const changes = new Map(); // "key|prop|before→after" → { count, stories:Set, owners:Set }
const queue = [...stories];

await Promise.all(Array.from({ length: 4 }, async () => {
  const page = await context.newPage();
  for (let story = queue.shift(); story; story = queue.shift()) {
    try {
      await openStory(page, server.base, story.id, { theme: 'light', dir: 'rtl' });
      const before = await capture(page);
      const styleBefore = await page.evaluate(`(${SNAPSHOT})(${JSON.stringify(PROPS)})`);
      await page.evaluate((css) => {
        const style = document.createElement('style');
        style.id = 'host-css';
        style.textContent = css + '\nbody { background: transparent !important; }';
        document.head.prepend(style);
      }, hostCss);
      const after = await capture(page);
      const styleAfter = await page.evaluate(`(${SNAPSHOT})(${JSON.stringify(PROPS)})`);
      let ratio = 1;
      if (before.width === after.width && before.height === after.height) {
        const diff = new PNG({ width: after.width, height: after.height });
        const n = pixelmatch(before.data, after.data, diff.data, after.width, after.height, { threshold: 0.1 });
        ratio = n / (after.width * after.height);
        if (n > 0) {
          await writeFile(join(outDir, `${story.id}.before.png`), PNG.sync.write(before));
          await writeFile(join(outDir, `${story.id}.after.png`), PNG.sync.write(after));
          await writeFile(join(outDir, `${story.id}.diff.png`), PNG.sync.write(diff));
        }
      }
      results.push({ id: story.id, ratio, size: before.width === after.width && before.height === after.height ? '' : `${before.width}x${before.height}→${after.width}x${after.height}` });
      if (styleBefore.length === styleAfter.length) {
        styleBefore.forEach((b, i) => {
          const a = styleAfter[i];
          PROPS.forEach((p, j) => {
            if (b.values[j] === a.values[j] || ['width', 'height'].includes(p)) return;
            const k = `${b.key}|${p}|${b.values[j]} → ${a.values[j]}`;
            const entry = changes.get(k) ?? { count: 0, stories: new Set(), owners: new Set() };
            entry.count++; entry.stories.add(story.id); entry.owners.add(b.owner);
            changes.set(k, entry);
          });
        });
      }
    } catch (error) {
      results.push({ id: story.id, ratio: NaN, error: error.message.split('\n')[0] });
    }
  }
  await page.close();
}));

await browser.close();
server.close();

const changed = results.filter((r) => r.ratio > 0 || r.size || r.error).sort((a, b) => b.ratio - a.ratio);
const rows = [...changes.entries()].map(([k, v]) => ({ k, count: v.count, stories: v.stories.size, owners: [...v.owners].join(',') })).sort((a, b) => b.stories - a.stories);
await writeFile(join(outDir, 'report.json'), JSON.stringify({ total: results.length, changed, rows }, null, 1));
console.log(`stories: ${results.length}, visually changed: ${changed.filter((r) => r.ratio > 0 || r.size).length}, errors: ${changed.filter((r) => r.error).length}`);
for (const r of changed.slice(0, 60)) console.log(`${(r.ratio * 100).toFixed(2).padStart(6)}%  ${r.id} ${r.size ?? ''} ${r.error ?? ''}`);
console.log('\n--- computed style changes (top 80 by stories) ---');
for (const r of rows.slice(0, 80)) console.log(`${String(r.stories).padStart(4)} st  ${r.k}   [${r.owners}]`);
