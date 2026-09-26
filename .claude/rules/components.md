---
paths:
  - "projects/ui-kit/**/*.ts"
---

# Component code

## Angular

- A template listener that returns `false` calls `preventDefault()`. Keep handlers returning void.
- `model()` has no transform. Under `strictTemplates` a bare boolean attribute on a model is a compile error. Coerce on read where needed.
- A static attribute that an input consumes (`<button ui-menu-item disabled>`) still stays on the native element. Bind `'[attr.disabled]': 'null'` when the native state is wrong (menu items must stay focusable).
- A `computed()` over DOM reads (`textContent`, header cells) runs once. Track DOM changes with a `MutationObserver` into a signal.
- Parent hooks called from a child's `computed()` may run before the child's required inputs are set (the key manager effect reads new options early). Pass the child instance and read its inputs only when needed (see `UiOptionHandle`).
- Internal cross-component calls (option → select, radio → group, item → accordion, container → toast) go through a non-exported `@Injectable()` provided by the parent, so they stay out of the public class API.
- `ViewContainerRef` of a projected element inserts views right after that element. `nav[ui-breadcrumbs]` uses it to put the "…" button after the first link, so the DOM order and the focus order follow the layout.
- `RouterLink` recomputes `href` after every navigation (`reactiveHref` is a `linkedSignal`), so setting `href = null` once does not last. Remove the attribute in `afterEveryRender` while disabled. `RouterLink.href` is deprecated; use `urlTree` + `Router.serializeUrl()`.

## Focus

- Angular `@for` may move a kept DOM node when items before it are removed, which drops focus. Re-focus after render (see the toast `keepFocus`).
- An element that sets up a later focus move (`afterNextRender`) must outlive the change: `ui-chip-set` disappears with its last chip, so `ui-chip-input` moves focus itself.

## RTL and a11y

- `resolveDirection()` skips `dir="auto"` and invalid values. Do not use `closest('[dir]')` directly.
- In RTL text a numeric range such as "51–75" is shown as "75–51". Wrap it in LRI/PDI (`⁦…⁩`).
- axe rejects `aria-expanded` on a `tr` outside a treegrid (`aria-conditional-attr`); `aria-selected` on a `tr` is fine. Expand state lives on the toggle button.

## Storybook JIT

Storybook dev compiles components in JIT (Analog plugin); `build-storybook` is not affected.

- A decorator that references a class declared later through `forwardRef` (`providers: [forwardRef(() => Local)]`) can make value imports vanish: `forwardRef` and `Injectable` were dropped from `table.ts` and the story failed with `forwardRef is not defined`. Declare local injectables before the component that provides them.
- `contentChildren(X)` / `viewChild(X)` metadata is evaluated when the class is declared. Declare `X` above the class that queries it, or the query silently matches nothing (a story renders without its child components and without an error). See `table/selection.ts`.
