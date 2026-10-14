// Host-CSS check: opens every story of the built Storybook, captures it, prepends a host app's
// global stylesheet to <head> (so the kit's styles still win ties, as in a host app) and captures
// again. Fails when the host stylesheet changes how a kit element looks:
// - a computed style of an element the kit renders, or
// - the pixels of a kit component: each outermost kit element is cut out of both captures and
//   compared, so a component that only moves (the story's own markup takes the host's
//   `text-align` or margins) does not count, while one whose inside changes does. A few stories
//   whose own markup inside a component changes are listed in `STORY_MARKUP`.
//
// The host stylesheet is the fixture in `scripts/host-css/`: Bootstrap 4.6.2 (vendored; its
// reboot is global) and the html/body rules of the VPlans client. Nothing is read from the client.
//
// Modes: light RTL, light LTR, and light RTL with the first kit button focused from the keyboard
// (Bootstrap has its own `button:focus` rules; stories with a play function are skipped there).
//
// The host body's `color` and `letter-spacing` are inherited by kit text that does not set its
// own, on purpose (see `.claude/rules/styles.md`). They are applied to both captures, so they do
// not count as changes; `--strict` leaves them out of the first capture and reports them too.
//
// Usage:
//   pnpm build-storybook && pnpm test-host-css [--filter <story id part>] [--strict]
// Captures of changed stories and `report.json` go to `dist/host-css/`.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { chromium } from 'playwright-core';
import { loadStories, openStory, option, startServer } from './storybook-pages.mjs';

const HOST_FILES = ['scripts/host-css/bootstrap-4.6.2.min.css', 'scripts/host-css/client.css'];
const outDir = resolve('dist/host-css');
const filter = option('--filter');
const strict = process.argv.includes('--strict');
const WORKERS = 4;
/** "Today" in calendars, as in the visual baselines. */
const NOW = new Date('2026-09-25T10:00:00+03:00');

const MODES = [
  { name: 'light-rtl', theme: 'light', dir: 'rtl' },
  { name: 'light-ltr', theme: 'light', dir: 'ltr' },
  { name: 'focus-rtl', theme: 'light', dir: 'rtl', focus: true },
];

/** Computed properties compared on every kit element. Sizes are left to the pixel comparison. */
const PROPS = [
  'display',
  'box-sizing',
  'margin-top',
  'margin-bottom',
  'margin-inline-start',
  'margin-inline-end',
  'padding-top',
  'padding-bottom',
  'padding-inline-start',
  'padding-inline-end',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'color',
  'background-color',
  'background-image',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-bottom-width',
  'border-radius',
  'box-shadow',
  'outline-style',
  'outline-width',
  'outline-color',
  'outline-offset',
  'vertical-align',
  'text-align',
  'text-decoration-line',
  'text-transform',
  'cursor',
  'list-style-type',
  'white-space',
  'overflow-x',
  'overflow-y',
  'position',
  'opacity',
  'fill',
  'stroke',
  'appearance',
  'user-select',
];
const DISPLAY = PROPS.indexOf('display');
const OUTLINE_STYLE = PROPS.indexOf('outline-style');
const OUTLINE_PARTS = new Set(['outline-width', 'outline-color', 'outline-offset']);

/** Whether a computed property is the same in both captures, or differs without any effect. */
function unchanged(before, after, prop, index) {
  const [b, a] = [before.values[index], after.values[index]];
  if (b === a) return true;
  // Bootstrap's `button { -webkit-appearance: button }` is what `auto` already is on a button.
  if (prop === 'appearance' && before.tag === 'button') {
    return [b, a].every((value) => value === 'auto' || value === 'button');
  }
  // An outline that is not drawn: its width, color and offset do not matter.
  if (OUTLINE_PARTS.has(prop)) {
    return before.values[OUTLINE_STYLE] === 'none' && after.values[OUTLINE_STYLE] === 'none';
  }
  return false;
}

