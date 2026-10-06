# Task: Build a custom UI kit (design system) for our Angular project

Original brief, kept verbatim. The decisions made since (see CLAUDE.md) take precedence where they differ.

Two points of the brief no longer hold: the kit targets **Angular 20**, and form controls work with
Reactive and template forms only — Signal Forms was removed, with the reason recorded in
[DECISIONS.md](DECISIONS.md).

## Context

- Large Angular application developed by a team of several developers.
- We decided NOT to use PrimeNG / Material / other component libraries. We want our own kit.
- Headless primitives from `@angular/cdk` (a11y, overlay, portal, listbox, etc.) are allowed and preferred over reinventing focus management and overlays.
- The kit must be consumable by the whole team, documented, and stable enough that people stop writing one-off buttons and inputs.

## Architecture

- Angular library inside the workspace, importable as `@vplans/ui-kit`.
- Component selector prefix: `ui-`.
- Secondary entry points per component (`@vplans/ui-kit/button`) for tree-shaking.
- Standalone components only, no NgModules.
- `ChangeDetectionStrategy.OnPush` everywhere, zoneless-compatible.
- Modern Angular APIs only: `input()`, `input.required()`, `model()`, `output()`, `computed()`, `viewChild()`, `host: {}` metadata instead of `@HostBinding`/`@HostListener`, new control flow (`@if`, `@for`).
- Form controls implement `ControlValueAccessor` and work with Reactive Forms and Signal Forms. Support disabled, invalid, touched states.
- No `::ng-deep`, no `!important`, no hardcoded colors/sizes inside components.

## Design tokens and theming

- Three token layers as CSS custom properties:
  1. **Primitive**: raw palette, spacing scale, radii, font sizes, shadows, z-index, durations.
  2. **Semantic**: `--ui-color-bg`, `--ui-color-text`, `--ui-color-primary`, `--ui-color-danger`, `--ui-color-border`, etc.
  3. **Component**: `--ui-button-bg`, `--ui-button-radius`, etc., defaulting to semantic tokens.
- Components use only semantic/component tokens.
- Light and dark themes via `[data-theme="dark"]` on `<html>` plus `prefers-color-scheme` fallback. A small signal-based `ThemeService` to switch and persist.
- Tokens as SCSS source + generated CSS, single source of truth (JSON).
- Sizes: `sm | md | lg`. Variants where relevant: `primary | secondary | ghost | danger`.
- RTL support via logical properties — the app is in Hebrew.

## Components, by phase

**Phase 1 (foundation):** tokens, typography, icon, button, icon-button, input, textarea, form-field (label, hint, error), checkbox, radio group, switch, spinner.
**Phase 2:** select / combobox (CDK listbox + overlay), tooltip, dialog/modal (CDK dialog), toast/notification service, tabs, badge, card, divider.
**Phase 3:** table (sorting, empty/loading states), pagination, date picker, menu/dropdown, accordion, skeleton.

Finish and test each phase fully before starting the next.

## Accessibility (mandatory)

- WCAG 2.1 AA: contrast, visible focus ring (`:focus-visible`), keyboard navigation, correct ARIA roles/attributes.
- Use CDK `FocusTrap`, `LiveAnnouncer`, `ActiveDescendantKeyManager` where appropriate.
- Every form control is properly linked to its label and error message.

## Docs and quality

- Storybook: one story per variant/state, controls for inputs, theme switcher, RTL toggle.
- Unit tests (Vitest) for each component: rendering, inputs, outputs, CVA behavior, keyboard interaction.
- Public API through `public-api.ts` only; nothing internal leaks.
- `README.md` in the library: installation, theming, token list, contribution rules.
- Strict TypeScript, no `any`, lint passes.

## Working style

- Small, reviewable commits per component.
- After each phase: summary of what was done, what's left, any decisions the user needs to make.
- If something in the existing codebase conflicts with these rules, stop and ask instead of guessing.
