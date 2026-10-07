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
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { overlayOffsetX, resolveDirection } from '@vplans/ui-kit/core';

export type UiPopoverPosition = 'top' | 'bottom' | 'start' | 'end';

/** Context of the popover template: `let-close="close"`. */
export interface UiPopoverContext {
  /** Closes the popover and returns focus to the trigger. */
  close: () => void;
}

const POSITIONS: Record<UiPopoverPosition, ConnectedPosition> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
  start: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' },
  end: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
};

const OPPOSITE: Record<UiPopoverPosition, UiPopoverPosition> = {
  top: 'bottom',
  bottom: 'top',
  start: 'end',
  end: 'start',
};

const TABBABLE = 'button, [href], input, select, textarea, [tabindex]';

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
  private positionStrategy: FlexibleConnectedPositionStrategy | null = null;
  private panel: ComponentRef<UiPopoverPanel> | null = null;

  constructor() {
    // The popover is named by the trigger unless it has a label.
    if (!this.host.id) this.host.id = this.ids.getId('ui-popover-trigger-');
    inject(DestroyRef).onDestroy(() => this.overlayRef?.dispose());
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  open(): void {
    if (this.isOpen() || this.disabled()) return;
    const overlayRef = this.overlayRef ?? this.createOverlay();
    const preferred = this.position();
    // The CDK reads the direction once; follow runtime `dir` changes.
    overlayRef.setDirection(resolveDirection(this.host));
    this.positionStrategy!.withDefaultOffsetX(overlayOffsetX(this.host.ownerDocument));
    this.positionStrategy!.withViewportMargin(this.viewportMargin());
    this.positionStrategy!.withPositions([
      { ...POSITIONS[preferred], panelClass: `ui-popover-pane--${preferred}` },
      {
        ...POSITIONS[OPPOSITE[preferred]],
        panelClass: `ui-popover-pane--${OPPOSITE[preferred]}`,
      },
    ]);

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
    const strategy = createFlexibleConnectedPositionStrategy(this.injector, this.host)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(this.viewportMargin());
    const overlayRef = createOverlayRef(this.injector, {
      positionStrategy: strategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector),
      panelClass: 'ui-popover-pane',
    });

    strategy.positionChanges.subscribe(({ connectionPair }) => {
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
