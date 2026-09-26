---
paths:
  - "projects/ui-kit/{menu,dialog,popover,tooltip,select,datepicker,autocomplete,toast,breadcrumbs}/**/*.ts"
---

# Overlays, CDK Menu and direction

- The CDK `Directionality` reads `dir` once at startup. Every overlay must resolve the direction when it opens (`resolveDirection()` + `overlayRef.setDirection()`, or `direction` for CDK Dialog), otherwise it renders LTR after a runtime switch to RTL.
- CDK overlays use the Popover API (top layer) by default, so `z-index` does not order them. Opening order does.
- CDK Menu only calls `preventDefault()` on Escape and closes the menu synchronously, so a host binding on `ui-menu` never runs and the overlay keyboard dispatcher also closes a surrounding dialog. `UiMenu` stops propagation from a listener registered in its constructor (before CDK Menu's).
- CDK Menu closes the menu synchronously inside the item click handler, and a link that is no longer in the page does not follow its `href`. `a[ui-menu-item]` wraps `CdkMenuItem.trigger` to keep the menu open during the click and closes it in a `setTimeout`.
- A directive cannot extend a component (NG0903). The shared base of the dialog and drawer containers is an abstract `@Component({ template: '' })`, because it extends `CdkDialogContainer`.
