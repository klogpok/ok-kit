# @vplans/ui-kit

Our in-house Angular design system. Standalone, `OnPush`, zoneless-ready components built on
`@angular/cdk`, themed with CSS custom properties, RTL-aware and built for WCAG 2.1 AA: every story
is checked with axe in light, dark and RTL (`pnpm test-storybook`).

- **Storybook:** `pnpm storybook` (http://localhost:6006). It has a theme and direction switcher in the toolbar and an a11y panel.
- **Playground app:** `pnpm start`

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [Forms](#forms)
- [Theming](#theming)
- [RTL](#rtl)
- [Overlays](#overlays)
- [Feedback](#feedback)
- [Data display](#data-display)
- [Navigation](#navigation)
- [Testing](#testing)
- [Components](#components)
- [Tokens](#tokens)
- [Contributing](#contributing)

## Installation

The kit is not published. Apps in this monorepo use it from source:

- **TypeScript**: the root `tsconfig.json` maps the package to the sources, so
  `import { UiButton } from '@vplans/ui-kit/button'` works in every project:

  ```jsonc
  "paths": {
    "@vplans/ui-kit": ["./projects/ui-kit/src/public-api.ts"],
    "@vplans/ui-kit/*": ["./projects/ui-kit/*/public-api.ts"]
  }
  ```

- **Dependencies**: the app needs the peer dependencies of `projects/ui-kit/package.json`
  (`@angular/cdk`, `@angular/forms`, …) in the same major version. `@angular/router` is optional:
  only `ui-tab-nav` (`@vplans/ui-kit/tabs`) needs it.

The kit uses the font stack `Assistant, Roboto, "Helvetica Neue", sans-serif`. Assistant covers
Hebrew and Latin. If the app does not load the font already, add it together with the global
stylesheet (tokens, document defaults, typography) to the app's build options in
`angular.json`. `includePaths` lets app SCSS use the mixins with `@use 'ui-kit/styles' as ui`:

```bash
pnpm add @fontsource/assistant
```

```jsonc
"styles": [
  "node_modules/@fontsource/assistant/400.css",
  "node_modules/@fontsource/assistant/500.css",
  "node_modules/@fontsource/assistant/600.css",
  "node_modules/@fontsource/assistant/700.css",
  "projects/ui-kit/styles/ui-kit.scss",
  "src/styles.scss"
],
"stylePreprocessorOptions": { "includePaths": ["projects"] }
```

If you only need the CSS variables and not the document defaults, use
`projects/ui-kit/styles/tokens.css`.

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

| Input                 | Values                                    | Default                                  |
| --------------------- | ----------------------------------------- | ---------------------------------------- |
| `size`                | `sm \| md \| lg`                          | `md`                                     |
| `variant`             | `primary \| secondary \| ghost \| danger` | `primary` (`ghost` for `ui-icon-button`) |
| `type`                | `button \| submit \| reset`               | `button` (ignored on `<a>`)              |
| `disabled`            | `boolean`                                 | `false`                                  |
| `disabledInteractive` | `boolean`                                 | `false`                                  |
| `loading`             | `boolean`                                 | `false`                                  |
| `fullWidth`           | `boolean` (`ui-button` only)              | `false`                                  |
| `label`               | `string`, required on `ui-icon-button`    | —                                        |

`loading` shows a spinner, blocks clicks, keeps the button focusable and announces the `loading`
label. A disabled or loading `a[ui-button]` has no `href`, so it cannot be opened in a new tab.

`disabledInteractive` keeps a `disabled` button focusable and hoverable (`aria-disabled` instead of the
native `disabled`); clicks stay blocked. Use it when a `uiTooltip` explains why the button is disabled,
instead of wrapping the button in an element with `uiTooltip`.

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
| `ui-multi-select`          | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-datepicker`            | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-date-range-picker`     | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-time-input`            | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-number-input`          | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-chip-input`            | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-autocomplete`          | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-file-upload`           | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-slider`                | `FormValueControl` (`value`)      | `ControlValueAccessor` |
| `ui-range-slider`          | `FormValueControl` (`value`)      | `ControlValueAccessor` |

Every control supports `disabled`, `readonly` (also from a Signal Forms `readonly()` rule),
`required` and `aria-describedby`. A readonly control stays focusable and reports
`aria-readonly`. A `required` checkbox or switch is invalid until checked, also in Reactive and
template forms.

The model outputs (`valueChange`, `checkedChange`) also fire when a forms directive writes a value
(`setValue()`, `reset()`, a Signal Forms model change), not only for user input. With a forms
directive bound, react to the form (`valueChanges`, the field signal) instead of these outputs.

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

`ui-select`, `ui-multi-select` and `ui-radio-group` take `compareWith` for object values, e.g.
`(option: City, selected: City) => option.id === selected.id`. It is called as
`compareWith(option, selected)` and never with `null`; a `null` value matches only `null`.

`ui-datepicker` reports typed text that is not an allowed date as a `uiDateParse` error with the
`invalidDate` label as its message; the value is `null` meanwhile.

`ui-number-input` reads and shows numbers in the format of the `locale` label ("1,234.5" in
he-IL). The value is a `number` or `null`. Text that is not a number sets `null` and reports a
`uiNumberParse` error with the `invalidNumber` label. Leaving the field formats the text, rounds
to `maxFractionDigits` and clamps to `min`/`max`. With Signal Forms, set the limits with the
`min()` and `max()` rules: `[formField]` does not allow `min`/`max` attributes on the same element. ArrowUp/Down step by `step`, PageUp/Down by ten steps, Home/End go to the limits; the
− and + buttons repeat while held.

```html
<ui-form-field label="Area">
  <!-- form(model, (p) => { min(p.area, 0); }) -->
  <ui-number-input [formField]="form.area" maxFractionDigits="2" />
  <span uiSuffix>m²</span>
</ui-form-field>
<ui-form-field label="Price">
  <span uiPrefix>₪</span>
  <ui-number-input formControlName="price" min="0" minFractionDigits="2" [steppers]="false" />
</ui-form-field>
```

`ui-chip-input` turns typed text into chips; the value is a `string[]`. Enter or a separator
(`separators`, default `[',']`) adds a chip, pasted text is split, leaving the field adds the
typed text (`addOnBlur`), Backspace in the empty field removes the last chip, and the same text
is not added twice unless `allowDuplicates`. With Signal Forms, add `minLength(path, 1)` for a
required field.

```html
<ui-form-field label="Tags" hint="Press Enter after each tag">
  <ui-chip-input [formField]="form.tags" placeholder="Add a tag" />
</ui-form-field>
```

`ui-file-upload` picks files with a drop area (a button) and lists them with a remove button.
The value is a `File[]`. `accept`, `maxSize` (bytes) and `maxFiles` do not drop files: a file
that breaks them stays in the list, marked, and the control reports `uiFileType`,
`uiFileSize` or `uiFileCount` with a message, so the form stays invalid until the user removes
it. The kit does not upload: pass the progress per file (0–100) in `progress`.

```html
<ui-form-field label="Plans" hint="PDF, up to 10 MB">
  <ui-file-upload
    [formField]="form.plans"
    accept=".pdf"
    multiple
    [maxSize]="10 * 1024 * 1024"
    [progress]="uploads()"
  />
</ui-form-field>
```

`variant="button"` shows a compact button instead of the drop area.

`ui-slider` picks a number on a scale (`min`, `max`, `step`); the value is a `number` or
`null`, and `null` shows the thumb at `min`. `ui-range-slider` picks a `[start, end]` tuple with
two thumbs that do not pass each other; `null` shows the whole scale. Click the track to move the
nearest thumb there. The arrow keys move by `step` (in RTL ArrowLeft increases, as the track runs
from right to left), PageUp/PageDown by ten steps, Home/End to the limits. `marks` draws a tick
at every step, or pass `{ value, label }` marks to label the scale. `valueText` sets what screen
readers read (`aria-valuetext`); by default it is the mark label or the number in the locale
format. `valueChange` fires while dragging; `valueCommit` fires when the user lets go, which suits
server requests.

With Signal Forms, set the limits of `ui-slider` with `min()` and `max()` rules, and those of
`ui-range-slider` with `limits`: `[formField]` does not allow `min`/`max` attributes, and the
rules do not apply to a tuple. The thumbs of a range are named by the field label and the
`rangeStart` / `rangeEnd` labels (or `startLabel` / `endLabel`).

```html
<ui-form-field label="Rooms">
  <!-- form(model, (p) => { min(p.rooms, 1); max(p.rooms, 6); }) -->
  <ui-slider [formField]="filters.rooms" marks />
</ui-form-field>
<ui-form-field label="Rent per month">
  <ui-range-slider
    [formField]="filters.price"
    [limits]="[0, 15000]"
    step="500"
    [valueText]="(v) => v + ' ₪'"
    (valueCommit)="search($event)"
  />
</ui-form-field>
```

The calendar title switches to a grid of months and then of years for long jumps. The datepicker
dialog has **Today** and **Clear** buttons (the `today` and `clear` labels).

`ui-date-range-picker` picks a range of days: the value is `{ start, end }` (local dates at
midnight) or `null` when both are empty. It has a start and an end field that parse typed dates
like `ui-datepicker`, and a calendar dialog with two months side by side (one on screens narrower
than 52rem). In the calendar the first pick sets the start and the second the end, which closes
the dialog; until then the day under the pointer or the focused day previews the range. A day
before the start starts a new range. `presets` add quick picks; a preset `range` may be a
function, for ranges relative to today.

Text that is not an allowed date reports `uiDateParse`; an end before the start reports
`uiDateRangeOrder` (`invalidDateRange` label) and leaves the field typed last empty. A range with
one open end is a valid value (e.g. "from September 1"); add a validator when both ends are
needed. With Signal Forms set the limits with `minDate` / `maxDate`: `[formField]` does not
allow `min`/`max`, and the date rules do not apply to a range. The group is named by the field
label, and the fields by the `startDate` / `endDate` labels.

```html
<ui-form-field label="Report period">
  <ui-date-range-picker [formField]="form.period" [maxDate]="today" [presets]="presets" />
</ui-form-field>
```

```ts
presets: UiDateRangePreset[] = [
  {
    label: 'Last 7 days',
    range: () => {
      const end = new Date();
      return { start: new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6), end };
    },
  },
  { label: 'Q3', range: { start: new Date(2026, 6, 1), end: new Date(2026, 8, 30) } },
];
```

`ui-calendar` picks a range by itself with `range` and `[(selectedRange)]`; `months` shows
several months side by side.

`ui-time-input` (`@vplans/ui-kit/time`) is a text field with a list of times every `interval`
minutes (default 30). The value is a 24-hour `"HH:mm"` string or `null`; it is shown in the
format of the `locale` label: "14:30" in `he-IL`, "2:30 PM" in `en-US`. Typing keeps only the
characters of a time and adds the ":" ("1430" → "14:30"); "930", "9" and "2:30 pm" are read too.
Text that is not a time, or a time outside `minTime`/`maxTime`, sets `null` and reports
`uiTimeParse` (`invalidTime` label). A click or ArrowDown opens the list at the selected time
or the next one; Enter picks, Escape closes. With Signal Forms set the limits with
`minTime`/`maxTime`: `[formField]` does not allow `min`/`max`, and the `min()`/`max()` rules take
only numbers.

To pick a date and a time, put `ui-datepicker` and `ui-time-input` side by side and join their
values with `uiDateWithTime(date, time)`; `uiTimeOf(date)` gives the `"HH:mm"` of a `Date`.

```html
<ui-form-field label="Date"><ui-datepicker [formField]="form.date" /></ui-form-field>
<ui-form-field label="Time">
  <ui-time-input [formField]="form.time" minTime="08:00" maxTime="18:00" interval="15" />
</ui-form-field>
```

```ts
readonly meeting = computed(() => uiDateWithTime(this.model().date, this.model().time));
```

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

Affixes are meant for `input[ui-input]`, `textarea[ui-textarea]` and `ui-number-input`.

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

`provideUiTheme()` applies the stored mode when the app starts. Without it, the mode is applied only
once something injects `ThemeService`.

The app boots after the first paint, so a stored `dark` mode would flash light first. Apply it early
with an inline script in `index.html` (use your `storageKey`):

```html
<script>
  try {
    var mode = localStorage.getItem('ui-theme');
    if (mode === 'light' || mode === 'dark') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  } catch (e) {}
</script>
```

Override tokens in your global styles. Component tokens (`--ui-button-*`, …) are computed on
`:root`, on every `[data-theme]` element and on `.ui-theme-scope`, so they follow the theme of
the nearest scope:

- **Component tokens**: override them on all of these selectors (`ui.$theme-scopes`). An
  override on `:root` alone is reset inside a nested `[data-theme]`.
- **Semantic tokens**: an override on `:root` or `[data-theme]` applies everywhere. For a local
  re-brand, override them on an element with the `ui-theme-scope` class, so the component tokens
  are recomputed there.

```scss
@use 'ui-kit/styles' as ui;

#{ui.$theme-scopes} {
  --ui-button-radius: var(--ui-radius-full); // pill buttons everywhere
}

// Local re-brand: override the whole primary family, or hover and text colors stay blue.
.checkout.ui-theme-scope {
  --ui-color-primary: var(--ui-ref-color-green-700);
  --ui-color-primary-hover: var(--ui-ref-color-green-800);
  --ui-color-primary-active: var(--ui-ref-color-green-900);
  --ui-color-primary-subtle: var(--ui-ref-color-green-50);
  --ui-color-primary-text: var(--ui-ref-color-green-800);
}
```

In the dark theme the primary family uses lighter shades; override it there too
(`[data-theme='dark'] .checkout.ui-theme-scope { ... }`). Run the new pairs through a contrast
checker: `pnpm tokens` only checks the built-in tokens.

Use the mixins in application SCSS:

```scss
@use 'ui-kit/styles' as ui;

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

### Built-in texts and i18n

Built-in texts (close buttons, confirm dialogs, empty lists, the spinner name) default to Hebrew
(`UI_LABELS_HE`). Keys you do not set keep the Hebrew default. `provideUiLabels()` accepts fixed
values, a signal, or a factory, so it works with any i18n library:

```ts
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';

// English app
provideUiLabels(UI_LABELS_EN);

// @angular/localize (build-time translation)
provideUiLabels({ close: $localize`:@@ui.close:Close`, cancel: $localize`:@@ui.cancel:Cancel` });

// Transloco or ngx-translate (runtime switch): the factory runs in an injection context,
// and the kit follows the signal when the language changes.
provideUiLabels(() =>
  toSignal(inject(TranslocoService).selectTranslateObject('uiKit'), { initialValue: {} }),
);
```

Texts with numbers are functions, e.g. `pageLabel: (page) => ...` and
`pageRange: (start, end, length) => ...` for `ui-pagination`. When the source only gives strings,
build them in the factory.

Texts that belong to a specific use (a button label, a tooltip, a dialog title) are plain inputs:
translate them in your templates as usual.

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

```ts
// Drawer: a full-height modal panel with the same parts and behavior as a dialog.
// `end` (default) is the right side in LTR and the left side in RTL; full width on phones.
this.dialog.openDrawer<boolean>(FiltersDrawer, { position: 'end', size: 'md' });
```

```html
<!-- Dialog content -->
<ui-dialog-header><h2 ui-dialog-title>Rename plan</h2></ui-dialog-header>
<ui-dialog-content>...</ui-dialog-content>
<ui-dialog-actions>
  <button ui-button variant="secondary" uiDialogClose>Cancel</button>
  <button ui-button [uiDialogClose]="name()">Save</button>
</ui-dialog-actions>

<!-- Tooltip: a description, never the only label of an icon button. Hides the native title while active -->
<button ui-icon-button label="Delete" uiTooltip="Delete the plan"><ui-icon icon="trash" /></button>
<button ui-button disabled disabledInteractive uiTooltip="Fill in all required fields">Send</button>

<!-- Select -->
<ui-form-field label="Coordinator">
  <ui-select [formField]="form.coordinator" placeholder="Choose" searchable>
    @for (c of coordinators; track c.id) {
    <ui-option [value]="c.id">{{ c.name }}</ui-option>
    }
  </ui-select>
</ui-form-field>

<!-- Multi-select: the value is an array; the list stays open while toggling -->
<ui-form-field label="Recipients">
  <ui-multi-select [formField]="form.recipients" placeholder="Choose">
    @for (c of coordinators; track c.id) {
    <ui-option [value]="c.id">{{ c.name }}</ui-option>
    }
  </ui-multi-select>
</ui-form-field>
```

```html
<!-- Popover: non-modal, named by the trigger; Escape, a click outside or close() closes it -->
<button ui-button variant="secondary" [uiPopoverTriggerFor]="filters">Filters</button>
<ng-template #filters let-close="close">
  <ui-checkbox [(checked)]="onlyMine">Only my plans</ui-checkbox>
  <button ui-button size="sm" (click)="apply(); close()">Apply</button>
</ng-template>
```

The popover focuses `[cdkFocusInitial]` or its first focusable element and closes when focus
leaves it. Use `uiPopoverLabel` when the trigger text does not describe the content.

```html
<!-- Menu: link items, a labelled group of radio items, a checkbox item, a position preset -->
<button ui-button [uiMenuTriggerFor]="view" uiMenuPosition="bottom-end">View</button>
<ng-template #view>
  <ui-menu>
    <ui-menu-group label="Sort by">
      <button ui-menu-item-radio [checked]="sort() === 'name'" (triggered)="sort.set('name')">
        Name
      </button>
    </ui-menu-group>
    <button ui-menu-item-checkbox [checked]="archived()" (triggered)="archived.set(!archived())">
      Show archived
    </button>
    <a ui-menu-item routerLink="history">History</a>
  </ui-menu>
</ng-template>
```

Space toggles checkbox and radio items and keeps the menu open. A link item closes the menu
after the click has followed the link.

```html
<!-- Autocomplete: free text with suggestions; the value is the text -->
<ui-form-field label="City">
  <ui-autocomplete [formField]="form.city">
    @for (city of cities; track city) {
    <ui-option [value]="city">{{ city }}</ui-option>
    }
  </ui-autocomplete>
</ui-form-field>

<!-- Pick one: with displayWith the value is the picked object; typing only searches -->
<ui-autocomplete
  [(value)]="owner"
  [displayWith]="nameOf"
  [filterOptions]="false"
  [loading]="searching()"
  (searchChange)="search($event)"
>
  @for (user of results(); track user.id) {
  <ui-option [value]="user">{{ user.name }}</ui-option>
  }
</ui-autocomplete>
```

`ui-autocomplete` opens its list while the user types and filters it by label (unless
`filterOptions` is off). No option is active until the user moves with the arrow keys; Enter
picks the active option, Escape closes the list or clears the field. Without matches the list is
hidden in free-text mode; a pick-only field says `noOptions` and clears text that was not picked
when it loses focus.

`ui-multi-select` extras: `chips` shows the selected values as chips in the trigger (their x is for
the mouse; the keyboard deselects in the list), `selectAll` adds a first option that toggles
every enabled option the search shows (mixed while some are selected), and `maxSelections`
disables the other options once reached (it hides "select all").

```html
<ui-multi-select [formField]="form.trades" chips selectAll searchable>...</ui-multi-select>
<ui-multi-select [formField]="form.leads" chips maxSelections="2">...</ui-multi-select>
```

Signal Forms `required()` does not treat an empty array as empty. For a required multi-select, add
`minLength(path.recipients, 1)` next to `required()`.

For server-side search, set `[filterOptions]="false"` and load the options from `(searchChange)`.
It emits `''` when the list closes, so the full list can come back. The trigger keeps the label of
a selected option after it leaves the results. For a value that was never in the list (e.g. an
initial value), give `[displayWith]="nameOf"`.

`clearable` adds a clear button (the `clear` label) while a value is selected. `loading` shows a
spinner instead of the chevron and marks the list busy, e.g. during server-side search. In an
option, mark an icon or avatar with `uiOptionIcon` and a second line with `uiOptionDescription`;
the trigger shows only the label.

Change the toast position, duration or stack size with
`provideUiToast({ position: 'top-center', duration: 4000, max: 3 })`. Set dialog defaults with
`provideUiDialog({ size: 'lg', disableClose: true })`; options passed to `open()` win.

## Feedback

```html
<!-- Alert: plain content by default; set live when it appears after a user action -->
<ui-alert tone="warning" title="The plan is not signed" dismissible (dismissed)="hide()">
  Send it to the owner before the deadline.
  <button uiAlertActions ui-button size="sm">Send</button>
</ui-alert>
```

Alert tones are `info` (default), `success`, `warning` and `danger`, with the toast icons.
`live="polite"` makes the alert a `status` region and `live="assertive"` an `alert` region.
Screen readers announce a region when it is added, so render a live alert with `@if`.

```html
<!-- Empty state: a projected ui-icon is drawn in a circle; size="sm" fits cards and tables -->
<ui-empty-state title="No plans yet" headingLevel="2">
  <ui-icon icon="file" />
  Plans you create or that are shared with you show up here.
  <button uiEmptyStateActions ui-button>Create a plan</button>
</ui-empty-state>
```

Mark an image or SVG with `uiEmptyStateMedia` to show it without the circle.

```html
<!-- Progress bar: indeterminate without a value -->
<ui-progress-bar [value]="uploaded()" [max]="size()" label="Uploading plan.pdf" />
<ui-progress-bar size="sm" />
```

The bar is named by `label`, by `aria-labelledby`, or by the `loading` label.

## Data display

```html
<!-- Avatar: the image, else the initials on a color from the name, else a person icon -->
<ui-avatar name="Dana Levi" [src]="user.photoUrl" size="lg" />

<ui-avatar-group max="3" aria-label="Coordinators">
  @for (user of users; track user.id) {
  <ui-avatar [name]="user.name" [src]="user.photo" />
  }
</ui-avatar-group>
```

The name is the accessible name. Set `decorative` when the name is shown next to the avatar.

```html
<!-- Chips: a list with one tab stop; the arrow keys move between the remove buttons -->
<ui-chip-set aria-label="Recipients">
  @for (user of recipients(); track user.id) {
  <ui-chip removable (removed)="remove(user)">
    <ui-avatar uiChipIcon size="sm" [name]="user.name" decorative />
    {{ user.name }}
  </ui-chip>
  }
</ui-chip-set>

<!-- Filter chips: toggle buttons with aria-pressed, a group with one tab stop -->
<ui-chip-set aria-label="Status">
  <button ui-filter-chip [(selected)]="onlyOpen">Open</button>
  <button ui-filter-chip [(selected)]="onlySigned">Signed</button>
</ui-chip-set>
```

A removed chip is announced (`chipRemoved`), its button is named with `removeChip`, and focus
moves to the next chip. The app takes the chip out of its list on `(removed)`.

### Tables

`table[ui-table]` styles a native table; the kit does not render rows for you.

```html
<table ui-table uiSort [(sort)]="sort">
  <caption class="ui-visually-hidden">
    Plans
  </caption>
  <thead>
    <tr>
      <th scope="col" ui-sort-header="name">Name</th>
      <th scope="col" ui-sort-header="units" class="ui-table-numeric">Units</th>
    </tr>
  </thead>
  <tbody>
    @for (plan of rows(); track plan.id) {
    <tr>
      <td>{{ plan.name }}</td>
      <td class="ui-table-numeric">{{ plan.units }}</td>
    </tr>
    } @empty {
    <tr ui-table-message>
      No plans yet
    </tr>
    }
  </tbody>
</table>
```

Sort the rows yourself (`uiSortData(rows, sort)`) or on the server. A click on a sort header
announces the new order with the header text (the `sortedAscending`, `sortedDescending` and
`sortedNone` labels), because screen readers do not read a changed `aria-sort`.

```html
<!-- Row selection: the value is an array of rows; Shift+click selects a range -->
<table ui-table [(uiTableSelection)]="selected" [selectionCompareWith]="byId">
  <thead>
    <tr>
      <th ui-table-select-all></th>
      <th scope="col">Name</th>
    </tr>
  </thead>
  <tbody>
    @for (plan of rows(); track plan.id) {
    <tr>
      <td [ui-table-select-row]="plan" [label]="'Select ' + plan.name"></td>
      <td>{{ plan.name }}</td>
    </tr>
    }
  </tbody>
</table>
```

The header checkbox selects or deselects the rows on screen and is mixed while some of them are
selected; selected rows on other pages stay selected. A selected row gets `aria-selected` and
the `ui-table-row--selected` class. The checkboxes use the `selectAll` and `selectRow` labels
unless you pass `label`. `UiTableSelection` (`exportAs: 'uiTableSelection'`) also has
`select()`, `deselect()`, `toggle()` and `clear()`.

```html
<!-- Expandable rows: the detail row spans every column and is hidden while collapsed -->
@for (plan of rows(); track plan.id) {
<tr uiExpandableRow #row="uiExpandableRow">
  <td ui-row-toggle [label]="'Details of ' + plan.name"></td>
  <td>{{ plan.name }}</td>
</tr>
<tr [ui-row-detail]="row">
  @if (row.expanded()) {
  <app-plan-history [plan]="plan" />
  }
</tr>
}
```

The toggle button reports `aria-expanded` and controls the detail row (the `rowDetails` label
unless you pass `label`). Bind `[(expanded)]` to keep the state across pages or reloads.
The detail content is rendered while hidden; wrap it in `@if (row.expanded())` to create it
on demand.

```html
<!-- Wide tables: scroll sideways in a box, with sticky columns on both sides -->
<ui-table-container style="max-block-size: 30rem">
  <table ui-table stickyHeader>
    <thead>
      <tr>
        <th scope="col" uiSticky>Name</th>
        <th scope="col">Floor 1</th>
        …
        <th scope="col" uiSticky="end"><span class="ui-visually-hidden">Actions</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td uiSticky>{{ plan.name }}</td>
        …
      </tr>
    </tbody>
  </table>
</ui-table-container>
```

Mark the header cell and the body cells of a sticky column; several columns can stick to one
side (no `colspan` in them). A shadow marks the side with more content. While the table is
wider than the box, the box is focusable and a region named by `label`, the caption or the
`scrollableTable` label. With a `max-block-size` the box also scrolls vertically, and
`stickyHeader` sticks to its top.

## Navigation

```html
<!-- Breadcrumbs: the last link is the current page; 5+ links collapse into a menu -->
<nav ui-breadcrumbs>
  <a ui-breadcrumb routerLink="/">Home</a>
  <a ui-breadcrumb routerLink="/plans">Plans</a>
  <a ui-breadcrumb>{{ plan.name }}</a>
</nav>
```

With more links than `maxItems` (default 4), the links after the first one and before the last
`maxItems - 2` go into a "…" menu; picking an item follows the hidden link.

```html
<!-- Stepper: a numbered list of step buttons; the current one has aria-current="step" -->
<ui-stepper linear [(selectedIndex)]="step">
  <ui-step label="Details" [control]="form.details">
    ...
    <button ui-button uiStepperNext>Next</button>
  </ui-step>
  <ui-step label="Documents" optional>...</ui-step>
  <ui-step label="Review" [error]="serverError()">...</ui-step>
</ui-stepper>
```

`ui-stepper` shows the content of the current step in a region named by its button; the content
of the other steps is kept, not destroyed, so their forms keep their state. A step with a
`control` (a Reactive Forms control or a Signal Forms field) is done once the user leaves it
valid and shows an error once the user leaves it, or tries to, invalid. `completed` and `error`
(a string is shown under the label) set the state yourself. In a `linear` stepper a step can be
reached only when the steps before it are valid or `optional`; a blocked Next marks the form of
the step touched, so its fields show their errors. `orientation="vertical"` puts the content under
its step. `button[uiStepperNext]` / `button[uiStepperPrevious]` move from inside a step; the
stepper also has `next()`, `previous()`, `select(index)` and `reset()`, and a
`selectionChange` output. The step state is read after the label (the `stepCompleted` /
`stepError` labels); the steps run from right to left in RTL.

## Testing

`@vplans/ui-kit/testing` has [component harnesses](https://angular.dev/guide/testing/component-harnesses-overview)
built on `@angular/cdk/testing`. Tests that use them do not depend on the internal DOM of the kit,
so they keep working when that DOM changes.

| Harness                    | Finds                                                | Filters                                  |
| -------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `UiButtonHarness`          | `ui-button`, `ui-icon-button` (`<button>` and `<a>`) | `text`, `label`, `variant`, `disabled`   |
| `UiInputHarness`           | `input[ui-input]`, `textarea[ui-textarea]`           | `label`, `value`, `placeholder`          |
| `UiCheckboxHarness`        | `ui-checkbox`                                        | `label`, `name`, `checked`, `disabled`   |
| `UiSelectHarness`          | `ui-select`, `ui-multi-select`                       | `label`, `value`, `disabled`, `multiple` |
| `UiOptionHarness`          | `ui-option` (from `UiSelectHarness.getOptions()`)    | `text`, `selected`, `disabled`           |
| `UiDialogHarness`          | dialogs and drawers opened with `UiDialog`           | `title`, `drawer`                        |
| `UiChipHarness`            | `ui-chip`, `button[ui-filter-chip]`                  | `text`, `selected`, `disabled`           |
| `UiChipInputHarness`       | `ui-chip-input`                                      | `label`, `disabled`                      |
| `UiAutocompleteHarness`    | `ui-autocomplete`                                    | `label`, `value` (text), `disabled`      |
| `UiNumberInputHarness`     | `ui-number-input`                                    | `label`, `value` (text), `disabled`      |
| `UiSliderHarness`          | `ui-slider`, `ui-range-slider`                       | `label`, `range`, `disabled`             |
| `UiTimeInputHarness`       | `ui-time-input` (and its list of times)              | `label`, `value` (text), `disabled`      |
| `UiStepperHarness`         | `ui-stepper` (steps: `UiStepHarness`)                | `orientation`                            |
| `UiStepHarness`            | a step (from `UiStepperHarness.getSteps()`)          | `label`, `selected`, `done`, `error`     |
| `UiDateRangePickerHarness` | `ui-date-range-picker` (fields, calendar, presets)   | `label`, `disabled`                      |

`label` matches the `aria-label` or the text of the `label[for]`, so the label of `ui-form-field`
works (without the required marker). Every harness extends `UiHarness`: `focus()`, `blur()`,
`isFocused()` act on the element that takes focus, and `getHarness()` loads harnesses inside it
(e.g. the buttons of a dialog).

```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiDialogHarness, UiInputHarness, UiSelectHarness } from '@vplans/ui-kit/testing';

const loader = TestbedHarnessEnvironment.loader(fixture);
await (
  await loader.getHarness(UiInputHarness.with({ label: 'Email' }))
).setValue('dana@vplans.com');
await (
  await loader.getHarness(UiSelectHarness.with({ label: 'City' }))
).clickOptions({ text: 'Haifa' });

// Dialogs, and the options of a select, live in an overlay outside the fixture.
const dialog = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(
  UiDialogHarness.with({ title: 'Rename plan' }),
);
await dialog.close();
```

Harnesses for the other components follow in roadmap phase 9.

## Components

| Entry point                   | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@vplans/ui-kit/button`       | `UiButton`, `UiIconButton`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `@vplans/ui-kit/input`        | `UiInput`, `UiTextarea`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `@vplans/ui-kit/form-field`   | `UiFormField`, `UiHint`, `UiError`, `UiPrefix`, `UiSuffix`                                                                                                                                                                                                                                                                                                                                                                                           |
| `@vplans/ui-kit/checkbox`     | `UiCheckbox`                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `@vplans/ui-kit/radio`        | `UiRadioGroup`, `UiRadio`                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `@vplans/ui-kit/switch`       | `UiSwitch`                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `@vplans/ui-kit/spinner`      | `UiSpinner`                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `@vplans/ui-kit/skeleton`     | `UiSkeleton`, `UiSkeletonShape`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `@vplans/ui-kit/divider`      | `UiDivider`                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `@vplans/ui-kit/alert`        | `UiAlert`, `UiAlertTone`, `UiAlertLive`                                                                                                                                                                                                                                                                                                                                                                                                              |
| `@vplans/ui-kit/empty-state`  | `UiEmptyState`                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `@vplans/ui-kit/progress`     | `UiProgressBar`, `UiProgressTone`                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `@vplans/ui-kit/avatar`       | `UiAvatar`, `UiAvatarGroup`, `UiAvatarSize`, `uiInitials`, `uiAvatarColor`                                                                                                                                                                                                                                                                                                                                                                           |
| `@vplans/ui-kit/badge`        | `UiBadge`, `UiBadgeTone`                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `@vplans/ui-kit/table`        | `UiTable`, `UiTableMessage`, `UiTableSkeleton`, `UiSort`, `UiSortHeader`, `uiSortData`, `UiTableDensity`, sort types, `UiTableSelection`, `UiTableSelectAll`, `UiTableSelectRow`, `UiExpandableRow`, `UiRowToggle`, `UiRowDetail`, `UiTableContainer`, `UiSticky`, `UiStickySide`                                                                                                                                                                    |
| `@vplans/ui-kit/card`         | `UiCard`, `UiCardHeader`, `UiCardTitle`, `UiCardSubtitle`, `UiCardContent`, `UiCardFooter`                                                                                                                                                                                                                                                                                                                                                           |
| `@vplans/ui-kit/accordion`    | `UiAccordion`, `UiAccordionItem`, `UiAccordionContent`                                                                                                                                                                                                                                                                                                                                                                                               |
| `@vplans/ui-kit/breadcrumbs`  | `UiBreadcrumbs`, `UiBreadcrumb`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `@vplans/ui-kit/tabs`         | `UiTabGroup`, `UiTab`, `UiTabLabel`, `UiTabContent`, `UiTabNav`, `UiTabLink`                                                                                                                                                                                                                                                                                                                                                                         |
| `@vplans/ui-kit/pagination`   | `UiPagination`, `UiPageEvent`, `UiPageItem`, `uiPageItems`                                                                                                                                                                                                                                                                                                                                                                                           |
| `@vplans/ui-kit/stepper`      | `UiStepper`, `UiStep`, `UiStepperNext`, `UiStepperPrevious`, `UiStepControl`, `UiStepperOrientation`, `UiStepperSelectionChange`                                                                                                                                                                                                                                                                                                                     |
| `@vplans/ui-kit/tooltip`      | `UiTooltip`, `UiTooltipPosition`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `@vplans/ui-kit/popover`      | `UiPopoverTrigger`, `UiPopoverContext`, `UiPopoverPosition`                                                                                                                                                                                                                                                                                                                                                                                          |
| `@vplans/ui-kit/menu`         | `UiMenu`, `UiMenuItem`, `UiMenuTrigger`, `UiMenuGroup`, `UiMenuItemCheckbox`, `UiMenuItemRadio`, `UiMenuPosition`                                                                                                                                                                                                                                                                                                                                    |
| `@vplans/ui-kit/dialog`       | `UiDialog`, `provideUiDialog`, `UI_DIALOG_DEFAULT_OPTIONS`, `UiDialogDefaults`, `UiDialogOptions`, `UiDrawerOptions`, `UiDrawerPosition`, `UiConfirmOptions`, `UiDialogSize`, `UiDialogRef`, `UI_DIALOG_DATA`, `UiDialogHeader`, `UiDialogTitle`, `UiDialogContent`, `UiDialogActions`, `UiDialogClose`                                                                                                                                              |
| `@vplans/ui-kit/toast`        | `UiToast`, `UiToastRef`, `provideUiToast`, `UI_TOAST_CONFIG`, toast types                                                                                                                                                                                                                                                                                                                                                                            |
| `@vplans/ui-kit/select`       | `UiSelect`, `UiMultiSelect`, `UiOption`, `UiOptionGroup`                                                                                                                                                                                                                                                                                                                                                                                             |
| `@vplans/ui-kit/chip`         | `UiChip`, `UiFilterChip`, `UiChipSet`, `UiChipInput`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `@vplans/ui-kit/number-input` | `UiNumberInput`, `UiNumberFormat`                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `@vplans/ui-kit/slider`       | `UiSlider`, `UiRangeSlider`, `UiSliderMark`, `UiSliderRange`                                                                                                                                                                                                                                                                                                                                                                                         |
| `@vplans/ui-kit/time`         | `UiTimeInput`, `uiDateWithTime`, `uiTimeOf`                                                                                                                                                                                                                                                                                                                                                                                                          |
| `@vplans/ui-kit/datepicker`   | `UiDatepicker`, `UiDateRangePicker`, `UiDateRangePreset`, `UiCalendar`, `UiCalendarView`, `UiDateFilter`, `UiDateRange`                                                                                                                                                                                                                                                                                                                              |
| `@vplans/ui-kit/icon`         | `UiIcon`, `provideUiIcons`, `UiIconRegistry`, `UiIconDefinition`, `uiIcon*` icons, `UI_ICONS_ALL`, `UiIconName`                                                                                                                                                                                                                                                                                                                                      |
| `@vplans/ui-kit/theme`        | `ThemeService`, `provideUiTheme`, `UI_THEME_OPTIONS`, `UiThemeMode`, `UiResolvedTheme`, `UiThemeOptions`                                                                                                                                                                                                                                                                                                                                             |
| `@vplans/ui-kit/testing`      | `UiHarness`, `UiButtonHarness`, `UiInputHarness`, `UiCheckboxHarness`, `UiSelectHarness`, `UiOptionHarness`, `UiDialogHarness`, `UiNumberInputHarness`, `UiChipHarness`, `UiChipInputHarness`, `UiAutocompleteHarness`, `UiFileUploadHarness` (+ `UiFileUploadItem`), `UiSliderHarness` (+ `UiSliderThumb`), `UiDateRangePickerHarness` (+ `UiDateRangeEdge`), `UiTimeInputHarness`, `UiStepperHarness` (+ `UiStepHarness`), their `*HarnessFilters` |
| `@vplans/ui-kit/core`         | shared types, `UiFormControlBase`, `UiCheckableBase`, `injectControlState`, `provideUiCheckedValidator`, form-field contract, `provideUiLabels`, `UI_LABELS_HE`/`UI_LABELS_EN`, `resolveDirection`, `provideUiLiveDirectionality`                                                                                                                                                                                                                    |

## Tokens

Generated from `tokens.json` by `pnpm tokens`. Values are shown as light / dark.

<!-- tokens:start -->

| Token                                    | Layer     | Light                                                                        | Dark                                                                   |
| ---------------------------------------- | --------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `--ui-font-family-sans`                  | semantic  | `Assistant, Roboto, "Helvetica Neue", sans-serif`                            | `Assistant, Roboto, "Helvetica Neue", sans-serif`                      |
| `--ui-font-family-mono`                  | semantic  | `ui-monospace, 'JetBrains Mono', 'Cascadia Code', Consolas, monospace`       | `ui-monospace, 'JetBrains Mono', 'Cascadia Code', Consolas, monospace` |
| `--ui-font-size-xs`                      | semantic  | `0.75rem`                                                                    | `0.75rem`                                                              |
| `--ui-font-size-sm`                      | semantic  | `0.875rem`                                                                   | `0.875rem`                                                             |
| `--ui-font-size-md`                      | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-font-size-lg`                      | semantic  | `1.125rem`                                                                   | `1.125rem`                                                             |
| `--ui-font-size-xl`                      | semantic  | `1.25rem`                                                                    | `1.25rem`                                                              |
| `--ui-font-size-2xl`                     | semantic  | `1.5rem`                                                                     | `1.5rem`                                                               |
| `--ui-font-size-3xl`                     | semantic  | `1.875rem`                                                                   | `1.875rem`                                                             |
| `--ui-font-size-4xl`                     | semantic  | `2.25rem`                                                                    | `2.25rem`                                                              |
| `--ui-font-weight-regular`               | semantic  | `400`                                                                        | `400`                                                                  |
| `--ui-font-weight-medium`                | semantic  | `500`                                                                        | `500`                                                                  |
| `--ui-font-weight-semibold`              | semantic  | `600`                                                                        | `600`                                                                  |
| `--ui-font-weight-bold`                  | semantic  | `700`                                                                        | `700`                                                                  |
| `--ui-line-height-tight`                 | semantic  | `1.25`                                                                       | `1.25`                                                                 |
| `--ui-line-height-snug`                  | semantic  | `1.375`                                                                      | `1.375`                                                                |
| `--ui-line-height-normal`                | semantic  | `1.5`                                                                        | `1.5`                                                                  |
| `--ui-space-3xs`                         | semantic  | `0.125rem`                                                                   | `0.125rem`                                                             |
| `--ui-space-2xs`                         | semantic  | `0.25rem`                                                                    | `0.25rem`                                                              |
| `--ui-space-xs`                          | semantic  | `0.375rem`                                                                   | `0.375rem`                                                             |
| `--ui-space-sm`                          | semantic  | `0.5rem`                                                                     | `0.5rem`                                                               |
| `--ui-space-md`                          | semantic  | `0.75rem`                                                                    | `0.75rem`                                                              |
| `--ui-space-lg`                          | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-space-xl`                          | semantic  | `1.5rem`                                                                     | `1.5rem`                                                               |
| `--ui-space-2xl`                         | semantic  | `2rem`                                                                       | `2rem`                                                                 |
| `--ui-space-3xl`                         | semantic  | `3rem`                                                                       | `3rem`                                                                 |
| `--ui-radius-sm`                         | semantic  | `0.25rem`                                                                    | `0.25rem`                                                              |
| `--ui-radius-control`                    | semantic  | `0.375rem`                                                                   | `0.375rem`                                                             |
| `--ui-radius-container`                  | semantic  | `0.5rem`                                                                     | `0.5rem`                                                               |
| `--ui-radius-full`                       | semantic  | `9999px`                                                                     | `9999px`                                                               |
| `--ui-border-width-default`              | semantic  | `1px`                                                                        | `1px`                                                                  |
| `--ui-border-width-strong`               | semantic  | `2px`                                                                        | `2px`                                                                  |
| `--ui-focus-ring-width`                  | semantic  | `2px`                                                                        | `2px`                                                                  |
| `--ui-focus-ring-offset`                 | semantic  | `2px`                                                                        | `2px`                                                                  |
| `--ui-control-height-sm`                 | semantic  | `2rem`                                                                       | `2rem`                                                                 |
| `--ui-control-height-md`                 | semantic  | `2.5rem`                                                                     | `2.5rem`                                                               |
| `--ui-control-height-lg`                 | semantic  | `2.75rem`                                                                    | `2.75rem`                                                              |
| `--ui-control-padding-inline-sm`         | semantic  | `0.625rem`                                                                   | `0.625rem`                                                             |
| `--ui-control-padding-inline-md`         | semantic  | `0.75rem`                                                                    | `0.75rem`                                                              |
| `--ui-control-padding-inline-lg`         | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-control-font-size-sm`              | semantic  | `0.875rem`                                                                   | `0.875rem`                                                             |
| `--ui-control-font-size-md`              | semantic  | `0.875rem`                                                                   | `0.875rem`                                                             |
| `--ui-control-font-size-lg`              | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-control-gap-sm`                    | semantic  | `0.375rem`                                                                   | `0.375rem`                                                             |
| `--ui-control-gap-md`                    | semantic  | `0.5rem`                                                                     | `0.5rem`                                                               |
| `--ui-control-gap-lg`                    | semantic  | `0.625rem`                                                                   | `0.625rem`                                                             |
| `--ui-icon-size-sm`                      | semantic  | `1rem`                                                                       | `1rem`                                                                 |
| `--ui-icon-size-md`                      | semantic  | `1.25rem`                                                                    | `1.25rem`                                                              |
| `--ui-icon-size-lg`                      | semantic  | `1.5rem`                                                                     | `1.5rem`                                                               |
| `--ui-container-width-xs`                | semantic  | `12rem`                                                                      | `12rem`                                                                |
| `--ui-container-width-sm`                | semantic  | `15rem`                                                                      | `15rem`                                                                |
| `--ui-container-width-md`                | semantic  | `20rem`                                                                      | `20rem`                                                                |
| `--ui-container-width-lg`                | semantic  | `24rem`                                                                      | `24rem`                                                                |
| `--ui-container-width-xl`                | semantic  | `25rem`                                                                      | `25rem`                                                                |
| `--ui-container-width-2xl`               | semantic  | `35rem`                                                                      | `35rem`                                                                |
| `--ui-container-width-3xl`               | semantic  | `50rem`                                                                      | `50rem`                                                                |
| `--ui-media-size-sm`                     | semantic  | `1.5rem`                                                                     | `1.5rem`                                                               |
| `--ui-media-size-md`                     | semantic  | `2rem`                                                                       | `2rem`                                                                 |
| `--ui-media-size-lg`                     | semantic  | `2.5rem`                                                                     | `2.5rem`                                                               |
| `--ui-media-size-xl`                     | semantic  | `3rem`                                                                       | `3rem`                                                                 |
| `--ui-panel-max-height`                  | semantic  | `18rem`                                                                      | `18rem`                                                                |
| `--ui-em-1`                              | semantic  | `1em`                                                                        | `1em`                                                                  |
| `--ui-em-5`                              | semantic  | `5em`                                                                        | `5em`                                                                  |
| `--ui-em-6`                              | semantic  | `6em`                                                                        | `6em`                                                                  |
| `--ui-em-0-8`                            | semantic  | `0.8em`                                                                      | `0.8em`                                                                |
| `--ui-em-2-5`                            | semantic  | `2.5em`                                                                      | `2.5em`                                                                |
| `--ui-em-0-4`                            | semantic  | `0.4em`                                                                      | `0.4em`                                                                |
| `--ui-z-sticky`                          | semantic  | `1100`                                                                       | `1100`                                                                 |
| `--ui-motion-duration-instant`           | semantic  | `50ms`                                                                       | `50ms`                                                                 |
| `--ui-motion-duration-fast`              | semantic  | `120ms`                                                                      | `120ms`                                                                |
| `--ui-motion-duration-normal`            | semantic  | `200ms`                                                                      | `200ms`                                                                |
| `--ui-motion-duration-slow`              | semantic  | `320ms`                                                                      | `320ms`                                                                |
| `--ui-motion-easing-standard`            | semantic  | `cubic-bezier(0.2, 0, 0, 1)`                                                 | `cubic-bezier(0.2, 0, 0, 1)`                                           |
| `--ui-motion-easing-enter`               | semantic  | `cubic-bezier(0, 0, 0.2, 1)`                                                 | `cubic-bezier(0, 0, 0.2, 1)`                                           |
| `--ui-motion-easing-exit`                | semantic  | `cubic-bezier(0.4, 0, 1, 1)`                                                 | `cubic-bezier(0.4, 0, 1, 1)`                                           |
| `--ui-color-bg`                          | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-surface`                     | semantic  | `#ffffff`                                                                    | `#1d2535`                                                              |
| `--ui-color-surface-subtle`              | semantic  | `#f8f9fb`                                                                    | `#1d2535`                                                              |
| `--ui-color-surface-muted`               | semantic  | `#f1f3f6`                                                                    | `#2b3549`                                                              |
| `--ui-color-surface-raised`              | semantic  | `#ffffff`                                                                    | `#2b3549`                                                              |
| `--ui-color-surface-hover`               | semantic  | `#f1f3f6`                                                                    | `#364054`                                                              |
| `--ui-color-surface-active`              | semantic  | `#e4e7ed`                                                                    | `#4a5466`                                                              |
| `--ui-color-surface-emphasis`            | semantic  | `#cdd2db`                                                                    | `#4a5466`                                                              |
| `--ui-color-text`                        | semantic  | `#1d2535`                                                                    | `#f8f9fb`                                                              |
| `--ui-color-text-muted`                  | semantic  | `#636d7e`                                                                    | `#a7acaf`                                                              |
| `--ui-color-text-disabled`               | semantic  | `#a7acaf`                                                                    | `#636d7e`                                                              |
| `--ui-color-text-inverse`                | semantic  | `#ffffff`                                                                    | `#1d2535`                                                              |
| `--ui-color-border`                      | semantic  | `#e4e7ed`                                                                    | `#4a5466`                                                              |
| `--ui-color-border-control`              | semantic  | `#848d9d`                                                                    | `#848d9d`                                                              |
| `--ui-color-border-control-hover`        | semantic  | `#4a5466`                                                                    | `#cdd2db`                                                              |
| `--ui-color-control-bg`                  | semantic  | `#ffffff`                                                                    | `#1d2535`                                                              |
| `--ui-color-control-bg-disabled`         | semantic  | `#f1f3f6`                                                                    | `#2b3549`                                                              |
| `--ui-color-primary`                     | semantic  | `#1a74c9`                                                                    | `#4aa3ef`                                                              |
| `--ui-color-primary-hover`               | semantic  | `#155ea6`                                                                    | `#72b8f2`                                                              |
| `--ui-color-primary-active`              | semantic  | `#004b9e`                                                                    | `#a8d3f6`                                                              |
| `--ui-color-primary-contrast`            | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-primary-subtle`              | semantic  | `#e9f4fc`                                                                    | `#0a2747`                                                              |
| `--ui-color-primary-text`                | semantic  | `#155ea6`                                                                    | `#72b8f2`                                                              |
| `--ui-color-danger`                      | semantic  | `#dc2626`                                                                    | `#f87171`                                                              |
| `--ui-color-danger-hover`                | semantic  | `#b91c1c`                                                                    | `#fca5a5`                                                              |
| `--ui-color-danger-active`               | semantic  | `#991b1b`                                                                    | `#fecaca`                                                              |
| `--ui-color-danger-contrast`             | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-danger-subtle`               | semantic  | `#fef2f2`                                                                    | `#450a0a`                                                              |
| `--ui-color-danger-text`                 | semantic  | `#b91c1c`                                                                    | `#fecaca`                                                              |
| `--ui-color-success`                     | semantic  | `#008752`                                                                    | `#3fae7c`                                                              |
| `--ui-color-success-contrast`            | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-success-subtle`              | semantic  | `#e8f6ef`                                                                    | `#032819`                                                              |
| `--ui-color-success-text`                | semantic  | `#006c42`                                                                    | `#5fbf8f`                                                              |
| `--ui-color-warning`                     | semantic  | `#685e1b`                                                                    | `#bfae38`                                                              |
| `--ui-color-warning-contrast`            | semantic  | `#ffffff`                                                                    | `#111723`                                                              |
| `--ui-color-warning-subtle`              | semantic  | `#faf8e8`                                                                    | `#29230a`                                                              |
| `--ui-color-warning-text`                | semantic  | `#554c1a`                                                                    | `#d4c65a`                                                              |
| `--ui-color-info`                        | semantic  | `#155ea6`                                                                    | `#4aa3ef`                                                              |
| `--ui-color-info-subtle`                 | semantic  | `#e9f4fc`                                                                    | `#0a2747`                                                              |
| `--ui-color-info-text`                   | semantic  | `#155ea6`                                                                    | `#72b8f2`                                                              |
| `--ui-color-accent-1-bg`                 | semantic  | `#d3e9fa`                                                                    | `#0d3d6e`                                                              |
| `--ui-color-accent-1-text`               | semantic  | `#004b9e`                                                                    | `#a8d3f6`                                                              |
| `--ui-color-accent-2-bg`                 | semantic  | `#c9ebd9`                                                                    | `#07472e`                                                              |
| `--ui-color-accent-2-text`               | semantic  | `#055636`                                                                    | `#95d6b4`                                                              |
| `--ui-color-accent-3-bg`                 | semantic  | `#f3efc6`                                                                    | `#483f19`                                                              |
| `--ui-color-accent-3-text`               | semantic  | `#554c1a`                                                                    | `#e6dd8e`                                                              |
| `--ui-color-accent-4-bg`                 | semantic  | `#fee2e2`                                                                    | `#7f1d1d`                                                              |
| `--ui-color-accent-4-text`               | semantic  | `#991b1b`                                                                    | `#fecaca`                                                              |
| `--ui-color-accent-5-bg`                 | semantic  | `#ede9fe`                                                                    | `#4c1d95`                                                              |
| `--ui-color-accent-5-text`               | semantic  | `#5b21b6`                                                                    | `#ddd6fe`                                                              |
| `--ui-color-accent-6-bg`                 | semantic  | `#ccfbf1`                                                                    | `#134e4a`                                                              |
| `--ui-color-accent-6-text`               | semantic  | `#115e59`                                                                    | `#99f6e4`                                                              |
| `--ui-color-accent-7-bg`                 | semantic  | `#ffedd5`                                                                    | `#7c2d12`                                                              |
| `--ui-color-accent-7-text`               | semantic  | `#9a3412`                                                                    | `#fed7aa`                                                              |
| `--ui-color-accent-8-bg`                 | semantic  | `#fce7f3`                                                                    | `#831843`                                                              |
| `--ui-color-accent-8-text`               | semantic  | `#9d174d`                                                                    | `#fbcfe8`                                                              |
| `--ui-color-focus-ring`                  | semantic  | `#1a74c9`                                                                    | `#72b8f2`                                                              |
| `--ui-color-backdrop`                    | semantic  | `rgb(15 23 42 / 0.5)`                                                        | `rgb(0 0 0 / 0.6)`                                                     |
| `--ui-shadow-sm`                         | semantic  | `0 1px 2px 0 rgb(15 23 42 / 0.06)`                                           | `0 1px 2px 0 rgb(0 0 0 / 0.4)`                                         |
| `--ui-shadow-md`                         | semantic  | `0 4px 8px -2px rgb(15 23 42 / 0.10), 0 2px 4px -2px rgb(15 23 42 / 0.06)`   | `0 4px 8px -2px rgb(0 0 0 / 0.5)`                                      |
| `--ui-shadow-lg`                         | semantic  | `0 12px 24px -6px rgb(15 23 42 / 0.16), 0 4px 8px -4px rgb(15 23 42 / 0.08)` | `0 12px 24px -6px rgb(0 0 0 / 0.6)`                                    |
| `--ui-button-radius`                     | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-button-font-weight`                | component | `var(--ui-font-weight-medium)`                                               | `var(--ui-font-weight-medium)`                                         |
| `--ui-button-primary-bg`                 | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-button-primary-bg-hover`           | component | `var(--ui-color-primary-hover)`                                              | `var(--ui-color-primary-hover)`                                        |
| `--ui-button-primary-bg-active`          | component | `var(--ui-color-primary-active)`                                             | `var(--ui-color-primary-active)`                                       |
| `--ui-button-primary-text`               | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-button-primary-border`             | component | `transparent`                                                                | `transparent`                                                          |
| `--ui-button-secondary-bg`               | component | `var(--ui-color-surface)`                                                    | `var(--ui-color-surface)`                                              |
| `--ui-button-secondary-bg-hover`         | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-button-secondary-bg-active`        | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-button-secondary-text`             | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-button-secondary-border`           | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-button-ghost-bg`                   | component | `transparent`                                                                | `transparent`                                                          |
| `--ui-button-ghost-bg-hover`             | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-button-ghost-bg-active`            | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-button-ghost-text`                 | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-button-ghost-border`               | component | `transparent`                                                                | `transparent`                                                          |
| `--ui-button-danger-bg`                  | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-button-danger-bg-hover`            | component | `var(--ui-color-danger-hover)`                                               | `var(--ui-color-danger-hover)`                                         |
| `--ui-button-danger-bg-active`           | component | `var(--ui-color-danger-active)`                                              | `var(--ui-color-danger-active)`                                        |
| `--ui-button-danger-text`                | component | `var(--ui-color-danger-contrast)`                                            | `var(--ui-color-danger-contrast)`                                      |
| `--ui-button-danger-border`              | component | `transparent`                                                                | `transparent`                                                          |
| `--ui-input-bg`                          | component | `var(--ui-color-control-bg)`                                                 | `var(--ui-color-control-bg)`                                           |
| `--ui-input-bg-disabled`                 | component | `var(--ui-color-control-bg-disabled)`                                        | `var(--ui-color-control-bg-disabled)`                                  |
| `--ui-input-text`                        | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-input-placeholder`                 | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-input-border`                      | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-input-border-hover`                | component | `var(--ui-color-border-control-hover)`                                       | `var(--ui-color-border-control-hover)`                                 |
| `--ui-input-border-focus`                | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-input-border-invalid`              | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-input-radius`                      | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-form-field-gap`                    | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-form-field-label-color`            | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-form-field-label-font-size`        | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-form-field-label-font-weight`      | component | `var(--ui-font-weight-medium)`                                               | `var(--ui-font-weight-medium)`                                         |
| `--ui-form-field-hint-color`             | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-form-field-error-color`            | component | `var(--ui-color-danger-text)`                                                | `var(--ui-color-danger-text)`                                          |
| `--ui-form-field-message-font-size`      | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-form-field-affix-color`            | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-checkbox-size`                     | component | `var(--ui-icon-size-sm)`                                                     | `var(--ui-icon-size-sm)`                                               |
| `--ui-checkbox-radius`                   | component | `var(--ui-radius-sm)`                                                        | `var(--ui-radius-sm)`                                                  |
| `--ui-checkbox-bg`                       | component | `var(--ui-color-control-bg)`                                                 | `var(--ui-color-control-bg)`                                           |
| `--ui-checkbox-border`                   | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-checkbox-checked-bg`               | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-checkbox-checked-color`            | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-checkbox-invalid-border`           | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-radio-size`                        | component | `var(--ui-icon-size-sm)`                                                     | `var(--ui-icon-size-sm)`                                               |
| `--ui-radio-bg`                          | component | `var(--ui-color-control-bg)`                                                 | `var(--ui-color-control-bg)`                                           |
| `--ui-radio-border`                      | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-radio-checked-color`               | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-radio-invalid-border`              | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-switch-track-width`                | component | `var(--ui-control-height-md)`                                                | `var(--ui-control-height-md)`                                          |
| `--ui-switch-track-height`               | component | `var(--ui-icon-size-md)`                                                     | `var(--ui-icon-size-md)`                                               |
| `--ui-switch-track-bg`                   | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-switch-track-checked-bg`           | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-switch-thumb-bg`                   | component | `var(--ui-color-control-bg)`                                                 | `var(--ui-color-control-bg)`                                           |
| `--ui-switch-invalid-outline`            | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-slider-control-height`             | component | `var(--ui-control-height-sm)`                                                | `var(--ui-control-height-sm)`                                          |
| `--ui-slider-track-height-sm`            | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-slider-track-height-md`            | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-slider-track-height-lg`            | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-slider-thumb-size-sm`              | component | `var(--ui-icon-size-sm)`                                                     | `var(--ui-icon-size-sm)`                                               |
| `--ui-slider-thumb-size-md`              | component | `var(--ui-icon-size-md)`                                                     | `var(--ui-icon-size-md)`                                               |
| `--ui-slider-thumb-size-lg`              | component | `var(--ui-icon-size-lg)`                                                     | `var(--ui-icon-size-lg)`                                               |
| `--ui-slider-track-bg`                   | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-slider-fill-bg`                    | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-slider-thumb-bg`                   | component | `var(--ui-color-control-bg)`                                                 | `var(--ui-color-control-bg)`                                           |
| `--ui-slider-thumb-border`               | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-slider-thumb-border-hover`         | component | `var(--ui-color-primary-hover)`                                              | `var(--ui-color-primary-hover)`                                        |
| `--ui-slider-thumb-border-width`         | component | `var(--ui-border-width-strong)`                                              | `var(--ui-border-width-strong)`                                        |
| `--ui-slider-tick`                       | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-slider-tick-active`                | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-slider-mark-color`                 | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-slider-mark-active-color`          | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-slider-mark-font-size`             | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-slider-mark-gap`                   | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-slider-invalid`                    | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-slider-disabled`                   | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-slider-disabled-thumb-bg`          | component | `var(--ui-color-control-bg-disabled)`                                        | `var(--ui-color-control-bg-disabled)`                                  |
| `--ui-spinner-track-color`               | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-spinner-stroke-width`              | component | `var(--ui-border-width-strong)`                                              | `var(--ui-border-width-strong)`                                        |
| `--ui-divider-color`                     | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-divider-thickness`                 | component | `var(--ui-border-width-default)`                                             | `var(--ui-border-width-default)`                                       |
| `--ui-divider-label-color`               | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-divider-label-font-size`           | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-divider-label-gap`                 | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-divider-vertical-min-height`       | component | `var(--ui-em-1)`                                                             | `var(--ui-em-1)`                                                       |
| `--ui-badge-radius`                      | component | `var(--ui-radius-full)`                                                      | `var(--ui-radius-full)`                                                |
| `--ui-badge-font-size`                   | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-badge-font-size-md`                | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-badge-font-size-lg`                | component | `var(--ui-font-size-md)`                                                     | `var(--ui-font-size-md)`                                               |
| `--ui-badge-dot-size`                    | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-badge-font-weight`                 | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-badge-neutral-soft-bg`             | component | `var(--ui-color-surface-muted)`                                              | `var(--ui-color-surface-muted)`                                        |
| `--ui-badge-neutral-soft-text`           | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-badge-neutral-solid-bg`            | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-badge-neutral-solid-text`          | component | `var(--ui-color-text-inverse)`                                               | `var(--ui-color-text-inverse)`                                         |
| `--ui-badge-primary-soft-bg`             | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-badge-primary-soft-text`           | component | `var(--ui-color-primary-text)`                                               | `var(--ui-color-primary-text)`                                         |
| `--ui-badge-primary-solid-bg`            | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-badge-primary-solid-text`          | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-badge-info-soft-bg`                | component | `var(--ui-color-info-subtle)`                                                | `var(--ui-color-info-subtle)`                                          |
| `--ui-badge-info-soft-text`              | component | `var(--ui-color-info-text)`                                                  | `var(--ui-color-info-text)`                                            |
| `--ui-badge-info-solid-bg`               | component | `var(--ui-color-info)`                                                       | `var(--ui-color-info)`                                                 |
| `--ui-badge-info-solid-text`             | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-badge-success-soft-bg`             | component | `var(--ui-color-success-subtle)`                                             | `var(--ui-color-success-subtle)`                                       |
| `--ui-badge-success-soft-text`           | component | `var(--ui-color-success-text)`                                               | `var(--ui-color-success-text)`                                         |
| `--ui-badge-success-solid-bg`            | component | `var(--ui-color-success)`                                                    | `var(--ui-color-success)`                                              |
| `--ui-badge-success-solid-text`          | component | `var(--ui-color-success-contrast)`                                           | `var(--ui-color-success-contrast)`                                     |
| `--ui-badge-warning-soft-bg`             | component | `var(--ui-color-warning-subtle)`                                             | `var(--ui-color-warning-subtle)`                                       |
| `--ui-badge-warning-soft-text`           | component | `var(--ui-color-warning-text)`                                               | `var(--ui-color-warning-text)`                                         |
| `--ui-badge-warning-solid-bg`            | component | `var(--ui-color-warning)`                                                    | `var(--ui-color-warning)`                                              |
| `--ui-badge-warning-solid-text`          | component | `var(--ui-color-warning-contrast)`                                           | `var(--ui-color-warning-contrast)`                                     |
| `--ui-badge-danger-soft-bg`              | component | `var(--ui-color-danger-subtle)`                                              | `var(--ui-color-danger-subtle)`                                        |
| `--ui-badge-danger-soft-text`            | component | `var(--ui-color-danger-text)`                                                | `var(--ui-color-danger-text)`                                          |
| `--ui-badge-danger-solid-bg`             | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-badge-danger-solid-text`           | component | `var(--ui-color-danger-contrast)`                                            | `var(--ui-color-danger-contrast)`                                      |
| `--ui-alert-radius`                      | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-alert-padding-block`               | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-alert-padding-inline`              | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-alert-gap`                         | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-alert-text`                        | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-alert-font-size`                   | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-alert-title-font-weight`           | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-alert-info-bg`                     | component | `var(--ui-color-info-subtle)`                                                | `var(--ui-color-info-subtle)`                                          |
| `--ui-alert-info-border`                 | component | `var(--ui-color-info)`                                                       | `var(--ui-color-info)`                                                 |
| `--ui-alert-info-icon`                   | component | `var(--ui-color-info-text)`                                                  | `var(--ui-color-info-text)`                                            |
| `--ui-alert-success-bg`                  | component | `var(--ui-color-success-subtle)`                                             | `var(--ui-color-success-subtle)`                                       |
| `--ui-alert-success-border`              | component | `var(--ui-color-success)`                                                    | `var(--ui-color-success)`                                              |
| `--ui-alert-success-icon`                | component | `var(--ui-color-success-text)`                                               | `var(--ui-color-success-text)`                                         |
| `--ui-alert-warning-bg`                  | component | `var(--ui-color-warning-subtle)`                                             | `var(--ui-color-warning-subtle)`                                       |
| `--ui-alert-warning-border`              | component | `var(--ui-color-warning)`                                                    | `var(--ui-color-warning)`                                              |
| `--ui-alert-warning-icon`                | component | `var(--ui-color-warning-text)`                                               | `var(--ui-color-warning-text)`                                         |
| `--ui-alert-danger-bg`                   | component | `var(--ui-color-danger-subtle)`                                              | `var(--ui-color-danger-subtle)`                                        |
| `--ui-alert-danger-border`               | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-alert-danger-icon`                 | component | `var(--ui-color-danger-text)`                                                | `var(--ui-color-danger-text)`                                          |
| `--ui-empty-state-gap`                   | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-empty-state-padding-sm`            | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-empty-state-padding-md`            | component | `var(--ui-space-2xl)`                                                        | `var(--ui-space-2xl)`                                                  |
| `--ui-empty-state-max-width`             | component | `var(--ui-container-width-lg)`                                               | `var(--ui-container-width-lg)`                                         |
| `--ui-empty-state-icon-bg`               | component | `var(--ui-color-surface-muted)`                                              | `var(--ui-color-surface-muted)`                                        |
| `--ui-empty-state-icon-color`            | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-empty-state-icon-padding-sm`       | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-empty-state-icon-padding-md`       | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-empty-state-icon-size-sm`          | component | `var(--ui-font-size-2xl)`                                                    | `var(--ui-font-size-2xl)`                                              |
| `--ui-empty-state-icon-size-md`          | component | `var(--ui-font-size-4xl)`                                                    | `var(--ui-font-size-4xl)`                                              |
| `--ui-empty-state-title-font-size-sm`    | component | `var(--ui-font-size-md)`                                                     | `var(--ui-font-size-md)`                                               |
| `--ui-empty-state-title-font-size-md`    | component | `var(--ui-font-size-lg)`                                                     | `var(--ui-font-size-lg)`                                               |
| `--ui-empty-state-title-font-weight`     | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-empty-state-description-color`     | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-empty-state-description-font-size` | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-progress-track`                    | component | `var(--ui-color-surface-muted)`                                              | `var(--ui-color-surface-muted)`                                        |
| `--ui-progress-radius`                   | component | `var(--ui-radius-full)`                                                      | `var(--ui-radius-full)`                                                |
| `--ui-progress-height-sm`                | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-progress-height-md`                | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-progress-primary`                  | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-progress-success`                  | component | `var(--ui-color-success)`                                                    | `var(--ui-color-success)`                                              |
| `--ui-progress-warning`                  | component | `var(--ui-color-warning)`                                                    | `var(--ui-color-warning)`                                              |
| `--ui-progress-danger`                   | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-avatar-radius-square`              | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-avatar-size-sm`                    | component | `var(--ui-media-size-sm)`                                                    | `var(--ui-media-size-sm)`                                              |
| `--ui-avatar-size-md`                    | component | `var(--ui-media-size-md)`                                                    | `var(--ui-media-size-md)`                                              |
| `--ui-avatar-size-lg`                    | component | `var(--ui-media-size-lg)`                                                    | `var(--ui-media-size-lg)`                                              |
| `--ui-avatar-size-xl`                    | component | `var(--ui-media-size-xl)`                                                    | `var(--ui-media-size-xl)`                                              |
| `--ui-avatar-font-size-sm`               | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-avatar-font-size-md`               | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-avatar-font-size-lg`               | component | `var(--ui-font-size-md)`                                                     | `var(--ui-font-size-md)`                                               |
| `--ui-avatar-font-size-xl`               | component | `var(--ui-font-size-lg)`                                                     | `var(--ui-font-size-lg)`                                               |
| `--ui-avatar-font-weight`                | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-avatar-fallback-bg`                | component | `var(--ui-color-surface-muted)`                                              | `var(--ui-color-surface-muted)`                                        |
| `--ui-avatar-fallback-text`              | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-avatar-group-ring`                 | component | `var(--ui-color-surface)`                                                    | `var(--ui-color-surface)`                                              |
| `--ui-avatar-group-ring-width`           | component | `var(--ui-border-width-strong)`                                              | `var(--ui-border-width-strong)`                                        |
| `--ui-avatar-group-overlap`              | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-avatar-color-1-bg`                 | component | `var(--ui-color-accent-1-bg)`                                                | `var(--ui-color-accent-1-bg)`                                          |
| `--ui-avatar-color-1-text`               | component | `var(--ui-color-accent-1-text)`                                              | `var(--ui-color-accent-1-text)`                                        |
| `--ui-avatar-color-2-bg`                 | component | `var(--ui-color-accent-2-bg)`                                                | `var(--ui-color-accent-2-bg)`                                          |
| `--ui-avatar-color-2-text`               | component | `var(--ui-color-accent-2-text)`                                              | `var(--ui-color-accent-2-text)`                                        |
| `--ui-avatar-color-3-bg`                 | component | `var(--ui-color-accent-3-bg)`                                                | `var(--ui-color-accent-3-bg)`                                          |
| `--ui-avatar-color-3-text`               | component | `var(--ui-color-accent-3-text)`                                              | `var(--ui-color-accent-3-text)`                                        |
| `--ui-avatar-color-4-bg`                 | component | `var(--ui-color-accent-4-bg)`                                                | `var(--ui-color-accent-4-bg)`                                          |
| `--ui-avatar-color-4-text`               | component | `var(--ui-color-accent-4-text)`                                              | `var(--ui-color-accent-4-text)`                                        |
| `--ui-avatar-color-5-bg`                 | component | `var(--ui-color-accent-5-bg)`                                                | `var(--ui-color-accent-5-bg)`                                          |
| `--ui-avatar-color-5-text`               | component | `var(--ui-color-accent-5-text)`                                              | `var(--ui-color-accent-5-text)`                                        |
| `--ui-avatar-color-6-bg`                 | component | `var(--ui-color-accent-6-bg)`                                                | `var(--ui-color-accent-6-bg)`                                          |
| `--ui-avatar-color-6-text`               | component | `var(--ui-color-accent-6-text)`                                              | `var(--ui-color-accent-6-text)`                                        |
| `--ui-avatar-color-7-bg`                 | component | `var(--ui-color-accent-7-bg)`                                                | `var(--ui-color-accent-7-bg)`                                          |
| `--ui-avatar-color-7-text`               | component | `var(--ui-color-accent-7-text)`                                              | `var(--ui-color-accent-7-text)`                                        |
| `--ui-avatar-color-8-bg`                 | component | `var(--ui-color-accent-8-bg)`                                                | `var(--ui-color-accent-8-bg)`                                          |
| `--ui-avatar-color-8-text`               | component | `var(--ui-color-accent-8-text)`                                              | `var(--ui-color-accent-8-text)`                                        |
| `--ui-breadcrumbs-gap`                   | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-breadcrumbs-font-size`             | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-breadcrumbs-link`                  | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-breadcrumbs-link-hover`            | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-breadcrumbs-current`               | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-breadcrumbs-current-font-weight`   | component | `var(--ui-font-weight-medium)`                                               | `var(--ui-font-weight-medium)`                                         |
| `--ui-breadcrumbs-separator`             | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-breadcrumbs-separator-size`        | component | `var(--ui-em-0-4)`                                                           | `var(--ui-em-0-4)`                                                     |
| `--ui-breadcrumbs-separator-width`       | component | `var(--ui-border-width-default)`                                             | `var(--ui-border-width-default)`                                       |
| `--ui-card-bg`                           | component | `var(--ui-color-surface)`                                                    | `var(--ui-color-surface)`                                              |
| `--ui-card-border`                       | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-card-radius`                       | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-card-shadow`                       | component | `var(--ui-shadow-md)`                                                        | `var(--ui-shadow-md)`                                                  |
| `--ui-card-padding-sm`                   | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-card-padding-md`                   | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-card-padding-lg`                   | component | `var(--ui-space-xl)`                                                         | `var(--ui-space-xl)`                                                   |
| `--ui-card-gap`                          | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-card-title-font-size`              | component | `var(--ui-font-size-lg)`                                                     | `var(--ui-font-size-lg)`                                               |
| `--ui-card-title-font-weight`            | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-card-subtitle-color`               | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-tabs-border`                       | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-tabs-text`                         | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-tabs-text-hover`                   | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-tabs-text-selected`                | component | `var(--ui-color-primary-text)`                                               | `var(--ui-color-primary-text)`                                         |
| `--ui-tabs-indicator`                    | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-tabs-indicator-thickness`          | component | `var(--ui-border-width-strong)`                                              | `var(--ui-border-width-strong)`                                        |
| `--ui-tabs-height`                       | component | `var(--ui-control-height-lg)`                                                | `var(--ui-control-height-lg)`                                          |
| `--ui-tabs-padding-inline`               | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-tabs-gap`                          | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-tabs-font-size`                    | component | `var(--ui-font-size-md)`                                                     | `var(--ui-font-size-md)`                                               |
| `--ui-tabs-font-weight`                  | component | `var(--ui-font-weight-medium)`                                               | `var(--ui-font-weight-medium)`                                         |
| `--ui-tabs-panel-padding`                | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-tooltip-bg`                        | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-tooltip-text`                      | component | `var(--ui-color-text-inverse)`                                               | `var(--ui-color-text-inverse)`                                         |
| `--ui-tooltip-radius`                    | component | `var(--ui-radius-sm)`                                                        | `var(--ui-radius-sm)`                                                  |
| `--ui-tooltip-font-size`                 | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-tooltip-max-width`                 | component | `var(--ui-container-width-sm)`                                               | `var(--ui-container-width-sm)`                                         |
| `--ui-tooltip-offset`                    | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-tooltip-viewport-margin`           | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-popover-bg`                        | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-popover-border`                    | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-popover-radius`                    | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-popover-shadow`                    | component | `var(--ui-shadow-md)`                                                        | `var(--ui-shadow-md)`                                                  |
| `--ui-popover-padding`                   | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-popover-max-width`                 | component | `var(--ui-container-width-md)`                                               | `var(--ui-container-width-md)`                                         |
| `--ui-popover-offset`                    | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-popover-viewport-margin`           | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-dialog-bg`                         | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-dialog-radius`                     | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-dialog-shadow`                     | component | `var(--ui-shadow-lg)`                                                        | `var(--ui-shadow-lg)`                                                  |
| `--ui-dialog-backdrop`                   | component | `var(--ui-color-backdrop)`                                                   | `var(--ui-color-backdrop)`                                             |
| `--ui-dialog-padding`                    | component | `var(--ui-space-xl)`                                                         | `var(--ui-space-xl)`                                                   |
| `--ui-dialog-gap`                        | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-dialog-width-sm`                   | component | `var(--ui-container-width-xl)`                                               | `var(--ui-container-width-xl)`                                         |
| `--ui-dialog-width-md`                   | component | `var(--ui-container-width-2xl)`                                              | `var(--ui-container-width-2xl)`                                        |
| `--ui-dialog-width-lg`                   | component | `var(--ui-container-width-3xl)`                                              | `var(--ui-container-width-3xl)`                                        |
| `--ui-dialog-title-font-size`            | component | `var(--ui-font-size-xl)`                                                     | `var(--ui-font-size-xl)`                                               |
| `--ui-dialog-title-font-weight`          | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-drawer-bg`                         | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-drawer-shadow`                     | component | `var(--ui-shadow-lg)`                                                        | `var(--ui-shadow-lg)`                                                  |
| `--ui-drawer-width-sm`                   | component | `var(--ui-container-width-md)`                                               | `var(--ui-container-width-md)`                                         |
| `--ui-drawer-width-md`                   | component | `var(--ui-container-width-lg)`                                               | `var(--ui-container-width-lg)`                                         |
| `--ui-drawer-width-lg`                   | component | `var(--ui-container-width-2xl)`                                              | `var(--ui-container-width-2xl)`                                        |
| `--ui-toast-bg`                          | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-toast-text`                        | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-toast-border`                      | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-toast-radius`                      | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-toast-shadow`                      | component | `var(--ui-shadow-lg)`                                                        | `var(--ui-shadow-lg)`                                                  |
| `--ui-toast-width`                       | component | `var(--ui-container-width-lg)`                                               | `var(--ui-container-width-lg)`                                         |
| `--ui-toast-gap`                         | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-toast-offset`                      | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-toast-info-accent`                 | component | `var(--ui-color-info)`                                                       | `var(--ui-color-info)`                                                 |
| `--ui-toast-success-accent`              | component | `var(--ui-color-success)`                                                    | `var(--ui-color-success)`                                              |
| `--ui-toast-warning-accent`              | component | `var(--ui-color-warning)`                                                    | `var(--ui-color-warning)`                                              |
| `--ui-toast-danger-accent`               | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-select-panel-bg`                   | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-select-panel-border`               | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-select-panel-radius`               | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-select-panel-shadow`               | component | `var(--ui-shadow-md)`                                                        | `var(--ui-shadow-md)`                                                  |
| `--ui-select-panel-max-height`           | component | `var(--ui-panel-max-height)`                                                 | `var(--ui-panel-max-height)`                                           |
| `--ui-select-option-height`              | component | `var(--ui-control-height-sm)`                                                | `var(--ui-control-height-sm)`                                          |
| `--ui-select-option-hover-bg`            | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-select-option-active-bg`           | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-select-option-selected-text`       | component | `var(--ui-color-primary-text)`                                               | `var(--ui-color-primary-text)`                                         |
| `--ui-skeleton-bg`                       | component | `var(--ui-color-surface-emphasis)`                                           | `var(--ui-color-surface-emphasis)`                                     |
| `--ui-skeleton-highlight`                | component | `var(--ui-color-surface-muted)`                                              | `var(--ui-color-surface-muted)`                                        |
| `--ui-skeleton-radius-text`              | component | `var(--ui-radius-sm)`                                                        | `var(--ui-radius-sm)`                                                  |
| `--ui-skeleton-radius-rect`              | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-skeleton-line-gap`                 | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-skeleton-text-height`              | component | `var(--ui-em-0-8)`                                                           | `var(--ui-em-0-8)`                                                     |
| `--ui-skeleton-rect-height`              | component | `var(--ui-em-6)`                                                             | `var(--ui-em-6)`                                                       |
| `--ui-skeleton-circle-size`              | component | `var(--ui-em-2-5)`                                                           | `var(--ui-em-2-5)`                                                     |
| `--ui-accordion-bg`                      | component | `var(--ui-color-surface)`                                                    | `var(--ui-color-surface)`                                              |
| `--ui-accordion-border`                  | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-accordion-radius`                  | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-accordion-header-text`             | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-accordion-header-hover-bg`         | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-accordion-header-padding-block`    | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-accordion-header-padding-inline`   | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-accordion-header-gap`              | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-accordion-header-font-size`        | component | `var(--ui-font-size-md)`                                                     | `var(--ui-font-size-md)`                                               |
| `--ui-accordion-header-font-weight`      | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-accordion-icon-color`              | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-accordion-panel-padding-block`     | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-accordion-panel-padding-inline`    | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-menu-bg`                           | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-menu-border`                       | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-menu-divider`                      | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-menu-radius`                       | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-menu-shadow`                       | component | `var(--ui-shadow-md)`                                                        | `var(--ui-shadow-md)`                                                  |
| `--ui-menu-padding-block`                | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-menu-min-width`                    | component | `var(--ui-container-width-xs)`                                               | `var(--ui-container-width-xs)`                                         |
| `--ui-menu-max-width`                    | component | `var(--ui-container-width-md)`                                               | `var(--ui-container-width-md)`                                         |
| `--ui-menu-max-height`                   | component | `var(--ui-panel-max-height)`                                                 | `var(--ui-panel-max-height)`                                           |
| `--ui-menu-item-height`                  | component | `var(--ui-control-height-md)`                                                | `var(--ui-control-height-md)`                                          |
| `--ui-menu-item-padding-inline`          | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-menu-item-gap`                     | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-menu-item-font-size`               | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-menu-item-text`                    | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-menu-item-hover-bg`                | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-menu-item-icon-color`              | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-menu-item-danger-text`             | component | `var(--ui-color-danger-text)`                                                | `var(--ui-color-danger-text)`                                          |
| `--ui-menu-item-danger-hover-bg`         | component | `var(--ui-color-danger-subtle)`                                              | `var(--ui-color-danger-subtle)`                                        |
| `--ui-pagination-gap`                    | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-pagination-button-gap`             | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-pagination-page-size`              | component | `var(--ui-control-height-sm)`                                                | `var(--ui-control-height-sm)`                                          |
| `--ui-pagination-page-radius`            | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-pagination-page-font-size`         | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-pagination-page-text`              | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-pagination-page-hover-bg`          | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-pagination-page-current-bg`        | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-pagination-page-current-text`      | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-pagination-summary-text`           | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-pagination-summary-font-size`      | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-pagination-size-min-width`         | component | `var(--ui-em-5)`                                                             | `var(--ui-em-5)`                                                       |
| `--ui-table-bg`                          | component | `var(--ui-color-surface)`                                                    | `var(--ui-color-surface)`                                              |
| `--ui-table-border`                      | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-table-text`                        | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-table-font-size`                   | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-table-header-bg`                   | component | `var(--ui-color-surface-muted)`                                              | `var(--ui-color-surface-muted)`                                        |
| `--ui-table-header-text`                 | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-table-header-font-weight`          | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-table-row-hover-bg`                | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-table-row-selected-bg`             | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-table-detail-bg`                   | component | `var(--ui-color-surface-subtle)`                                             | `var(--ui-color-surface-subtle)`                                       |
| `--ui-table-scroll-shadow`               | component | `var(--ui-color-backdrop)`                                                   | `var(--ui-color-backdrop)`                                             |
| `--ui-table-scroll-shadow-size`          | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-table-cell-padding-inline`         | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-table-cell-padding-block`          | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |
| `--ui-table-cell-padding-block-compact`  | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-table-message-padding`             | component | `var(--ui-space-2xl)`                                                        | `var(--ui-space-2xl)`                                                  |
| `--ui-table-message-text`                | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-table-sort-icon`                   | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-table-sort-icon-active`            | component | `var(--ui-color-primary-text)`                                               | `var(--ui-color-primary-text)`                                         |
| `--ui-chip-bg`                           | component | `var(--ui-color-surface-muted)`                                              | `var(--ui-color-surface-muted)`                                        |
| `--ui-chip-text`                         | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-chip-icon`                         | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-chip-radius`                       | component | `var(--ui-radius-full)`                                                      | `var(--ui-radius-full)`                                                |
| `--ui-chip-font-size`                    | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-chip-padding-inline`               | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-chip-gap`                          | component | `var(--ui-space-2xs)`                                                        | `var(--ui-space-2xs)`                                                  |
| `--ui-chip-remove-hover-bg`              | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-chip-filter-bg`                    | component | `var(--ui-color-surface)`                                                    | `var(--ui-color-surface)`                                              |
| `--ui-chip-filter-border`                | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-chip-filter-hover-bg`              | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-chip-filter-selected-bg`           | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-chip-filter-selected-border`       | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-chip-filter-selected-text`         | component | `var(--ui-color-primary-text)`                                               | `var(--ui-color-primary-text)`                                         |
| `--ui-chip-set-gap`                      | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-file-upload-zone-bg`               | component | `var(--ui-color-surface)`                                                    | `var(--ui-color-surface)`                                              |
| `--ui-file-upload-zone-border`           | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-file-upload-zone-text`             | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-file-upload-zone-hover-bg`         | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-file-upload-zone-active-bg`        | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-file-upload-zone-active-border`    | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-file-upload-zone-radius`           | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-file-upload-zone-padding`          | component | `var(--ui-space-xl)`                                                         | `var(--ui-space-xl)`                                                   |
| `--ui-file-upload-file-border`           | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-file-upload-file-radius`           | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-file-upload-gap`                   | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-calendar-cell-size`                | component | `var(--ui-control-height-md)`                                                | `var(--ui-control-height-md)`                                          |
| `--ui-calendar-cell-radius`              | component | `var(--ui-radius-full)`                                                      | `var(--ui-radius-full)`                                                |
| `--ui-calendar-gap`                      | component | `var(--ui-space-3xs)`                                                        | `var(--ui-space-3xs)`                                                  |
| `--ui-calendar-cell-hover-bg`            | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-calendar-selected-bg`              | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-calendar-selected-text`            | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-calendar-today-border`             | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-calendar-weekday-text`             | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-calendar-weekday-height`           | component | `var(--ui-control-height-sm)`                                                | `var(--ui-control-height-sm)`                                          |
| `--ui-calendar-title-font-size`          | component | `var(--ui-font-size-md)`                                                     | `var(--ui-font-size-md)`                                               |
| `--ui-calendar-title-font-weight`        | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-calendar-month-gap`                | component | `var(--ui-space-xl)`                                                         | `var(--ui-space-xl)`                                                   |
| `--ui-calendar-range-bg`                 | component | `var(--ui-color-primary-subtle)`                                             | `var(--ui-color-primary-subtle)`                                       |
| `--ui-stepper-gap`                       | component | `var(--ui-space-sm)`                                                         | `var(--ui-space-sm)`                                                   |
| `--ui-stepper-header-padding`            | component | `var(--ui-space-xs)`                                                         | `var(--ui-space-xs)`                                                   |
| `--ui-stepper-header-radius`             | component | `var(--ui-radius-control)`                                                   | `var(--ui-radius-control)`                                             |
| `--ui-stepper-header-hover-bg`           | component | `var(--ui-color-surface-hover)`                                              | `var(--ui-color-surface-hover)`                                        |
| `--ui-stepper-marker-size`               | component | `var(--ui-control-height-sm)`                                                | `var(--ui-control-height-sm)`                                          |
| `--ui-stepper-marker-font-size`          | component | `var(--ui-font-size-sm)`                                                     | `var(--ui-font-size-sm)`                                               |
| `--ui-stepper-marker-font-weight`        | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-stepper-marker-border`             | component | `var(--ui-color-border-control)`                                             | `var(--ui-color-border-control)`                                       |
| `--ui-stepper-marker-text`               | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-stepper-marker-active-bg`          | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-stepper-marker-active-text`        | component | `var(--ui-color-primary-contrast)`                                           | `var(--ui-color-primary-contrast)`                                     |
| `--ui-stepper-marker-error-bg`           | component | `var(--ui-color-danger)`                                                     | `var(--ui-color-danger)`                                               |
| `--ui-stepper-marker-error-text`         | component | `var(--ui-color-danger-contrast)`                                            | `var(--ui-color-danger-contrast)`                                      |
| `--ui-stepper-connector`                 | component | `var(--ui-color-border)`                                                     | `var(--ui-color-border)`                                               |
| `--ui-stepper-connector-done`            | component | `var(--ui-color-primary)`                                                    | `var(--ui-color-primary)`                                              |
| `--ui-stepper-connector-width`           | component | `var(--ui-border-width-strong)`                                              | `var(--ui-border-width-strong)`                                        |
| `--ui-stepper-label-text`                | component | `var(--ui-color-text)`                                                       | `var(--ui-color-text)`                                                 |
| `--ui-stepper-label-muted`               | component | `var(--ui-color-text-muted)`                                                 | `var(--ui-color-text-muted)`                                           |
| `--ui-stepper-label-current-weight`      | component | `var(--ui-font-weight-semibold)`                                             | `var(--ui-font-weight-semibold)`                                       |
| `--ui-stepper-note-font-size`            | component | `var(--ui-font-size-xs)`                                                     | `var(--ui-font-size-xs)`                                               |
| `--ui-stepper-error-text`                | component | `var(--ui-color-danger-text)`                                                | `var(--ui-color-danger-text)`                                          |
| `--ui-stepper-content-gap`               | component | `var(--ui-space-lg)`                                                         | `var(--ui-space-lg)`                                                   |
| `--ui-datepicker-panel-bg`               | component | `var(--ui-color-surface-raised)`                                             | `var(--ui-color-surface-raised)`                                       |
| `--ui-datepicker-panel-border`           | component | `var(--ui-color-surface-active)`                                             | `var(--ui-color-surface-active)`                                       |
| `--ui-datepicker-panel-radius`           | component | `var(--ui-radius-container)`                                                 | `var(--ui-radius-container)`                                           |
| `--ui-datepicker-panel-shadow`           | component | `var(--ui-shadow-md)`                                                        | `var(--ui-shadow-md)`                                                  |
| `--ui-datepicker-panel-padding`          | component | `var(--ui-space-md)`                                                         | `var(--ui-space-md)`                                                   |

<!-- tokens:end -->

## Contributing

### Scripts

| Command                   | What it does                                                           |
| ------------------------- | ---------------------------------------------------------------------- |
| `pnpm start`              | Playground dev server                                                  |
| `pnpm tokens`             | Regenerates CSS/SCSS/TS/README tokens and checks WCAG contrast         |
| `pnpm test`               | Unit tests (Vitest)                                                    |
| `pnpm test:watch`         | Unit tests in watch mode                                               |
| `pnpm test:coverage`      | Unit tests with coverage; fails below the thresholds in `angular.json` |
| `pnpm test:playground`    | Playground smoke tests                                                 |
| `pnpm lint`               | ESLint (strictTypeChecked, templates, a11y) and Stylelint              |
| `pnpm format`             | Prettier (write)                                                       |
| `pnpm format:check`       | Prettier (check only)                                                  |
| `pnpm build`              | Tokens and the library build into `dist/ui-kit`                        |
| `pnpm build:playground`   | Playground build (checks the bundle budgets)                           |
| `pnpm storybook`          | Storybook dev server                                                   |
| `pnpm build-storybook`    | Static Storybook in `dist/storybook/ui-kit`                            |
| `pnpm test-storybook`     | axe (WCAG 2.1 AA) and console errors for every built story, 3 modes    |
| `pnpm test-visual`        | Screenshots of every built story, 3 modes, compared with `visual/`     |
| `pnpm test-visual:update` | Writes new or changed baselines into `visual/`                         |

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
6. For a form control, extend `UiFormControlBase` (from `@vplans/ui-kit/core`) and provide `UI_FORM_FIELD_CONTROL`. For a native element, use `injectControlState()`. A checkbox-like control extends `UiCheckableBase` and provides `provideUiCheckedValidator()`, so `required` means checked in Reactive and template forms.
7. Add a harness for the component to `projects/ui-kit/testing/` (`<name>-harness.ts` extending `UiHarness`, with a spec), export it from `public-api.ts` and list it under [Testing](#testing).
8. Required tests:
   - rendering and inputs;
   - outputs and model updates;
   - keyboard interaction;
   - ARIA attributes;
   - for form controls, Reactive Forms and Signal Forms (value both ways, disabled, touched, error linking).
9. Required stories: one per variant and state (default, sizes, disabled, invalid, readonly, loading, ...). `pnpm build-storybook && pnpm test-storybook` must pass; also look at them in both themes and in RTL.
10. Visual baselines: after `pnpm build-storybook`, run `pnpm test-visual:update` for new or intentionally changed stories and look at the new PNGs in `visual/` before you commit them. `pnpm test-visual` must pass. A failure writes the new screenshot and a diff to `dist/visual-diff/`. The baselines are taken in the installed Edge at 1024×768 with reduced motion and a fixed date (2026-09-25), so a new Edge version may need an update of all baselines.
11. Keep commits small, one per component: `feat(<name>): ...`.

Anything not exported from an entry point's `public-api.ts` is internal and may change without notice.
