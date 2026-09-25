import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  Injector,
  Signal,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { AriaDescriber, FocusMonitor } from '@angular/cdk/a11y';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  OverlayRef,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { UI_TOOLTIP_HOST, UiTooltipHost, resolveDirection } from '@vplans/ui-kit/core';

export type UiTooltipPosition = 'top' | 'bottom' | 'start' | 'end';

const POSITIONS: Record<UiTooltipPosition, ConnectedPosition> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
  start: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' },
  end: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
};

const OPPOSITE: Record<UiTooltipPosition, UiTooltipPosition> = {
  top: 'bottom',
  bottom: 'top',
  start: 'end',
  end: 'start',
};

/**
 * Tooltip bubble. Internal. Hidden from assistive technologies: the host element gets the same
 * text through `aria-describedby`.
 */
@Component({
  selector: 'ui-tooltip-panel',
  template: '{{ message() }}',
  styleUrl: './tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-tooltip',
    '[class]': '"ui-tooltip--" + position()',
    'aria-hidden': 'true',
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class UiTooltipPanel {
  readonly message = signal('');
  readonly position = signal<UiTooltipPosition>('top');
  readonly hovered = signal(false);
  readonly pointerLeft = output<void>();

  protected onMouseLeave(): void {
    this.hovered.set(false);
    this.pointerLeft.emit();
  }
}

/**
 * Tells the host component whether the tooltip is active, kept out of the public `UiTooltip`
 * API. `UiTooltip` sets `active` in its constructor, before any host binding reads it. Internal.
 */
@Injectable()
class UiTooltipHostState implements UiTooltipHost {
  active: Signal<boolean> = signal(false);
}

/**
 * Short description shown on hover and keyboard focus. The text is also exposed to screen readers
 * through `aria-describedby`. Do not put interactive content or essential information in it.
 *
 * Shows after `uiTooltipShowDelay`, stays open while the pointer is over the host or the tooltip
 * (WCAG 1.4.13), and hides on Escape, blur, or when the pointer leaves both.
 * `start`/`end` positions follow the text direction.
 *
 * @example
 * <button ui-icon-button label="Delete" uiTooltip="Delete the plan">
 *   <ui-icon icon="trash" />
 * </button>
 */
@Directive({
  selector: '[uiTooltip]',
  exportAs: 'uiTooltip',
  providers: [UiTooltipHostState, { provide: UI_TOOLTIP_HOST, useExisting: UiTooltipHostState }],
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class UiTooltip {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly describer = inject(AriaDescriber);
  private readonly focusMonitor = inject(FocusMonitor);

  readonly message = input('', { alias: 'uiTooltip' });
  readonly position = input<UiTooltipPosition>('top', { alias: 'uiTooltipPosition' });
  readonly disabled = input(false, { alias: 'uiTooltipDisabled', transform: booleanAttribute });
  /** Milliseconds before the tooltip appears on hover. Keyboard focus shows it at once. */
  readonly showDelay = input(300, { alias: 'uiTooltipShowDelay', transform: numberAttribute });
  /** Milliseconds before the tooltip hides after the pointer leaves. */
  readonly hideDelay = input(100, { alias: 'uiTooltipHideDelay', transform: numberAttribute });

  /** The message to show and describe; empty when disabled or blank. */
  private readonly effectiveMessage = computed(() =>
    this.disabled() ? '' : this.message().trim(),
  );

  private overlayRef: OverlayRef | null = null;
  private positionStrategy: FlexibleConnectedPositionStrategy | null = null;
  private panel: ComponentRef<UiTooltipPanel> | null = null;
  /** Where the tooltip currently sits; differs from `position` when it flipped to fit. */
  private placement: UiTooltipPosition = 'top';
  private hostHovered = false;
  private keyboardFocused = false;
  private showTimer: ReturnType<typeof setTimeout> | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private describedMessage = '';

  constructor() {
    inject(UiTooltipHostState).active = computed(() => !!this.effectiveMessage());

    // Keeps aria-describedby and an open tooltip in sync with the message.
    effect(() => {
      const message = this.effectiveMessage();
      if (message !== this.describedMessage) {
        this.describer.removeDescription(this.host, this.describedMessage);
        if (message) this.describer.describe(this.host, message);
        this.describedMessage = message;
      }
      if (message) this.panel?.instance.message.set(message);
      else this.hide();
    });

    this.focusMonitor.monitor(this.host).subscribe((origin) => {
      this.keyboardFocused = origin === 'keyboard';
      if (this.keyboardFocused) this.show();
      else if (!origin) this.hide();
    });

    inject(DestroyRef).onDestroy(() => {
      this.clearTimers();
      this.focusMonitor.stopMonitoring(this.host);
      this.describer.removeDescription(this.host, this.describedMessage);
      this.overlayRef?.dispose();
    });
  }

  /** Whether the tooltip is currently shown. */
  get isOpen(): boolean {
    return !!this.overlayRef?.hasAttached();
  }

  /** Shows the tooltip immediately. */
  show(): void {
    this.clearTimers();
    if (this.isOpen || !this.describedMessage) return;

    const overlayRef = this.overlayRef ?? this.createOverlay();
    const preferred = this.position();
    this.placement = preferred;
    overlayRef.setDirection(resolveDirection(this.host));
    this.positionStrategy!.withPositions([
      { ...POSITIONS[preferred], panelClass: `ui-tooltip-pane--${preferred}` },
      { ...POSITIONS[OPPOSITE[preferred]], panelClass: `ui-tooltip-pane--${OPPOSITE[preferred]}` },
    ]);

    const panel = overlayRef.attach(new ComponentPortal(UiTooltipPanel, null, this.injector));
    panel.instance.message.set(this.describedMessage);
    panel.instance.position.set(this.placement);
    panel.instance.pointerLeft.subscribe(() => this.scheduleHide());
    panel.changeDetectorRef.detectChanges();
    this.panel = panel;
  }

  /** Hides the tooltip immediately. */
  hide(): void {
    this.clearTimers();
    if (this.overlayRef?.hasAttached()) this.overlayRef.detach();
    this.panel = null;
  }

  protected onMouseEnter(): void {
    this.hostHovered = true;
    clearTimeout(this.hideTimer);
    if (this.isOpen) return;
    clearTimeout(this.showTimer);
    this.showTimer = setTimeout(() => this.show(), this.showDelay());
  }

  protected onMouseLeave(): void {
    this.hostHovered = false;
    this.scheduleHide();
  }

  protected onEscape(event: Event): void {
    if (!this.isOpen) return;
    // Consume Escape only when it closes the tooltip, so a surrounding dialog stays open.
    event.stopPropagation();
    this.hide();
  }

  private scheduleHide(): void {
    this.clearTimers();
    this.hideTimer = setTimeout(() => {
      const keep = this.hostHovered || this.keyboardFocused || this.panel?.instance.hovered();
      if (!keep) this.hide();
    }, this.hideDelay());
  }

  private clearTimers(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
  }

  /** `--ui-tooltip-viewport-margin` in pixels, as CDK needs a number. */
  private viewportMargin(): number {
    const view = this.host.ownerDocument.defaultView;
    if (!view) return 0;
    const value = view.getComputedStyle(this.host).getPropertyValue('--ui-tooltip-viewport-margin');
    const size = parseFloat(value);
    if (Number.isNaN(size)) return 0;
    if (!value.trim().endsWith('rem')) return size;
    return (
      size * parseFloat(view.getComputedStyle(this.host.ownerDocument.documentElement).fontSize)
    );
  }

  private createOverlay(): OverlayRef {
    const strategy = createFlexibleConnectedPositionStrategy(this.injector, this.host)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(this.viewportMargin());
    const overlayRef = createOverlayRef(this.injector, {
      positionStrategy: strategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector, { scrollThrottle: 20 }),
      panelClass: 'ui-tooltip-pane',
    });

    strategy.positionChanges.subscribe(({ connectionPair }) => {
      const placement = String(connectionPair.panelClass).replace('ui-tooltip-pane--', '');
      this.placement = placement as UiTooltipPosition;
      this.panel?.instance.position.set(this.placement);
    });
    // Escape while the tooltip was opened by the pointer and focus is elsewhere.
    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.hide();
      }
    });

    this.positionStrategy = strategy;
    this.overlayRef = overlayRef;
    return overlayRef;
  }
}
