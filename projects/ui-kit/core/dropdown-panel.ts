import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
  type OverlayRef,
} from '@angular/cdk/overlay';
import {
  DOCUMENT,
  Directive,
  ElementRef,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { overlayOffsetX } from './direction';
import { UI_DROPDOWN_POSITIONS, syncOverlayDirection } from './overlay';

/** An element given as itself or as a reference to it. */
export type UiDropdownElement = HTMLElement | ElementRef<HTMLElement>;

/** What a dropdown panel opens from: usually the field box marked with `cdkOverlayOrigin`. */
export type UiDropdownOrigin = CdkOverlayOrigin | UiDropdownElement;

/**
 * Dropdown panel of a field: a connected overlay that opens below the origin and owns its
 * lifecycle. It reads the direction, the container offset and the origin width each time it
 * opens, closes on Escape and on a click outside the origin, and can return focus.
 *
 * ```html
 * <ng-template [uiDropdownPanel]="origin" [open]="isOpen()" (closed)="close()">…</ng-template>
 * ```
 *
 * `closed` asks the field to close (Escape, a click outside); the panel stays open until `open`
 * turns false. With `returnFocusTo`, focus that is inside the panel when it closes (or was lost
 * with it) moves to that element. A panel whose focus stays in the field leaves it unset.
 *
 * `CdkConnectedOverlay` is a host directive without exposed inputs, driven through its instance:
 * assigning its inputs does not run its `ngOnChanges`. The `offsetX` setter is what re-applies the
 * origin and the positions to an existing overlay (CDK 20 behavior, guarded by the spec).
 */
@Directive({
  selector: 'ng-template[uiDropdownPanel]',
  hostDirectives: [CdkConnectedOverlay],
})
export class UiDropdownPanel {
  readonly origin = input.required<UiDropdownOrigin>({ alias: 'uiDropdownPanel' });
  readonly open = input(false, { transform: booleanAttribute });
  /** Read when the panel opens. */
  readonly positions = input<readonly ConnectedPosition[]>(UI_DROPDOWN_POSITIONS);
  /** Make the panel at least as wide as the origin. Off for a panel with its own width. */
  readonly matchWidth = input(true, { transform: booleanAttribute });
  readonly returnFocusTo = input<UiDropdownElement | null | undefined>(null);
  /** The panel content is in the page (focus it from here, e.g. in `afterNextRender`). */
  readonly attached = output();
  /** The user dismissed the panel: set `open` to false. */
  readonly closed = output();

  private readonly overlay = inject(CdkConnectedOverlay);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const overlay = this.overlay;
    overlay.attach.subscribe(() => {
      // The host of a directive on <ng-template> is a comment node: read the origin's direction.
      syncOverlayDirection(overlay.overlayRef, this.originElement());
      this.attached.emit();
    });
    // Escape: the CDK has already detached the panel, so focus that was in it is lost (on body).
    // `open` is false when the directive detached the panel itself: nothing to report then.
    overlay.detach.subscribe(() => {
      if (!this.open()) return;
      const focusLost = this.focusLost();
      this.closed.emit();
      if (focusLost) this.returnFocus();
    });
    // The CDK leaves out clicks on the origin element before it emits.
    overlay.overlayOutsideClick.subscribe(() => this.closed.emit());

    effect(() => {
      const origin = this.origin();
      const open = this.open();
      untracked(() => (open ? this.attach(origin) : this.detach()));
    });
  }

  private attach(origin: UiDropdownOrigin): void {
    const overlay = this.overlay;
    // Assign the origin and the positions before offsetX: its setter applies all three.
    overlay.origin = origin;
    overlay.positions = [...this.positions()];
    overlay.offsetX = overlayOffsetX(this.document);
    if (this.matchWidth()) {
      const minWidth = this.originElement().getBoundingClientRect().width;
      // Read when the overlay is created; an existing one needs updateSize().
      overlay.minWidth = minWidth;
      this.overlayRef()?.updateSize({ minWidth });
    }
    overlay.attachOverlay();
  }

  private detach(): void {
    const overlayRef = this.overlayRef();
    if (!overlayRef?.hasAttached()) return;
    const active = this.document.activeElement;
    const focusInside = this.focusLost() || overlayRef.overlayElement.contains(active);
    this.overlay.detachOverlay();
    if (focusInside) this.returnFocus();
  }

  /** Typed as always set, but undefined until the panel first opens. */
  private overlayRef(): OverlayRef | undefined {
    return this.overlay.overlayRef;
  }

  private focusLost(): boolean {
    const active = this.document.activeElement;
    return !active || active === this.document.body;
  }

  private returnFocus(): void {
    const target = this.returnFocusTo();
    (target instanceof ElementRef ? target.nativeElement : target)?.focus();
  }

  private originElement(): HTMLElement {
    const origin = this.origin();
    if (origin instanceof CdkOverlayOrigin) return origin.elementRef.nativeElement as HTMLElement;
    return origin instanceof ElementRef ? origin.nativeElement : origin;
  }
}
