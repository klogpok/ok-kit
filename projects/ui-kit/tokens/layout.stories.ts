import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { until } from '../.storybook/play';

const meta: Meta = {
  title: 'Foundations/Layout',
};

export default meta;
type Story = StoryObj;

const tile = (text: string, extra = ''): string =>
  `<div data-tile style="padding:8px 12px;background:var(--ui-color-surface-muted);color:var(--ui-color-text);border:1px solid var(--ui-color-border);border-radius:var(--ui-radius-control);${extra}">${text}</div>`;

const tiles = (count: number, extra = ''): string =>
  Array.from({ length: count }, (_, i) => tile(`פריט ${i + 1}`, extra)).join('');

const caption = (text: string): string => `<h3 class="ui-heading-4">${text}</h3>`;

const rects = (parent: Element): DOMRect[] =>
  [...parent.querySelectorAll(':scope > [data-tile]')].map((e) => e.getBoundingClientRect());

/** The space between two neighbors in a row, in either direction. */
const inlineGap = (a: DOMRect, b: DOMRect): number =>
  Math.round(Math.max(b.left - a.right, a.left - b.right));

const blockGap = (a: DOMRect, b: DOMRect): number => Math.round(b.top - a.bottom);

const byTestId = (canvas: HTMLElement, id: string): HTMLElement =>
  canvas.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

const rendered = (canvas: HTMLElement): Promise<void> =>
  until(() => !!canvas.querySelector('[data-tile]'), 'the tiles did not render');

/** `.ui-stack` lays children out in a column, md apart; a gap modifier changes the gap. */
export const Stack: Story = {
  render: () => ({
    template: `
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;align-items:start">
        <section>
          ${caption('ui-stack')}
          <div class="ui-stack" data-testid="stack">${tiles(3)}</div>
        </section>
        <section>
          ${caption('ui-stack ui-gap-xl, nested ui-stack')}
          <div class="ui-stack ui-gap-xl" data-testid="stack-xl">
            ${tiles(2)}
            <div class="ui-stack" data-testid="nested">${tiles(2)}</div>
          </div>
        </section>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    await rendered(canvasElement);
    const gaps = (id: string): number[] => {
      const r = rects(byTestId(canvasElement, id));
      return r.slice(1).map((rect, i) => blockGap(r[i], rect));
    };
    const stack = rects(byTestId(canvasElement, 'stack'));
    await expect({
      sameInlineStart: stack.every((r) => Math.round(r.left) === Math.round(stack[0].left)),
      stack: gaps('stack'),
      stackXl: gaps('stack-xl'),
      // The modifier sets the gap of its own element only; a nested stack keeps md.
      nested: gaps('nested'),
    }).toEqual({ sameInlineStart: true, stack: [12, 12], stackXl: [24], nested: [12] });
  },
};

/** `.ui-cluster` lays children out in a row from the inline start, centered, and wraps. */
export const Cluster: Story = {
  render: () => ({
    template: `
      <div class="ui-stack ui-gap-xl">
        <section>
          ${caption('ui-cluster')}
          <div class="ui-cluster" data-testid="cluster">
            ${tile('שמירה')}${tile('ביטול', 'padding-block:16px')}${tile('ייצוא לאקסל')}
          </div>
        </section>
        <section>
          ${caption('ui-cluster wraps')}
          <div class="ui-cluster" data-testid="wrap" style="max-inline-size:20rem">${tiles(6)}</div>
        </section>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    await rendered(canvasElement);
    const cluster = byTestId(canvasElement, 'cluster');
    const [a, b, c] = rects(cluster);
    const rtl = getComputedStyle(cluster).direction === 'rtl';
    const wrap = rects(byTestId(canvasElement, 'wrap'));
    const rows = new Set(wrap.map((r) => Math.round(r.top))).size;
    await expect({
      gaps: [inlineGap(a, b), inlineGap(b, c)],
      fromInlineStart: rtl ? a.right > b.right : a.left < b.left,
      centered: Math.round(a.top + a.height / 2) === Math.round(b.top + b.height / 2),
      wraps: rows > 1,
    }).toEqual({ gaps: [12, 12], fromInlineStart: true, centered: true, wraps: true });
  },
};

/**
 * `.ui-grid` fits as many columns as there is room for, each at least `--ui-grid-min` (20rem by
 * default); a column never overflows a narrower grid.
 */
export const Grid: Story = {
  render: () => ({
    template: `
      <div class="ui-stack ui-gap-xl" style="max-inline-size:44rem">
        <section>
          ${caption('ui-grid')}
          <div class="ui-grid" data-testid="grid">${tiles(4)}</div>
        </section>
        <section>
          ${caption('ui-grid, --ui-grid-min: 10rem')}
          <div class="ui-grid" data-testid="grid-10" style="--ui-grid-min:10rem">${tiles(4)}</div>
        </section>
        <section>
          ${caption('ui-grid ui-gap-xs in a 15rem column')}
          <div class="ui-grid ui-gap-xs" data-testid="narrow" style="max-inline-size:15rem">${tiles(2)}</div>
        </section>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    await rendered(canvasElement);
    const columns = (id: string): number =>
      getComputedStyle(byTestId(canvasElement, id)).gridTemplateColumns.split(' ').length;
    const narrow = byTestId(canvasElement, 'narrow');
    const [first, second] = rects(narrow);
    await expect({
      grid: columns('grid'),
      grid10: columns('grid-10'),
      narrow: columns('narrow'),
      narrowFits: Math.round(first.width) === Math.round(narrow.getBoundingClientRect().width),
      narrowGap: blockGap(first, second),
    }).toEqual({ grid: 2, grid10: 4, narrow: 1, narrowFits: true, narrowGap: 6 });
  },
};

/** `.ui-container` centers content up to 80rem wide, with lg inline padding. */
export const Container: Story = {
  render: () => ({
    template: `
      <div style="border:1px dashed var(--ui-color-border-control)">
        <div class="ui-container" data-testid="container">
          ${tile('תוכן העמוד ממורכז עד 80rem, עם ריווח בצדדים.')}
        </div>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    await rendered(canvasElement);
    const style = getComputedStyle(byTestId(canvasElement, 'container'));
    await expect({
      maxInlineSize: style.maxInlineSize,
      paddingInline: [style.paddingInlineStart, style.paddingInlineEnd],
      centered: style.marginInlineStart === style.marginInlineEnd,
    }).toEqual({ maxInlineSize: '1280px', paddingInline: ['16px', '16px'], centered: true });
  },
};

const gaps = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];

/** `.ui-gap-3xs` … `.ui-gap-3xl` set the gap of any layout class from the spacing scale. */
export const Gaps: Story = {
  render: () => ({
    template: `
      <div class="ui-stack">
        ${gaps
          .map(
            (gap) => `
          <div class="ui-cluster ui-gap-lg">
            <code class="ui-code" dir="ltr" style="inline-size:7rem">ui-gap-${gap}</code>
            <div class="ui-cluster ui-gap-${gap}" data-testid="gap-${gap}">${tiles(3)}</div>
          </div>`,
          )
          .join('')}
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    await rendered(canvasElement);
    const measured = gaps.map((gap) => {
      const [a, b] = rects(byTestId(canvasElement, `gap-${gap}`));
      return inlineGap(a, b);
    });
    await expect(measured).toEqual([2, 4, 6, 8, 12, 16, 24, 32, 48]);
  },
};