const hostCss = (await Promise.all(HOST_FILES.map((file) => readFile(resolve(file), 'utf8')))).join(
  '\n',
);
// The host's page background is not the kit's concern; the story canvas keeps the kit's.
const HOST_STYLE = `${hostCss}\nbody { background: transparent !important; }`;
/**
 * Stories whose own markup inside a kit component takes the host's element rules, so the pixels
 * of that component change while no kit element does (their computed styles are still checked).
 * Each entry was looked at; add one only for markup that is the story's, not the kit's.
 */
const STORY_MARKUP = new Map([
  [
    'data-display-table--expandable-rows',
    "the detail row holds the story's own <dl>; Bootstrap makes its <dt> bold",
  ],
  [
    'navigation-stepper--default',
    "the steps hold the story's own <p>; Bootstrap's p margins change the stepper's height",
  ],
  [
    'navigation-stepper--vertical',
    "the steps hold the story's own <p>; Bootstrap's p margins change the stepper's height",
  ],
]);

/** Takes back the host's `text-align` for the pixel comparison (see `run()`). */
const PIN_STYLE = 'body { text-align: start !important; }';

/**
 * Computed styles of every element in the story root and the overlays, whether the kit rendered
 * it, and the page box of each outermost kit element. A kit element is a kit component (an `ui-*`
 * tag or class; not the layout and typography classes, which style the app's own elements, nor
 * the stories' `ui-story-*` components), an element of a kit template (its `_ngcontent-*`
 * attribute names a kit host) or an element the kit creates at run time (the SVG of `ui-icon`).
 * CDK's overlay wrappers are not kit elements: they hold no content of their own.
 */
const SNAPSHOT = `(props) => {
  const notKit = /^ui-(story|stack|cluster|grid|container|gap-|visually-hidden|display|heading-|body|caption|label$|code$|text-)/;
  const kitClass = (c) => c.startsWith('ui-') && !notKit.test(c);
  const isKit = (el) => {
    if (el.classList.contains('cdk-overlay-pane')) return false;
    const tag = el.tagName.toLowerCase();
    return (tag.startsWith('ui-') && !notKit.test(tag)) || [...el.classList].some(kitClass);
  };
  const roots = [document.querySelector('#storybook-root'), ...document.querySelectorAll('.cdk-overlay-container')].filter(Boolean);
  const all = roots.flatMap((root) => [...root.querySelectorAll('*')]);
  const kitHosts = new Set();
  for (const el of all) {
    if (!isKit(el)) continue;
    for (const name of el.getAttributeNames()) if (name.startsWith('_nghost-')) kitHosts.add(name.slice(8));
  }
  const owned = new Map();
  const isOwned = (el) => {
    if (!el || roots.includes(el)) return false;
    if (owned.has(el)) return owned.get(el);
    let result;
    if (isKit(el)) result = true;
    else {
      const content = el.getAttributeNames().find((name) => name.startsWith('_ngcontent-'));
      if (content) result = kitHosts.has(content.slice(11));
      else result = !!el.closest('ui-icon');
    }
    owned.set(el, result);
    return result;
  };
  return all.map((el) => {
    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const cls = [...el.classList].find(kitClass);
    const host = el.closest('[class*="ui-"], ui-icon');
    const ownerClass = host ? [...host.classList].find((c) => /^ui-[a-z0-9-]+$/.test(c) && kitClass(c)) : null;
    const kit = isOwned(el);
    let box = null;
    let outermost = kit;
    for (let parent = el.parentElement; outermost && parent && !roots.includes(parent); parent = parent.parentElement) {
      if (isKit(parent) || isOwned(parent)) outermost = false;
    }
    if (outermost) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        box = { x: rect.left + scrollX, y: rect.top + scrollY, width: rect.width, height: rect.height };
      }
    }
    return {
      tag,
      key: tag + (cls ? '.' + cls : ''),
      owner: ownerClass ?? (host ? host.tagName.toLowerCase() : ''),
      kit,
      box,
      values: props.map((p) => cs.getPropertyValue(p)),
    };
  });
}`;

