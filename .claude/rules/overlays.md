---
paths:
  - "projects/ui-kit/{menu,dialog,popover,tooltip,select,datepicker,autocomplete,toast,breadcrumbs}/**/*.ts"
---

# Overlays, CDK Menu and direction

- The CDK `Directionality` reads `dir` once at startup. Every overlay must resolve the direction when it opens (`syncOverlayDirection()` from core, or `direction` for CDK Dialog), otherwise it renders LTR after a runtime switch to RTL. Position presets also live in core (`core/overlay.ts`); do not copy them into a component.
- CDK overlays use the Popover API (top layer) by default, so `z-index` does not order them. Opening order does.
- CDK Menu only calls `preventDefault()` on Escape and closes the menu synchronously, so a host binding on `ui-menu` never runs and the overlay keyboard dispatcher also closes a surrounding dialog. `UiMenu` stops propagation from a listener registered in its constructor (before CDK Menu's).
- CDK Menu closes the menu synchronously inside the item click handler, and a link that is no longer in the page does not follow its `href`. `a[ui-menu-item]` wraps `CdkMenuItem.trigger` to keep the menu open during the click and closes it in a `setTimeout`.
- A directive cannot extend a component (NG0903). The shared base of the dialog and drawer containers is an abstract `@Component({ template: '' })`, because it extends `CdkDialogContainer`.
- The CDK places connected overlays in viewport coordinates from x=0, but the fixed overlay container starts after a page scrollbar on the left. Chrome draws it there in an RTL document inside an iframe (the Storybook manager), and every overlay moved by the scrollbar width. Each connected overlay adds `overlayOffsetX()` (core) when it opens: `cdkConnectedOverlayOffsetX`, `withDefaultOffsetX()`, or the menu positions. A new connected overlay needs it too; check it in the Storybook manager in RTL, not in `iframe.html`.
- The CDK push (`withPush`) ignores that offset and measures the end edge without the start margin: a pushed overlay ran 7 px under a left scrollbar, or kept 0 or 16 px from an edge instead of the margin. `UiPopoverTrigger` turns the push off and pushes the applied position itself (`UiPopoverPositionStrategy`, `pushOnScreen()`); other overlays that push keep the CDK behavior. Headless Edge hides scrollbars: check a scrollbar case with `ignoreDefaultArgs: ['--hide-scrollbars']`.
- Never size an overlay with `100vw`: it includes the page scrollbar. Clamp to the pane, which is at most as wide as the overlay container. A percentage on a surface sized by its content resolves against a pane sized by that content, so put the margin on the pane (`.ui-dialog-pane`, or `updateSize({ maxWidth })` for a connected overlay as in `UiPopoverTrigger`), not in a `min(…, 100% - margin)` on the surface.
