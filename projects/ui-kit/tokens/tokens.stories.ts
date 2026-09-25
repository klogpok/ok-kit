import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UI_TOKENS } from './tokens.generated';

const semanticColors = UI_TOKENS.filter(
  (t) => t.layer === 'semantic' && t.name.startsWith('--ui-color-'),
);
const component = UI_TOKENS.filter((t) => t.layer === 'component');
const scale = UI_TOKENS.filter(
  (t) =>
    t.layer === 'semantic' && /^--ui-(space|radius|font-size|control-height|shadow)-/.test(t.name),
);

const meta: Meta = {
  title: 'Foundations/Tokens',
  parameters: { a11y: { test: 'todo' } },
};

export default meta;
type Story = StoryObj;

export const SemanticColors: Story = {
  render: () => ({
    props: { tokens: semanticColors },
    template: `
      <p class="ui-body-sm ui-text-muted">Switch the theme in the toolbar: swatches use live CSS variables.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">
        @for (t of tokens; track t.name) {
          <div style="display:flex;gap:12px;align-items:center">
            <span [style.background]="'var(' + t.name + ')'"
              style="inline-size:40px;block-size:40px;flex:none;border-radius:var(--ui-radius-control);border:1px solid var(--ui-color-border)"></span>
            <span style="display:grid;min-inline-size:0">
              <code dir="ltr" class="ui-code">{{ t.name }}</code>
              <span class="ui-caption" dir="ltr">{{ t.light }} / {{ t.dark }}</span>
            </span>
          </div>
        }
      </div>`,
  }),
};

export const Scale: Story = {
  render: () => ({
    props: { tokens: scale },
    template: `
      <table class="ui-body-sm" style="border-collapse:collapse">
        @for (t of tokens; track t.name) {
          <tr style="border-block-end:1px solid var(--ui-color-border)">
            <td style="padding:8px"><code dir="ltr" class="ui-code">{{ t.name }}</code></td>
            <td style="padding:8px" class="ui-text-muted" dir="ltr">{{ t.light }}</td>
            <td style="padding:8px">
              @if (t.name.includes('shadow')) {
                <div [style.box-shadow]="'var(' + t.name + ')'" style="inline-size:64px;block-size:32px;background:var(--ui-color-surface-raised);border-radius:var(--ui-radius-control)"></div>
              } @else if (t.name.includes('radius')) {
                <div [style.border-radius]="'var(' + t.name + ')'" style="inline-size:48px;block-size:32px;background:var(--ui-color-primary)"></div>
              } @else if (t.name.includes('font-size')) {
                <span [style.font-size]="'var(' + t.name + ')'">Aa</span>
              } @else {
                <div [style.inline-size]="'var(' + t.name + ')'" style="block-size:12px;background:var(--ui-color-primary);border-radius:2px"></div>
              }
            </td>
          </tr>
        }
      </table>`,
  }),
};

export const ComponentTokens: Story = {
  render: () => ({
    props: { tokens: component },
    template: `
      <table class="ui-body-sm" style="border-collapse:collapse">
        <tr><th style="text-align:start;padding:8px">Token</th><th style="text-align:start;padding:8px">Default</th></tr>
        @for (t of tokens; track t.name) {
          <tr style="border-block-end:1px solid var(--ui-color-border)">
            <td style="padding:8px"><code dir="ltr" class="ui-code">{{ t.name }}</code></td>
            <td style="padding:8px"><code dir="ltr" class="ui-code ui-text-muted">{{ t.light }}</code></td>
          </tr>
        }
      </table>`,
  }),
};

export const Typography: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:16px">
        <div class="ui-display">Display — Order summary</div>
        <h1 class="ui-heading-1">Heading 1 — Order summary</h1>
        <h2 class="ui-heading-2">Heading 2 — Order summary</h2>
        <h3 class="ui-heading-3">Heading 3 — Order summary</h3>
        <h4 class="ui-heading-4">Heading 4 — Order summary</h4>
        <p class="ui-body-lg" lang="en" dir="ltr">Body large. The quick brown fox jumps over the lazy dog.</p>
        <p class="ui-body" lang="en" dir="ltr">Body. The quick brown fox jumps over the lazy dog.</p>
        <p class="ui-body-sm" lang="en" dir="ltr">Body small. The quick brown fox jumps over the lazy dog.</p>
        <span class="ui-label">Label</span>
        <span class="ui-caption">Caption — updated 5 minutes ago</span>
        <p class="ui-body" dir="rtl" lang="he">עברית: השועל החום המהיר קופץ מעל הכלב העצלן.</p>
      </div>`,
  }),
};