/** A full-page screenshot and the snapshot, once the page has settled. */
async function capture(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
  await page.waitForTimeout(100);
  const png = PNG.sync.read(
    await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' }),
  );
  const elements = await page.evaluate(`(${SNAPSHOT})(${JSON.stringify(PROPS)})`);
  return { png, elements };
}

/** The pixels of `box` (page coordinates, rounded out to whole pixels), or null when outside. */
function crop(png, box) {
  const x = Math.max(0, Math.floor(box.x));
  const y = Math.max(0, Math.floor(box.y));
  const width = Math.min(png.width, Math.ceil(box.x + box.width)) - x;
  const height = Math.min(png.height, Math.ceil(box.y + box.height)) - y;
  if (width <= 0 || height <= 0) return null;
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, x, y, width, height, 0, 0);
  return out;
}

/** Pixels that differ between two crops; `Infinity` when their sizes differ. */
function compare(before, after) {
  if (!before || !after) return before === after ? 0 : Infinity;
  if (before.width !== after.width || before.height !== after.height) return Infinity;
  return pixelmatch(before.data, after.data, null, after.width, after.height, { threshold: 0.1 });
}

async function prependStyle(page, id, css) {
  await page.evaluate(
    ([styleId, text]) => {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = text;
      document.head.prepend(style);
    },
    [id, css],
  );
}

/** Focuses the first kit button of the story as the keyboard would; false when there is none. */
async function focusButton(page) {
  return page.evaluate(() => {
    const button = [...document.querySelectorAll('#storybook-root .ui-button')].find(
      (element) => element.getClientRects().length > 0 && !element.disabled,
    );
    if (!button) return false;
    button.focus({ focusVisible: true });
    return document.activeElement === button;
  });
}

const stories = await loadStories(filter);
const server = await startServer();
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

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

// What the host body passes down; applied to both captures unless --strict.
const accepted = await (async () => {
  const page = await context.newPage();
  await page.setContent(`<style>${hostCss}</style><body></body>`);
  const values = await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    return { color: cs.color, letterSpacing: cs.letterSpacing };
  });
  await page.close();
  return values;
})();
const ACCEPTED_STYLE = `body { color: ${accepted.color}; letter-spacing: ${accepted.letterSpacing}; }`;

const jobs = stories.flatMap((story) =>
  MODES.filter((mode) => !mode.focus || !story.tags?.includes('play-fn')).map((mode) => ({
    story,
    mode,
  })),
);
const results = [];
/** `element|property|before → after` → the captures and kit components it was seen in. */
const styleChanges = new Map();

async function run(page, { story, mode }) {
  const name = `${story.id}.${mode.name}`;
  const playError = await openStory(page, server.base, story.id, mode);
  if (playError) throw new Error(`play function: ${playError}`);
  if (mode.focus && !(await focusButton(page))) return;
  if (!strict) await prependStyle(page, 'host-accepted', ACCEPTED_STYLE);
  const before = await capture(page);
  await prependStyle(page, 'host-css', HOST_STYLE);
  const after = await capture(page);
  // The pixels are compared with the host's `text-align` taken back: the story's own markup
  // inherits it and moves the components by a fraction of a pixel, which changes the
  // anti-aliasing of their text. A kit element that inherits it is caught by its computed
  // `text-align` above.
  await page.addStyleTag({ content: PIN_STYLE });
  const pinned = await capture(page);
  if (
    before.elements.length !== after.elements.length ||
    before.elements.length !== pinned.elements.length
  ) {
    throw new Error('the host stylesheet changed the number of elements');
  }

  const components = [];
  const writes = [];
  let styles = 0;
  before.elements.forEach((b, i) => {
    const a = after.elements[i];
    const p = pinned.elements[i];
    // An element that is not rendered (`hidden`) has no styles that matter.
    const rendered = b.values[DISPLAY] !== 'none' || a.values[DISPLAY] !== 'none';
    if (b.kit && rendered) {
      PROPS.forEach((prop, j) => {
        if (unchanged(b, a, prop, j)) return;
        styles++;
        const key = `${b.key}|${prop}|${b.values[j]} → ${a.values[j]}`;
        const entry = styleChanges.get(key) ?? { captures: new Set(), owners: new Set() };
        entry.captures.add(name);
        if (b.owner) entry.owners.add(b.owner);
        styleChanges.set(key, entry);
      });
    }
    if (b.box || p.box) {
      const cropBefore = b.box && crop(before.png, b.box);
      const cropAfter = p.box && crop(pinned.png, p.box);
      const pixels = compare(cropBefore, cropAfter);
      if (pixels) {
        const id = `${name}.${components.length + 1}`;
        components.push(
          `${b.key} #${components.length + 1} (${pixels === Infinity ? 'size' : `${pixels} px`})`,
        );
        if (cropBefore) writes.push([`${id}.before.png`, cropBefore]);
        if (cropAfter) writes.push([`${id}.after.png`, cropAfter]);
      }
    }
  });

  const markup = STORY_MARKUP.get(story.id);
  if (components.length && !markup) {
    writes.push([`${name}.before.png`, before.png], [`${name}.after.png`, pinned.png]);
    for (const [file, png] of writes) await writeFile(join(outDir, file), PNG.sync.write(png));
  }
  results.push({
    name,
    components: markup ? [] : components,
    known: markup && components.length ? `${components.join(', ')}: ${markup}` : null,
    styles,
  });
}

