import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { until } from '../.storybook/play';
import { UiButton } from '@vplans/ui-kit/button';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiInput } from '@vplans/ui-kit/input';
import { UiSegment, UiSegmented } from '@vplans/ui-kit/segmented';
import { UiOption, UiSelect } from '@vplans/ui-kit/select';

const meta: Meta = {
  title: 'Foundations/Density',
  decorators: [
    moduleMetadata({
      imports: [UiButton, UiCheckbox, UiInput, UiSegment, UiSegmented, UiOption, UiSelect],
    }),
  ],
};

export default meta;
type Story = StoryObj;

/** One set of controls; `region` names it for the accessible labels. */
const controls = (region: string): string => `
  <div style="display:grid;gap:12px;max-inline-size:320px">
    <input ui-input aria-label="Plan name (${region})" value="תוכנית בנייה" />
    <ui-select aria-label="Coordinator (${region})" placeholder="Choose a coordinator">
      <ui-option value="dana">Dana Cohen</ui-option>
      <ui-option value="yossi">Yossi Levi</ui-option>
    </ui-select>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <button ui-button size="sm" variant="secondary">Small</button>
      <button ui-button>Medium</button>
      <button ui-button size="lg" variant="secondary">Large</button>
    </div>
    <ui-checkbox [checked]="true">Notify the coordinator</ui-checkbox>
    <ui-segmented value="list" aria-label="View (${region})">
      <ui-segment value="list">רשימה</ui-segment>
      <ui-segment value="board">לוח משימות</ui-segment>
      <ui-segment value="calendar">לוח שנה</ui-segment>
    </ui-segmented>
  </div>`;

const height = (element: Element | null): number => element?.getBoundingClientRect().height ?? 0;

/** The same controls in the default density and in a `data-density="compact"` region. */
export const Controls: Story = {
  render: () => ({
    template: `
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px">
        <section data-testid="default">
          <h3 class="ui-heading-4">Default</h3>
          ${controls('default')}
        </section>
        <section data-density="compact" data-testid="compact">
          <h3 class="ui-heading-4">Compact</h3>
          ${controls('compact')}
        </section>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const region = (name: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-testid="${name}"]`)!;
    const heights = (name: string) =>
      [
        region(name).querySelector('input[ui-input]'),
        ...region(name).querySelectorAll('button[ui-button]'),
      ].map((e) => Math.round(height(e)));
    await until(() => heights('compact')[0] > 0, 'the controls did not render');
    // A nested region recomputes the component tokens that alias control heights.
    const optionHeight = getComputedStyle(region('compact'))
      .getPropertyValue('--ui-select-option-height')
      .trim();
    await expect({
      default: heights('default'),
      compact: heights('compact'),
      optionHeight,
    }).toEqual({
      // input md, button sm/md/lg
      default: [40, 32, 40, 44],
      compact: [32, 28, 32, 40],
      optionHeight: '1.75rem',
    });
  },
};

const openSelect = async (canvasElement: HTMLElement, optionHeight: number): Promise<void> => {
  canvasElement.querySelector<HTMLElement>('.ui-select__control')!.click();
  await until(() => !!document.querySelector('[role="option"]'), 'the list did not open');
  const option = document.querySelector('[role="option"]')!;
  await expect(parseFloat(getComputedStyle(option).minBlockSize)).toBe(optionHeight);
};

const openList: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:320px">
        <ui-select aria-label="Coordinator" placeholder="Choose a coordinator">
          <ui-option value="dana">Dana Cohen</ui-option>
          <ui-option value="yossi">Yossi Levi</ui-option>
          <ui-option value="miri">Miri Ben-David</ui-option>
          <ui-option value="avi" disabled>Avi Mizrahi</ui-option>
        </ui-select>
      </div>`,
  }),
};

/** An open list in the default density. */
export const OpenListDefault: Story = {
  ...openList,
  play: ({ canvasElement }) => openSelect(canvasElement, 32),
};

/**
 * An open list with `data-density="compact"` on the root element, set by the Density global:
 * overlays render outside every region, so only the root density reaches them.
 */
export const OpenListCompact: Story = {
  ...openList,
  globals: { density: 'compact' },
  play: ({ canvasElement }) => openSelect(canvasElement, 28),
};
