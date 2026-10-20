import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FocusMonitor, InteractivityChecker, _IdGenerator } from '@angular/cdk/a11y';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  OverlayRef,
  PositionStrategy,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import {
  UiOverlaySide,
  overlayOffsetX,
  sideOverlayPositions,
  syncOverlayDirection,
  ɵpushOnScreen as pushOnScreen,
} from '@vplans/ui-kit/core';

export type UiPopoverPosition = UiOverlaySide;

/** Context of the popover template: `let-close="close"`. */
export interface UiPopoverContext {
  /** Closes the popover and returns focus to the trigger. */
  close: () => void;
}

const TABBABLE = 'button, [href], input, select, textarea, [tabindex]';

/**
 * The CDK pushes an overlay back on screen against the viewport from x=0 and against its width
 * without the start margin, so a pushed popover sits under a left page scrollbar (an RTL document
 * in an iframe) or touches an edge. This strategy wraps the CDK one with its push off, delegates
 * to it, and pushes the applied position itself, measured from where the visible viewport starts.
 */
class UiPopoverPositionStrategy implements PositionStrategy {
  /** The wrapped CDK strategy, for its `positionChanges`. Configure it through `configure()`. */
  readonly connected: FlexibleConnectedPositionStrategy;
  private overlayRef: OverlayRef | null = null;
  private margin = 0;
  private offsetX = 0;
  private resize = Subscription.EMPTY;

  constructor(
    origin: HTMLElement,
    private readonly injector: Injector,
  ) {
    this.connected = createFlexibleConnectedPositionStrategy(injector, origin)
      .withFlexibleDimensions(false)
      .withPush(false);
  }

  /**
   * Sets the positions, the viewport margin and `overlayOffsetX()` (the visible viewport starts
   * after a page scrollbar on the left). Read them each time the popover opens.
   */
  configure(positions: ConnectedPosition[], margin: number, offsetX: number): void {
    this.margin = margin;
    this.offsetX = offsetX;
    this.connected.withPositions(positions).withViewportMargin(margin).withDefaultOffsetX(offsetX);
  }

  attach(overlayRef: OverlayRef): void {
    this.connected.attach(overlayRef);
    this.overlayRef = overlayRef;
    // On a window resize the CDK strategy applies itself, not through apply() here. Subscribed
    // after it, so the push runs after its position.
    this.resize.unsubscribe();
    this.resize = this.injector
      .get(ViewportRuler)
      .change()
      .subscribe(() => this.push());
  }

  apply(): void {
    this.connected.apply();
    this.push();
  }

  detach(): void {
    this.resize.unsubscribe();
    this.connected.detach();
  }

  dispose(): void {
    this.resize.unsubscribe();
    this.connected.dispose();
    this.overlayRef = null;
  }

  private push(): void {
    const pane = this.overlayRef?.overlayElement;
    if (!this.overlayRef || !pane?.isConnected) return;
    const start = -this.offsetX;
    const root = pane.ownerDocument.documentElement;
    // Like the CDK's fit test: the size rounded down (the viewport size is whole), the position
    // as it is, so a pushed edge lands exactly on the margin.
    const rect = pane.getBoundingClientRect();
    const left = rect.left - start;
    const { x, y } = pushOnScreen(
      {
        left,
        top: rect.top,
        right: left + Math.floor(rect.width),
        bottom: rect.top + Math.floor(rect.height),
      },
      { width: root.clientWidth, height: root.clientHeight },
      this.margin,
      this.overlayRef.getDirection(),
    );
    // The CDK resets the transform (it holds the offsets) on every apply.
    if (x || y) pane.style.transform = `${pane.style.transform} translate(${x}px, ${y}px)`.trim();
  }
}

