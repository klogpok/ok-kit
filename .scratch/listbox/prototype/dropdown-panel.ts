import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
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

export type UiDropdownOrigin = CdkOverlayOrigin | ElementRef<HTMLElement> | HTMLElement;

/**
 * PROTOTYPE. Owns the lifecycle of a dropdown panel: `<ng-template [uiDropdownPanel]="origin"
 * [open]="open()" (closed)="open.set(false)">`. CdkConnectedOverlay is a host directive with no
 * exposed inputs/outputs; this directive drives it through its public API.
 */
@Directive({
  selector: 'ng-template[uiDropdownPanel]',
  hostDirectives: [CdkConnectedOverlay],
})
export class UiDropdownPanel {
  readonly origin = input.required<UiDropdownOrigin>({ alias: 'uiDropdownPanel' });
  readonly open = input(false, { transform: booleanAttribute });
  readonly closed = output<void>();

  private readonly overlay = inject(CdkConnectedOverlay);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const overlay = this.overlay;
    overlay.positions = [...UI_DROPDOWN_POSITIONS];
    // The host of a directive on <ng-template> is a comment node: the field host is the origin.
    overlay.attach.subscribe(() =>
      syncOverlayDirection(overlay.overlayRef, this.originElement()),
    );
    // Escape (CDK detaches itself) or disposal while the consumer still thinks it is open.
    overlay.detach.subscribe(() => {
      if (this.open()) this.closed.emit();
    });
    // CDK already drops clicks on the origin element (_getOriginElement) before emitting.
    overlay.overlayOutsideClick.subscribe(() => this.closed.emit());

    effect(() => {
      const origin = this.origin();
      const open = this.open();
      untracked(() => {
        // Programmatic assignment does not call CdkConnectedOverlay.ngOnChanges, so `open = true`
        // alone does nothing: call attachOverlay()/detachOverlay() instead.
        overlay.origin = origin;
        if (!open) {
          overlay.detachOverlay();
          return;
        }
        const minWidth = this.originElement().getBoundingClientRect().width;
        overlay.minWidth = minWidth;
        // The offsetX setter re-applies origin + positions to an existing position strategy.
        overlay.offsetX = overlayOffsetX(this.document);
        overlay.overlayRef?.updateSize({ minWidth });
        overlay.attachOverlay();
      });
    });
  }

  private originElement(): HTMLElement {
    const origin = this.origin();
    if (origin instanceof CdkOverlayOrigin) return origin.elementRef.nativeElement;
    return origin instanceof ElementRef ? origin.nativeElement : origin;
  }
}
