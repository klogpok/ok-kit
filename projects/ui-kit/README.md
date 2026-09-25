# @vplans/ui-kit

Our in-house Angular design system. Standalone, `OnPush`, zoneless-ready components built on
`@angular/cdk`, themed with CSS custom properties, RTL-aware and WCAG 2.1 AA compliant.

- **Storybook:** `pnpm storybook` (http://localhost:6006). It has a theme and direction switcher in the toolbar and an a11y panel.
- **Playground app:** `pnpm start`

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [Forms](#forms)
- [Theming](#theming)
- [RTL](#rtl)
- [Overlays](#overlays)
- [Components](#components)
- [Tokens](#tokens)
- [Contributing](#contributing)

## Installation

```bash
pnpm add @vplans/ui-kit @angular/cdk
```

The kit uses the font stack `Assistant, Roboto, "Helvetica Neue", sans-serif`. Assistant covers
Hebrew and Latin. If the app does not load the font already, add it together with the global
stylesheet (tokens, document defaults, typography) to `angular.json`:

```bash
pnpm add @fontsource/assistant
```

```jsonc
"styles": [
  "node_modules/@fontsource/assistant/400.css",
  "node_modules/@fontsource/assistant/500.css",
  "node_modules/@fontsource/assistant/600.css",
  "node_modules/@fontsource/assistant/700.css",
  "node_modules/@vplans/ui-kit/styles/ui-kit.scss",
  "src/styles.scss"
]
```

If you only need the CSS variables and not the document defaults, use `styles/tokens.css`.

Register the icons you use and (optionally) configure the theme:

```ts
import { provideUiIcons, uiIconCheck, uiIconX, uiIconSearch } from '@vplans/ui-kit/icon';
import { provideUiTheme } from '@vplans/ui-kit/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideUiIcons([uiIconCheck, uiIconX, uiIconSearch]),
    provideUiTheme({ defaultMode: 'system', storageKey: 'app-theme' }),
  ],
};
```

## Usage

Every component has its own secondary entry point for tree-shaking. Import from it, not from the root:

```ts
import { UiButton } from '@vplans/ui-kit/button';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiInput } from '@vplans/ui-kit/input';
```

```html
<button ui-button variant="secondary" size="sm" (click)="cancel()">Cancel</button>
<button ui-button [loading]="saving()">Save</button>
<a ui-button routerLink="/orders">Orders</a>
<button ui-icon-button label="Close" (click)="close()"><ui-icon icon="x" /></button>
```

Common inputs:

| Input     | Values                                    | Default                                  |
| --------- | ----------------------------------------- | ---------------------------------------- |
| `size`    | `sm \| md \| lg`                          | `md`                                     |
| `variant` | `primary \| secondary \| ghost \| danger` | `primary` (`ghost` for `ui-icon-button`) |

With `strictTemplates` on, bind `model()` booleans explicitly: `<ui-checkbox [checked]="true">`.
A bare `checked` attribute is a compile error.

## Forms

All form controls work with **Signal Forms**, **Reactive Forms** and **template-driven forms**:

| Control                    | Signal Forms contract             | Other forms            |
| -------------------------- | --------------------------------- | ---------------------- |
| `input[ui-input]`          | native binding                    | `DefaultValueAccessor` |
| `textarea[ui-textarea]`    | native binding                    | `DefaultValueAccessor` |
| `ui-checkbox`, `ui-switch` | `FormCheckboxControl` (`checked`) | `ControlValueAccessor` |
| `ui-radio-group`           | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-select`                | `FormValueControl` (`value`)      | `ControlValueAccessor` |

`ui-form-field` renders the label, hint and errors, and links them for you: `label[for]` (or
`aria-labelledby` for groups), `aria-describedby`, `aria-invalid`, and `aria-required`. Errors show
once the control is **invalid and touched** (a blur, or `markAllAsTouched()` / `submit()`).

```html
<!-- Signal Forms: messages from validators are shown automatically -->
<ui-form-field label="Email" hint="We never share it">
  <input ui-input type="email" [formField]="form.email" />
</ui-form-field>

<!-- Reactive Forms: project <ui-error>, or use string-valued errors / { message } -->
<ui-form-field label="Username">
  <input ui-input formControlName="username" />
  @if (username.hasError('required')) {
  <ui-error>Username is required</ui-error>
  }
</ui-form-field>

<ui-form-field label="Delivery">
  <ui-radio-group [formField]="form.delivery">
    <ui-radio value="pickup">Pickup</ui-radio>
    <ui-radio value="courier">Courier</ui-radio>
  </ui-radio-group>
</ui-form-field>
```

Without a forms directive, use the `invalid` input to show the error state manually.

### Prefix and suffix

Mark content with `uiPrefix` / `uiSuffix` to place it inside the border of a text control:
icons, currency signs, units, or an icon button. The field then draws the border and the
focus, invalid and disabled states. Clicking decorative affix content focuses the input.
Affixes are mirrored in RTL.

```html
<ui-form-field label="Search">
  <ui-icon uiPrefix icon="search" />
  <input ui-input type="search" />
</ui-form-field>

<ui-form-field label="Price">
  <span uiPrefix>₪</span>
  <input ui-input inputmode="decimal" formControlName="price" />
  <span uiSuffix>per month</span>
</ui-form-field>

<ui-form-field label="Password">
  <input ui-input [type]="visible() ? 'text' : 'password'" formControlName="password" />
  <button
    uiSuffix
    ui-icon-button
    size="sm"
    type="button"
    label="Show password"
    (click)="visible.set(!visible())"
  >
    <ui-icon [icon]="visible() ? 'eye-off' : 'eye'" />
  </button>
</ui-form-field>
```

Affixes are meant for `input[ui-input]` and `textarea[ui-textarea]`.

## Theming

Tokens come in three layers. All of them are CSS custom properties generated from
[`tokens/tokens.json`](tokens/tokens.json):

1. **Primitive** (`--ui-ref-*`): the raw palette and scales. Never use these in components or apps.
2. **Semantic** (`--ui-color-primary`, `--ui-space-md`, `--ui-radius-control`, ...): the public API. They differ per theme.
3. **Component** (`--ui-button-primary-bg`, `--ui-input-radius`, ...): per-component overrides. They default to semantic tokens.

Light and dark themes:

- `<html data-theme="dark">` or `data-theme="light"` forces a theme.
- With no attribute, the theme follows `prefers-color-scheme`.
- A `data-theme` attribute on any element themes that subtree.

```ts
const theme = inject(ThemeService);
theme.mode(); // 'light' | 'dark' | 'system'
theme.theme(); // resolved: 'light' | 'dark'
theme.setMode('dark'); // persisted in localStorage
theme.toggle();
```

Override tokens in your global styles:

```scss
:root {
  --ui-button-radius: var(--ui-radius-full); // pill buttons everywhere
}

.checkout {
  --ui-color-primary: var(--ui-color-success); // local re-brand
}
```

Use the mixins in application SCSS:

```scss
@use '@vplans/ui-kit/styles' as ui;

.card-link {
  @include ui.focus-visible;
  @include ui.transition(background-color);
}
```

Typography classes: `ui-display`, `ui-heading-1..4`, `ui-body-lg`, `ui-body`, `ui-body-sm`,
`ui-label`, `ui-caption`, `ui-code`, `ui-text-muted`, `ui-visually-hidden`.

## RTL

Components use only logical properties (`margin-inline-start`, `inset-inline-end`, ...).
Set `dir="rtl"` on `<html>` (or any container) and everything mirrors. Directional icons flip with
`<ui-icon icon="arrow-right" flipRtl />`.

Built-in texts (close buttons, confirm dialogs, empty lists) default to English. Translate them
once for the whole app:

```ts
import { provideUiLabels } from '@vplans/ui-kit/core';

providers: [
  provideUiLabels({
    close: 'סגירה',
    confirm: 'אישור',
    cancel: 'ביטול',
    noOptions: 'אין תוצאות',
    notifications: 'התראות',
  }),
];
```

## Overlays

Select panels, tooltips, dialogs and toasts render in CDK overlays, which use the browser top layer
(Popover API). They read the text direction when they open, so switching `dir` on `<html>` at
runtime is enough.

```ts
// Dialog: focus trap, Escape/backdrop close and focus restore come from CDK Dialog.
const ref = this.dialog.open<string>(RenamePlanDialog, { data: plan, size: 'sm' });
ref.closed.subscribe((name) => ...);

if (await this.dialog.confirm({ title: 'Delete the plan?', tone: 'danger', confirmLabel: 'Delete' })) {
  ...
}

// Toast: announced to screen readers; pauses while hovered or focused.
this.toast.success('The plan was sent to the owner');
this.toast.show({ message: 'Plan deleted', action: 'Undo' }).onAction.subscribe(() => restore());
```

```html
<!-- Dialog content -->
<ui-dialog-header><h2 ui-dialog-title>Rename plan</h2></ui-dialog-header>
<ui-dialog-content>...</ui-dialog-content>
<ui-dialog-actions>
  <button ui-button variant="secondary" uiDialogClose>Cancel</button>
  <button ui-button [uiDialogClose]="name()">Save</button>
</ui-dialog-actions>

<!-- Tooltip: a description, never the only label of an icon button -->
<button ui-icon-button label="Delete" uiTooltip="Delete the plan"><ui-icon icon="trash" /></button>

<!-- Select -->
<ui-form-field label="Coordinator">
  <ui-select [formField]="form.coordinator" placeholder="Choose" searchable>
    @for (c of coordinators; track c.id) {
    <ui-option [value]="c.id">{{ c.name }}</ui-option>
    }
  </ui-select>
</ui-form-field>
```

Change the toast position, duration or stack size with
`provideUiToast({ position: 'top-center', duration: 4000, max: 3 })`.

## Components

| Entry point                 | Exports                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `@vplans/ui-kit/button`     | `UiButton`, `UiIconButton`                                                                                                            |
| `@vplans/ui-kit/input`      | `UiInput`, `UiTextarea`                                                                                                               |
| `@vplans/ui-kit/form-field` | `UiFormField`, `UiHint`, `UiError`                                                                                                    |
| `@vplans/ui-kit/checkbox`   | `UiCheckbox`                                                                                                                          |
| `@vplans/ui-kit/radio`      | `UiRadioGroup`, `UiRadio`                                                                                                             |
| `@vplans/ui-kit/switch`     | `UiSwitch`                                                                                                                            |
| `@vplans/ui-kit/spinner`    | `UiSpinner`                                                                                                                           |
| `@vplans/ui-kit/divider`    | `UiDivider`                                                                                                                           |
| `@vplans/ui-kit/badge`      | `UiBadge`, `UiBadgeTone`                                                                                                              |
| `@vplans/ui-kit/card`       | `UiCard`, `UiCardHeader`, `UiCardTitle`, `UiCardSubtitle`, `UiCardContent`, `UiCardFooter`                                            |
| `@vplans/ui-kit/tabs`       | `UiTabGroup`, `UiTab`, `UiTabLabel`, `UiTabContent`                                                                                   |
| `@vplans/ui-kit/tooltip`    | `UiTooltip`, `UiTooltipPosition`                                                                                                      |
| `@vplans/ui-kit/dialog`     | `UiDialog`, `UiDialogRef`, `UI_DIALOG_DATA`, `UiDialogHeader`, `UiDialogTitle`, `UiDialogContent`, `UiDialogActions`, `UiDialogClose` |
| `@vplans/ui-kit/toast`      | `UiToast`, `UiToastRef`, `provideUiToast`, `UI_TOAST_CONFIG`, toast types                                                             |
| `@vplans/ui-kit/select`     | `UiSelect`, `UiOption`, `UiOptionGroup`                                                                                               |
| `@vplans/ui-kit/icon`       | `UiIcon`, `provideUiIcons`, `uiIcon*` icons                                                                                           |
| `@vplans/ui-kit/theme`      | `ThemeService`, `provideUiTheme`                                                                                                      |
| `@vplans/ui-kit/core`       | shared types, `UiFormControlBase`, form-field contract, `provideUiLabels`, `resolveDirection`                                         |

## Tokens

Generated from `tokens.json` by `pnpm tokens`. Values are shown as light / dark.

<!-- tokens:start -->

| Token                               | Layer     | Light                                                                        | Dark                                                                   |
| ----------------------------------- | --------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `--ui-font-family-sans`             | semantic  | `Assistant, Roboto, "Helvetica Neue", sans-serif`                            | `Assistant, Roboto, "Helvetica Neue", sans-serif`                      |
| `--ui-font-family-mono`             | semantic  | `ui-monospace, 'JetBrains Mono', 'Cascadia Code', Consolas, monospace`       | `ui-monospace, 'JetBrains Mono', 'Cascadia Code', Consolas, monospace` |
| `--ui-font-size-xs`                 | semantic  | `0.75rem`                                                                    | `0.75rem`                                                              |
| `--ui-font-size-sm`                 | semantic  | `0.875rem`                                                                   | `0.875rem`                                                             |
| `--ui-font-size-md`                 | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-font-size-lg`                 | semantic  | `1.125rem`                                                                   | `1.125rem`                                                             |
| `--ui-font-size-xl`                 | semantic  | `1.25rem`                                                                    | `1.25rem`                                                              |
| `--ui-font-size-2xl`                | semantic  | `1.5rem`                                                                     | `1.5rem`                                                               |
| `--ui-font-size-3xl`                | semantic  | `1.875rem`                                                                   | `1.875rem`                                                             |
| `--ui-font-size-4xl`                | semantic  | `2.25rem`                                                                    | `2.25rem`                                                              |
| `--ui-font-weight-regular`          | semantic  | `400`                                                                        | `400`                                                                  |
| `--ui-font-weight-medium`           | semantic  | `500`                                                                        | `500`                                                                  |
| `--ui-font-weight-semibold`         | semantic  | `600`                                                                        | `600`                                                                  |
| `--ui-font-weight-bold`             | semantic  | `700`                                                                        | `700`                                                                  |
| `--ui-line-height-tight`            | semantic  | `1.25`                                                                       | `1.25`                                                                 |
| `--ui-line-height-snug`             | semantic  | `1.375`                                                                      | `1.375`                                                                |
| `--ui-line-height-normal`           | semantic  | `1.5`                                                                        | `1.5`                                                                  |
| `--ui-space-3xs`                    | semantic  | `0.125rem`                                                                   | `0.125rem`                                                             |
| `--ui-space-2xs`                    | semantic  | `0.25rem`                                                                    | `0.25rem`                                                              |
| `--ui-space-xs`                     | semantic  | `0.375rem`                                                                   | `0.375rem`                                                             |
| `--ui-space-sm`                     | semantic  | `0.5rem`                                                                     | `0.5rem`                                                               |
| `--ui-space-md`                     | semantic  | `0.75rem`                                                                    | `0.75rem`                                                              |
| `--ui-space-lg`                     | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-space-xl`                     | semantic  | `1.5rem`                                                                     | `1.5rem`                                                               |
| `--ui-space-2xl`                    | semantic  | `2rem`                                                                       | `2rem`                                                                 |
| `--ui-space-3xl`                    | semantic  | `3rem`                                                                       | `3rem`                                                                 |
| `--ui-radius-sm`                    | semantic  | `0.25rem`                                                                    | `0.25rem`                                                              |
| `--ui-radius-control`               | semantic  | `0.375rem`                                                                   | `0.375rem`                                                             |
| `--ui-radius-container`             | semantic  | `0.5rem`                                                                     | `0.5rem`                                                               |
| `--ui-radius-full`                  | semantic  | `9999px`                                                                     | `9999px`                                                               |
| `--ui-border-width-default`         | semantic  | `1px`                                                                        | `1px`                                                                  |
| `--ui-border-width-strong`          | semantic  | `2px`                                                                        | `2px`                                                                  |
| `--ui-focus-ring-width`             | semantic  | `2px`                                                                        | `2px`                                                                  |
| `--ui-focus-ring-offset`            | semantic  | `2px`                                                                        | `2px`                                                                  |
| `--ui-control-height-sm`            | semantic  | `2rem`                                                                       | `2rem`                                                                 |
| `--ui-control-height-md`            | semantic  | `2.5rem`                                                                     | `2.5rem`                                                               |
| `--ui-control-height-lg`            | semantic  | `2.75rem`                                                                    | `2.75rem`                                                              |
| `--ui-control-padding-inline-sm`    | semantic  | `0.625rem`                                                                   | `0.625rem`                                                             |
| `--ui-control-padding-inline-md`    | semantic  | `0.75rem`                                                                    | `0.75rem`                                                              |
| `--ui-control-padding-inline-lg`    | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-control-font-size-sm`         | semantic  | `0.875rem`                                                                   | `0.875rem`                                                             |
| `--ui-control-font-size-md`         | semantic  | `0.875rem`                                                                   | `0.875rem`                                                             |
| `--ui-control-font-size-lg`         | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-control-gap-sm`               | semantic  | `0.375rem`                                                                   | `0.375rem`                                                             |
| `--ui-control-gap-md`               | semantic  | `0.5rem`                                                                     | `0.5rem`                                                               |
| `--ui-control-gap-lg`               | semantic  | `0.625rem`                                                                   | `0.625rem`                                                             |
| `--ui-icon-size-sm`                 | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-icon-size-md`                 | semantic  | `1.25rem`                                                                    | `1.25rem`                                                              |
| `--ui-icon-size-lg`                 | semantic  | `1.5rem`                                                                     | `1.5rem`                                                               |
| `--ui-z-raised`                     | semantic  | `10`                                                                         | `10`                                                                   |
| `--ui-z-dropdown`                   | semantic  | `1000`                                                                       | `1000`                                                                 |
| `--ui-z-sticky`                     | semantic  | `1100`                                                                       | `1100`                                                                 |
| `--ui-z-overlay`                    | semantic  | `1200`                                                                       | `1200`                                                                 |
| `--ui-z-modal`                      | semantic  | `1300`                                                                       | `1300`                                                                 |
| `--ui-z-toast`                      | semantic  | `1400`                                                                       | `1400`                                                                 |
| `--ui-z-tooltip`                    | semantic  | `1500`                                                                       | `1500`                                                                 |
| `--ui-motion-duration-instant`      | semantic  | `50ms`                                                                       | `50ms`                                                                 |
| `--ui-motion-duration-fast`         | semantic  | `120ms`                                                                      | `120ms`                                                                |
| `--ui-motion-duration-normal`       | semantic  | `200ms`                                                                      | `200ms`                                                                |
| `--ui-motion-duration-slow`         | semantic  | `320ms`                                                                      | `320ms`                                                                |
| `--ui-motion-easing-standard`       | semantic  | `cubic-bezier(0.2, 0, 0, 1)`                                                 | `cubic-bezier(0.2, 0, 0, 1)`                                           |
| `--ui-motion-easing-enter`          | semantic  | `cubic-bezier(0, 0, 0.2, 1)`                                                 | `cubic-bezier(0, 0, 0.2, 1)`                                           |
| `--ui-motion-easing-exit`           | semantic  | `cubic-bezier(0.4, 0, 1, 1)`                                                 | `cubic-bezier(0.4, 0, 1, 1)`                                           |
| `--ui-color-bg`                     | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-surface`                | semantic  | `#ffffff`                                                                    | `#1d2535`                                                              |
| `--ui-color-surface-subtle`         | semantic  | `#f8f9fb`                                                                    | `#1d2535`                                                              |
| `--ui-color-surface-muted`          | semantic  | `#f1f3f6`                                                                    | `#2b3549`                                                              |
| `--ui-color-surface-raised`         | semantic  | `#ffffff`                                                                    | `#2b3549`                                                              |
| `--ui-color-surface-hover`          | semantic  | `#f1f3f6`                                                                    | `#2b3549`                                                              |
| `--ui-color-surface-active`         | semantic  | `#e4e7ed`                                                                    | `#4a5466`                                                              |
| `--ui-color-text`                   | semantic  | `#1d2535`                                                                    | `#f8f9fb`                                                              |
| `--ui-color-text-muted`             | semantic  | `#636d7e`                                                                    | `#a7acaf`                                                              |
| `--ui-color-text-subtle`            | semantic  | `#636d7e`                                                                    | `#a7acaf`                                                              |
| `--ui-color-text-disabled`          | semantic  | `#a7acaf`                                                                    | `#636d7e`                                                              |
| `--ui-color-text-inverse`           | semantic  | `#ffffff`                                                                    | `#1d2535`                                                              |
| `--ui-color-border`                 | semantic  | `#e4e7ed`                                                                    | `#2b3549`                                                              |
| `--ui-color-border-control`         | semantic  | `#848d9d`                                                                    | `#848d9d`                                                              |
| `--ui-color-border-control-hover`   | semantic  | `#4a5466`                                                                    | `#cdd2db`                                                              |
| `--ui-color-control-bg`             | semantic  | `#ffffff`                                                                    | `#1d2535`                                                              |
| `--ui-color-control-bg-disabled`    | semantic  | `#f1f3f6`                                                                    | `#2b3549`                                                              |
| `--ui-color-primary`                | semantic  | `#1a74c9`                                                                    | `#4aa3ef`                                                              |
| `--ui-color-primary-hover`          | semantic  | `#155ea6`                                                                    | `#72b8f2`                                                              |
| `--ui-color-primary-active`         | semantic  | `#004b9e`                                                                    | `#a8d3f6`                                                              |
| `--ui-color-primary-contrast`       | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-primary-subtle`         | semantic  | `#e9f4fc`                                                                    | `#0a2747`                                                              |
| `--ui-color-primary-subtle-hover`   | semantic  | `#d3e9fa`                                                                    | `#0d3d6e`                                                              |
| `--ui-color-primary-text`           | semantic  | `#155ea6`                                                                    | `#72b8f2`                                                              |
| `--ui-color-danger`                 | semantic  | `#dc2626`                                                                    | `#f87171`                                                              |
| `--ui-color-danger-hover`           | semantic  | `#b91c1c`                                                                    | `#fca5a5`                                                              |
| `--ui-color-danger-active`          | semantic  | `#991b1b`                                                                    | `#fecaca`                                                              |
| `--ui-color-danger-contrast`        | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-danger-subtle`          | semantic  | `#fef2f2`                                                                    | `#450a0a`                                                              |
| `--ui-color-danger-text`            | semantic  | `#b91c1c`                                                                    | `#fca5a5`                                                              |
| `--ui-color-success`                | semantic  | `#008752`                                                                    | `#3fae7c`                                                              |
| `--ui-color-success-contrast`       | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-success-subtle`         | semantic  | `#e8f6ef`                                                                    | `#032819`                                                              |
| `--ui-color-success-text`           | semantic  | `#006c42`                                                                    | `#5fbf8f`                                                              |
| `--ui-color-warning`                | semantic  | `#685e1b`                                                                    | `#bfae38`                                                              |
| `--ui-color-warning-contrast`       | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-warning-subtle`         | semantic  | `#faf8e8`                                                                    | `#29230a`                                                              |
| `--ui-color-warning-text`           | semantic  | `#554c1a`                                                                    | `#d4c65a`                                                              |
| `--ui-color-info`                   | semantic  | `#155ea6`                                                                    | `#4aa3ef`                                                              |
| `--ui-color-info-contrast`          | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-info-subtle`            | semantic  | `#e9f4fc`                                                                    | `#0a2747`                                                              |
| `--ui-color-info-text`              | semantic  | `#004b9e`                                                                    | `#72b8f2`                                                              |
| `--ui-color-focus-ring`             | semantic  | `#2490ed`                                                                    | `#4aa3ef`                                                              |
| `--ui-color-backdrop`               | semantic  | `rgb(15 23 42 / 0.5)`                                                        | `rgb(0 0 0 / 0.6)`                                                     |
| `--ui-shadow-sm`                    | semantic  | `0 1px 2px 0 rgb(15 23 42 / 0.06)`                                           | `0 1px 2px 0 rgb(0 0 0 / 0.4)`                                         |
| `--ui-shadow-md`                    | semantic  | `0 4px 8px -2px rgb(15 23 42 / 0.10), 0 2px 4px -2px rgb(15 23 42 / 0.06)`   | `0 4px 8px -2px rgb(0 0 0 / 0.5)`                                      |
| `--ui-shadow-lg`                    | semantic  | `0 12px 24px -6px rgb(15 23 42 / 0.16), 0 4px 8px -4px rgb(15 23 42 / 0.08)` | `0 12px 24px -6px rgb(0 0 0 / 0.6)`                                    |
| `--ui-button-radius`                | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-button-font-weight`           | component | `var(--ui-font-weight-medium)`                                               | `var(--ui-font-weight-medium)`                                         |
| `--ui-button-primary-bg`            | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-button-primary-bg-hover`      | component | `var(--ui-color-primary-hover)`                                              | `var(--ui-color-primary-hover)`                                        |
| `--ui-button-primary-bg-active`     | component | `var(--ui-color-primary-active)`                                             | `var(--ui-color-primary-active)`                                       |
| `--ui-button-primary-text`          | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-button-primary-border`        | component | `transparent`                                                                | `transparent`                                                          |
| `--ui-button-secondary-bg`          | component | `var(--ui-color-surface)`                                                    | `var(--ui-color-surface)`                                              |
| `--ui-button-secondary-bg-hover`    | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-button-secondary-bg-active`   | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-button-secondary-text`        | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-button-secondary-border`      | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-button-ghost-bg`              | component | `transparent`                                                                | `transparent`                                                          |
| `--ui-button-ghost-bg-hover`        | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-button-ghost-bg-active`       | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-button-ghost-text`            | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-button-ghost-border`          | component | `transparent`                                                                | `transparent`                                                          |
| `--ui-button-danger-bg`             | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-button-danger-bg-hover`       | component | `var(--ui-color-danger-hover)`                                               | `var(--ui-color-danger-hover)`                                         |
| `--ui-button-danger-bg-active`      | component | `var(--ui-color-danger-active)`                                              | `var(--ui-color-danger-active)`                                        |
| `--ui-button-danger-text`           | component | `var(--ui-color-danger-contrast)`                                            | `var(--ui-color-danger-contrast)`                                      |
| `--ui-button-danger-border`         | component | `transparent`                                                                | `transparent`                                                          |
| `--ui-input-bg`                     | component | `var(--ui-color-control-bg)`                                                 | `var(--ui-color-control-bg)`                                           |
| `--ui-input-bg-disabled`            | component | `var(--ui-color-control-bg-disabled)`                                        | `var(--ui-color-control-bg-disabled)`                                  |
| `--ui-input-text`                   | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-input-placeholder`            | component | `var(--ui-color-text-subtle)`                                                | `var(--ui-color-text-subtle)`                                          |
| `--ui-input-border`                 | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-input-border-hover`           | component | `var(--ui-color-border-control-hover)`                                       | `var(--ui-color-border-control-hover)`                                 |
| `--ui-input-border-focus`           | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-input-border-invalid`         | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-input-radius`                 | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-form-field-gap`               | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-form-field-label-color`       | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-form-field-label-font-size`   | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-form-field-label-font-weight` | component | `var(--ui-font-weight-medium)`                                               | `var(--ui-font-weight-medium)`                                         |
| `--ui-form-field-hint-color`        | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-form-field-error-color`       | component | `var(--ui-color-danger-text)`                                                | `var(--ui-color-danger-text)`                                          |
| `--ui-form-field-message-font-size` | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-form-field-affix-color`       | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-checkbox-size`                | component | `var(--ui-icon-size-sm)`                                                     | `var(--ui-icon-size-sm)`                                               |
| `--ui-checkbox-radius`              | component | `var(--ui-radius-sm)`                                                        | `var(--ui-radius-sm)`                                                  |
| `--ui-checkbox-bg`                  | component | `var(--ui-color-control-bg)`                                                 | `var(--ui-color-control-bg)`                                           |
| `--ui-checkbox-border`              | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-checkbox-checked-bg`          | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-checkbox-checked-color`       | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-checkbox-invalid-border`      | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-radio-size`                   | component | `var(--ui-icon-size-sm)`                                                     | `var(--ui-icon-size-sm)`                                               |
| `--ui-radio-bg`                     | component | `var(--ui-color-control-bg)`                                                 | `var(--ui-color-control-bg)`                                           |
| `--ui-radio-border`                 | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-radio-checked-color`          | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-radio-invalid-border`         | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-switch-track-width`           | component | `var(--ui-control-height-md)`                                                | `var(--ui-control-height-md)`                                          |
| `--ui-switch-track-height`          | component | `var(--ui-icon-size-md)`                                                     | `var(--ui-icon-size-md)`                                               |
| `--ui-switch-track-bg`              | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-switch-track-checked-bg`      | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-switch-thumb-bg`              | component | `var(--ui-color-control-bg)`                                                 | `var(--ui-color-control-bg)`                                           |
| `--ui-switch-invalid-outline`       | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-spinner-track-color`          | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-spinner-stroke-width`         | component | `var(--ui-border-width-strong)`                                              | `var(--ui-border-width-strong)`                                        |
| `--ui-divider-color`                | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-divider-thickness`            | component | `var(--ui-border-width-default)`                                             | `var(--ui-border-width-default)`                                       |
| `--ui-divider-label-color`          | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-divider-label-font-size`      | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-divider-label-gap`            | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-badge-radius`                 | component | `var(--ui-radius-full)`                                                      | `var(--ui-radius-full)`                                                |
| `--ui-badge-font-size`              | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-badge-font-weight`            | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-badge-neutral-soft-bg`        | component | `var(--ui-color-surface-muted)`                                              | `var(--ui-color-surface-muted)`                                        |
| `--ui-badge-neutral-soft-text`      | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-badge-neutral-solid-bg`       | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-badge-neutral-solid-text`     | component | `var(--ui-color-text-inverse)`                                               | `var(--ui-color-text-inverse)`                                         |
| `--ui-badge-primary-soft-bg`        | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-badge-primary-soft-text`      | component | `var(--ui-color-primary-text)`                                               | `var(--ui-color-primary-text)`                                         |
| `--ui-badge-primary-solid-bg`       | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-badge-primary-solid-text`     | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-badge-success-soft-bg`        | component | `var(--ui-color-success-subtle)`                                             | `var(--ui-color-success-subtle)`                                       |
| `--ui-badge-success-soft-text`      | component | `var(--ui-color-success-text)`                                               | `var(--ui-color-success-text)`                                         |
| `--ui-badge-success-solid-bg`       | component | `var(--ui-color-success)`                                                    | `var(--ui-color-success)`                                              |
| `--ui-badge-success-solid-text`     | component | `var(--ui-color-success-contrast)`                                           | `var(--ui-color-success-contrast)`                                     |
| `--ui-badge-warning-soft-bg`        | component | `var(--ui-color-warning-subtle)`                                             | `var(--ui-color-warning-subtle)`                                       |
| `--ui-badge-warning-soft-text`      | component | `var(--ui-color-warning-text)`                                               | `var(--ui-color-warning-text)`                                         |
| `--ui-badge-warning-solid-bg`       | component | `var(--ui-color-warning)`                                                    | `var(--ui-color-warning)`                                              |
| `--ui-badge-warning-solid-text`     | component | `var(--ui-color-warning-contrast)`                                           | `var(--ui-color-warning-contrast)`                                     |
| `--ui-badge-danger-soft-bg`         | component | `var(--ui-color-danger-subtle)`                                              | `var(--ui-color-danger-subtle)`                                        |
| `--ui-badge-danger-soft-text`       | component | `var(--ui-color-danger-text)`                                                | `var(--ui-color-danger-text)`                                          |
| `--ui-badge-danger-solid-bg`        | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-badge-danger-solid-text`      | component | `var(--ui-color-danger-contrast)`                                            | `var(--ui-color-danger-contrast)`                                      |
| `--ui-card-bg`                      | component | `var(--ui-color-surface)`                                                    | `var(--ui-color-surface)`                                              |
| `--ui-card-border`                  | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-card-radius`                  | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-card-shadow`                  | component | `var(--ui-shadow-md)`                                                        | `var(--ui-shadow-md)`                                                  |
| `--ui-card-padding-sm`              | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-card-padding-md`              | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-card-padding-lg`              | component | `var(--ui-space-xl)`                                                         | `var(--ui-space-xl)`                                                   |
| `--ui-card-gap`                     | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-card-title-font-size`         | component | `var(--ui-font-size-lg)`                                                     | `var(--ui-font-size-lg)`                                               |
| `--ui-card-title-font-weight`       | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-card-subtitle-color`          | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-tabs-border`                  | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-tabs-text`                    | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-tabs-text-hover`              | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-tabs-text-selected`           | component | `var(--ui-color-primary-text)`                                               | `var(--ui-color-primary-text)`                                         |
| `--ui-tabs-indicator`               | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-tabs-indicator-thickness`     | component | `var(--ui-border-width-strong)`                                              | `var(--ui-border-width-strong)`                                        |
| `--ui-tabs-height`                  | component | `var(--ui-control-height-lg)`                                                | `var(--ui-control-height-lg)`                                          |
| `--ui-tabs-padding-inline`          | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-tabs-gap`                     | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-tabs-font-size`               | component | `var(--ui-font-size-md)`                                                     | `var(--ui-font-size-md)`                                               |
| `--ui-tabs-font-weight`             | component | `var(--ui-font-weight-medium)`                                               | `var(--ui-font-weight-medium)`                                         |
| `--ui-tabs-panel-padding`           | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-tooltip-bg`                   | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-tooltip-text`                 | component | `var(--ui-color-text-inverse)`                                               | `var(--ui-color-text-inverse)`                                         |
| `--ui-tooltip-radius`               | component | `var(--ui-radius-sm)`                                                        | `var(--ui-radius-sm)`                                                  |
| `--ui-tooltip-font-size`            | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-tooltip-max-width`            | component | `20em`                                                                       | `20em`                                                                 |
| `--ui-tooltip-offset`               | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-dialog-bg`                    | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-dialog-radius`                | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-dialog-shadow`                | component | `var(--ui-shadow-lg)`                                                        | `var(--ui-shadow-lg)`                                                  |
| `--ui-dialog-backdrop`              | component | `var(--ui-color-backdrop)`                                                   | `var(--ui-color-backdrop)`                                             |
| `--ui-dialog-padding`               | component | `var(--ui-space-xl)`                                                         | `var(--ui-space-xl)`                                                   |
| `--ui-dialog-gap`                   | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-dialog-width-sm`              | component | `25rem`                                                                      | `25rem`                                                                |
| `--ui-dialog-width-md`              | component | `35rem`                                                                      | `35rem`                                                                |
| `--ui-dialog-width-lg`              | component | `50rem`                                                                      | `50rem`                                                                |
| `--ui-dialog-title-font-size`       | component | `var(--ui-font-size-xl)`                                                     | `var(--ui-font-size-xl)`                                               |
| `--ui-dialog-title-font-weight`     | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-toast-bg`                     | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-toast-text`                   | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-toast-border`                 | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-toast-radius`                 | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-toast-shadow`                 | component | `var(--ui-shadow-lg)`                                                        | `var(--ui-shadow-lg)`                                                  |
| `--ui-toast-width`                  | component | `24rem`                                                                      | `24rem`                                                                |
| `--ui-toast-gap`                    | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-toast-offset`                 | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-toast-accent-width`           | component | `var(--ui-border-width-strong)`                                              | `var(--ui-border-width-strong)`                                        |
| `--ui-toast-info-accent`            | component | `var(--ui-color-info)`                                                       | `var(--ui-color-info)`                                                 |
| `--ui-toast-success-accent`         | component | `var(--ui-color-success)`                                                    | `var(--ui-color-success)`                                              |
| `--ui-toast-warning-accent`         | component | `var(--ui-color-warning)`                                                    | `var(--ui-color-warning)`                                              |
| `--ui-toast-danger-accent`          | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-select-panel-bg`              | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-select-panel-border`          | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-select-panel-radius`          | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-select-panel-shadow`          | component | `var(--ui-shadow-md)`                                                        | `var(--ui-shadow-md)`                                                  |
| `--ui-select-panel-max-height`      | component | `18rem`                                                                      | `18rem`                                                                |
| `--ui-select-option-height`         | component | `var(--ui-control-height-sm)`                                                | `var(--ui-control-height-sm)`                                          |
| `--ui-select-option-hover-bg`       | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-select-option-active-bg`      | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-select-option-selected-text`  | component | `var(--ui-color-primary-text)`                                               | `var(--ui-color-primary-text)`                                         |

<!-- tokens:end -->

## Contributing

### Scripts

| Command          | What it does                                                   |
| ---------------- | -------------------------------------------------------------- |
| `pnpm tokens`    | Regenerates CSS/SCSS/TS/README tokens and checks WCAG contrast |
| `pnpm test`      | Unit tests (Vitest)                                            |
| `pnpm lint`      | ESLint (TS + templates + a11y) and Stylelint (token rules)     |
| `pnpm build`     | Tokens and the library build into `dist/ui-kit`                |
| `pnpm storybook` | Storybook dev server                                           |
| `pnpm format`    | Prettier                                                       |

### Adding a component

1. Create a folder `projects/ui-kit/<name>/` containing `ng-package.json` (`{ "lib": { "entryFile": "public-api.ts" } }`) and `public-api.ts`.
2. Name files `<name>.ts`, `<name>.scss` and `<name>.spec.ts`, plus `<name>.stories.ts` for Storybook.
3. Name classes `Ui<Name>`. Use the selector `ui-<name>` for elements; use `button[ui-<name>]` when you extend a native element.
4. Follow the component rules:
   - Standalone, `ChangeDetectionStrategy.OnPush`.
   - Only `input()`, `model()`, `output()`, `computed()`, `viewChild()`/`contentChild()`.
   - `host: {}` metadata. No `@HostBinding`/`@HostListener`, no NgModules.
   - Prefer native elements and CDK primitives (`FocusTrap`, `LiveAnnouncer`, `ActiveDescendantKeyManager`, overlay, listbox) over custom focus or keyboard code.
5. Styles use **only semantic or component tokens**, applied with logical properties:
   - No hex or `rgb()`, and no `px`/`rem`. Use `em` only when relative to text.
   - No `!important`, no `::ng-deep`.
   - Private per-component variables use the `--_name` form.
   - Stylelint enforces these rules.
   - New component tokens go into `tokens.json` → `component.<name>`, and reference semantic tokens.
6. For a form control, extend `UiFormControlBase` (from `@vplans/ui-kit/core`) and provide `UI_FORM_FIELD_CONTROL`. For a native element, use `injectControlState()`.
7. Required tests:
   - rendering and inputs;
   - outputs and model updates;
   - keyboard interaction;
   - ARIA attributes;
   - for form controls, Reactive Forms and Signal Forms (value both ways, disabled, touched, error linking).
8. Required stories: one per variant and state (default, sizes, disabled, invalid, loading, ...). Check the a11y panel in both themes and in RTL.
9. Keep commits small, one per component: `feat(<name>): ...`.

Anything not exported from an entry point's `public-api.ts` is internal and may change without notice.