/** Popover surface. Internal: rendered by `[uiPopoverTriggerFor]` in an overlay. */
@Component({
  selector: 'ui-popover-panel',
  imports: [NgTemplateOutlet],
  template: `<ng-container
    [ngTemplateOutlet]="template()"
    [ngTemplateOutletContext]="context()"
  />`,
  styleUrl: './popover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-popover',
    role: 'dialog',
    tabindex: '-1',
    '[class]': '"ui-popover--" + position()',
    '[id]': 'id()',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-labelledby]': 'label() ? null : labelledBy()',
  },
})
export class UiPopoverPanel {
  readonly template = signal<TemplateRef<UiPopoverContext> | null>(null);
  readonly context = signal<UiPopoverContext | null>(null);
  readonly position = signal<UiPopoverPosition>('bottom');
  readonly id = signal('');
  readonly label = signal('');
  readonly labelledBy = signal<string | null>(null);
}

/**
 * Opens a non-modal popover with rich content (filters, a short form, details) from a button.
 * Put the content in an `ng-template`; it is created when the popover opens.
 *
 * - The popover is a non-modal `dialog`, named by the trigger's text or by `uiPopoverLabel`.
 *   The trigger gets `aria-haspopup`, `aria-expanded` and `aria-controls`.
 * - On open, focus moves to `[cdkFocusInitial]`, else the first focusable element, else the
 *   popover itself.
 * - Escape, a click outside or the template's `close()` closes it and returns focus to the
 *   trigger. Tabbing out of it closes it too. Escape does not close a surrounding dialog.
 * - `start`/`end` positions follow the text direction; the popover flips when it does not fit.
 *
 * @example
 * <button ui-button variant="secondary" [uiPopoverTriggerFor]="filters">Filters</button>
 * <ng-template #filters let-close="close">
 *   <ui-checkbox>Only mine</ui-checkbox>
 *   <button ui-button size="sm" (click)="apply(); close()">Apply</button>
 * </ng-template>
 */
@Directive({
  selector: '[uiPopoverTriggerFor]',
  exportAs: 'uiPopoverTrigger',
  host: {
    class: 'ui-popover-trigger',
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-controls]': 'isOpen() ? panelId : null',
    '(click)': 'toggle()',
  },
})
export class UiPopoverTrigger {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly checker = inject(InteractivityChecker);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly ids = inject(_IdGenerator);

  readonly template = input.required<TemplateRef<UiPopoverContext>>({
    alias: 'uiPopoverTriggerFor',
  });
  readonly position = input<UiPopoverPosition>('bottom', { alias: 'uiPopoverPosition' });
  /** Accessible name of the popover. Defaults to the trigger's text (`aria-labelledby`). */
  readonly label = input('', { alias: 'uiPopoverLabel' });
  readonly disabled = input(false, { alias: 'uiPopoverDisabled', transform: booleanAttribute });

  readonly opened = output();
  readonly closed = output();

  readonly isOpen = signal(false);
  protected readonly panelId = this.ids.getId('ui-popover-');

  private overlayRef: OverlayRef | null = null;
  private positionStrategy: UiPopoverPositionStrategy | null = null;
  private panel: ComponentRef<UiPopoverPanel> | null = null;