await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    const page = await context.newPage();
    for (let job = jobs.shift(); job; job = jobs.shift()) {
      try {
        await run(page, job);
      } catch (error) {
        results.push({
          name: `${job.story.id}.${job.mode.name}`,
          error: error.message.split('\n')[0],
        });
      }
    }
    await page.close();
  }),
);

await browser.close();
server.close();

const styleRows = [...styleChanges.entries()]
  .map(([key, value]) => ({
    key,
    captures: [...value.captures].sort(),
    owners: [...value.owners].sort(),
  }))
  .sort((a, b) => b.captures.length - a.captures.length || a.key.localeCompare(b.key));
const changed = results
  .filter((r) => r.error || r.components.length || r.styles)
  .sort((a, b) => a.name.localeCompare(b.name));
const known = results.filter((r) => r.known).sort((a, b) => a.name.localeCompare(b.name));
await writeFile(
  join(outDir, 'report.json'),
  JSON.stringify(
    {
      accepted: strict ? null : accepted,
      captures: results.length,
      changed,
      known: known.map((r) => ({ name: r.name, known: r.known })),
      styles: styleRows,
    },
    null,
    1,
  ),
);

console.log(
  `Checked ${stories.length} stories, ${results.length} captures (${MODES.map((m) => m.name).join(', ')}).`,
);
console.log(
  strict
    ? 'Strict: the host body color and letter-spacing count as changes.'
    : `Inherited from the host body in both captures: color ${accepted.color}, letter-spacing ${accepted.letterSpacing}.`,
);
if (known.length) {
  console.log(
    `${known.length} capture(s) where only the story's own markup changes (not failures):`,
  );
  for (const r of known) console.log(`  ${r.name}: ${r.known}`);
}
if (changed.length) {
  console.error(`${changed.length} capture(s) where the host stylesheet changes the kit:`);
  for (const r of changed) {
    const parts = r.error
      ? [r.error]
      : [
          r.components.length && `pixels of ${r.components.join(', ')}`,
          r.styles && `${r.styles} computed style(s)`,
        ].filter(Boolean);
    console.error(`  ${r.name}: ${parts.join('; ')}`);
  }
  if (styleRows.length) {
    console.error('\nComputed styles of kit elements (captures, element|property|before → after):');
    for (const row of styleRows.slice(0, 60)) {
      console.error(
        `  ${String(row.captures.length).padStart(4)}  ${row.key}  [${row.owners.join(', ')}]`,
      );
    }
  }
  console.error(`\nCaptures and report.json: ${outDir}`);
  process.exit(1);
}
console.log('The host stylesheet changes no kit element.');