  constructor() {
    // The popover is named by the trigger unless it has a label.
    if (!this.host.id) this.host.id = this.ids.getId('ui-popover-trigger-');
    inject(DestroyRef).onDestroy(() => {
      // The trigger is gone: dispose silently, `closed` is already destroyed (NG0953).
      this.isOpen.set(false);
      this.overlayRef?.dispose();
    });
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  open(): void {
    if (this.isOpen() || this.disabled()) return;
    const overlayRef = this.overlayRef ?? this.createOverlay();
    const preferred = this.position();
    syncOverlayDirection(overlayRef, this.host);
    const margin = this.viewportMargin();
    this.positionStrategy!.configure(
      sideOverlayPositions(preferred, 'ui-popover-pane'),
      margin,
      overlayOffsetX(this.host.ownerDocument),
    );
    // The pane spans the overlay container, which ends at the page scrollbar (viewport units run
    // under it). A percentage on the panel would be resolved against a pane sized by its content.
    overlayRef.updateSize({ maxWidth: `calc(100% - ${margin * 2}px)` });

    const panel = overlayRef.attach(new ComponentPortal(UiPopoverPanel, null, this.injector));
    const instance = panel.instance;
    instance.template.set(this.template());
    instance.context.set({ close: () => this.close() });
    instance.position.set(preferred);
    instance.id.set(this.panelId);
    instance.label.set(this.label());
    instance.labelledBy.set(this.host.id);
    panel.changeDetectorRef.detectChanges();
    this.panel = panel;
    this.isOpen.set(true);
    this.opened.emit();

    const element = panel.location.nativeElement as HTMLElement;
    element.addEventListener('keydown', (event) => this.onPanelKeydown(event));
    element.addEventListener('focusout', (event) => this.onPanelFocusOut(event));
    afterNextRender({ write: () => this.focusInitial(element) }, { injector: this.injector });
  }

  /** Closes the popover. Focus returns to the trigger when it was inside the popover. */
  close(): void {
    if (!this.isOpen()) return;
    const element = this.panel?.location.nativeElement as HTMLElement | undefined;
    const active = this.document.activeElement;
    const focusInside = !active || active === this.document.body || !!element?.contains(active);
    this.overlayRef?.detach();
    if (focusInside) this.focusMonitor.focusVia(this.host, 'program');
  }

  private onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    // Close only the popover, not a surrounding dialog.
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  /** Tabbing out of the popover closes it; focus stays where it went. */
  private onPanelFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const element = this.panel?.location.nativeElement as HTMLElement | undefined;
    if (!next || !element || element.contains(next) || this.host.contains(next)) return;
    // A nested overlay (a select list, a menu) opened from the popover is not "outside".
    if (next instanceof Element && next.closest('.cdk-overlay-pane')) return;
    this.overlayRef?.detach();
  }

  private focusInitial(element: HTMLElement): void {
    if (!element.isConnected) return;
    const initial = element.querySelector<HTMLElement>('[cdkFocusInitial]');
    const target =
      (initial && this.checker.isFocusable(initial) ? initial : null) ??
      [...element.querySelectorAll<HTMLElement>(TABBABLE)].find((el) =>
        this.checker.isTabbable(el),
      ) ??
      element;
    target.focus();
  }

  /** `--ui-popover-viewport-margin` in pixels, as CDK needs a number. */
  private viewportMargin(): number {
    const view = this.document.defaultView;
    if (!view) return 0;
    const value = view.getComputedStyle(this.host).getPropertyValue('--ui-popover-viewport-margin');
    const size = parseFloat(value);
    if (Number.isNaN(size)) return 0;
    if (!value.trim().endsWith('rem')) return size;
    return size * parseFloat(view.getComputedStyle(this.document.documentElement).fontSize);
  }

  private createOverlay(): OverlayRef {
    const strategy = new UiPopoverPositionStrategy(this.host, this.injector);
    const overlayRef = createOverlayRef(this.injector, {
      positionStrategy: strategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector),
      panelClass: 'ui-popover-pane',
    });

    strategy.connected.positionChanges.subscribe(({ connectionPair }) => {
      const placement = String(connectionPair.panelClass).replace('ui-popover-pane--', '');
      this.panel?.instance.position.set(placement as UiPopoverPosition);
      this.panel?.changeDetectorRef.markForCheck();
    });
    // Escape while focus is outside the popover (e.g. still on the trigger).
    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      }
    });
    overlayRef.outsidePointerEvents().subscribe((event) => {
      // The trigger's own click toggles the popover.
      if (!this.host.contains(event.target as Node)) this.close();
    });
    // Every way of closing ends here.
    overlayRef.detachments().subscribe(() => {
      if (!this.isOpen()) return;
      this.panel = null;
      this.isOpen.set(false);
      this.closed.emit();
    });

    this.positionStrategy = strategy;
    this.overlayRef = overlayRef;
    return overlayRef;
  }
}
