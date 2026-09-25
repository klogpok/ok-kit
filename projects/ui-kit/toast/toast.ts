import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  Injector,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { OverlayRef, createGlobalPositionStrategy, createOverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UI_LABELS, resolveDirection } from '@vplans/ui-kit/core';
import {
  UiIcon,
  UiIconDefinition,
  uiIconAlertCircle,
  uiIconAlertTriangle,
  uiIconCheckCircle,
  uiIconInfo,
  uiIconX,
} from '@vplans/ui-kit/icon';
import { Observable, Subject } from 'rxjs';

export type UiToastTone = 'info' | 'success' | 'warning' | 'danger';

export type UiToastPosition =
  'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';

export interface UiToastOptions {
  message: string;
  title?: string;
  tone?: UiToastTone;
  /** Milliseconds until the toast hides. `0` keeps it until dismissed. Defaults to the config. */
  duration?: number;
  /**
   * Label of an action button. Toasts are hard to reach by keyboard, so the action must also be
   * available elsewhere (e.g. "Undo" next to the deleted row).
   */
  action?: string;
  /** Show the close button. Defaults to `true`. */
  dismissible?: boolean;
}

export interface UiToastConfig {
  position: UiToastPosition;
  /** Default duration in milliseconds. */
  duration: number;
  /** Maximum visible toasts; the oldest one is dismissed when a new one exceeds it. */
  max: number;
}

const DEFAULT_CONFIG: UiToastConfig = { position: 'bottom-end', duration: 5000, max: 3 };

export const UI_TOAST_CONFIG = new InjectionToken<UiToastConfig>('UiToastConfig', {
  providedIn: 'root',
  factory: () => DEFAULT_CONFIG,
});

/** Changes the toast defaults. */
export function provideUiToast(config: Partial<UiToastConfig>): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: UI_TOAST_CONFIG, useValue: { ...DEFAULT_CONFIG, ...config } },
  ]);
}

/** Why a toast was dismissed. */
export type UiToastDismissReason = 'timeout' | 'close' | 'action' | 'programmatic' | 'overflow';

/** Handle of a shown toast. */
export class UiToastRef {
  private readonly dismissed = new Subject<UiToastDismissReason>();
  private readonly actions = new Subject<void>();

  /** Emits once, when the toast is dismissed, then completes. */
  readonly afterDismissed: Observable<UiToastDismissReason> = this.dismissed.asObservable();
  /** Emits when the action button is clicked. The toast is dismissed right after. */
  readonly onAction: Observable<void> = this.actions.asObservable();

  constructor(
    readonly id: number,
    private readonly remove: (ref: UiToastRef, reason: UiToastDismissReason) => void,
  ) {}

  dismiss(): void {
    this.remove(this, 'programmatic');
  }

  /** @internal */
  _triggerAction(): void {
    this.actions.next();
    this.actions.complete();
    this.remove(this, 'action');
  }

  /** @internal */
  _finish(reason: UiToastDismissReason): void {
    this.dismissed.next(reason);
    this.dismissed.complete();
    this.actions.complete();
  }
}

/** A toast as rendered by the container. */
export interface UiToastItem {
  readonly ref: UiToastRef;
  readonly message: string;
  readonly title: string;
  readonly tone: UiToastTone;
  readonly action: string;
  readonly dismissible: boolean;
  readonly duration: number;
}

interface Timer {
  handle?: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
}

const ICONS: Record<UiToastTone, UiIconDefinition> = {
  info: uiIconInfo,
  success: uiIconCheckCircle,
  warning: uiIconAlertTriangle,
  danger: uiIconAlertCircle,
};

/** Stack of toasts. Internal: rendered by `UiToast` in an overlay. */
@Component({
  selector: 'ui-toast-container',
  imports: [UiIcon, UiButton, UiIconButton],
  template: `
    @for (toast of toasts.active(); track toast.ref.id) {
      <div class="ui-toast" [class]="'ui-toast--' + toast.tone">
        <ui-icon class="ui-toast__icon" size="md" [icon]="icons[toast.tone]" />
        <div class="ui-toast__body">
          @if (toast.title) {
            <div class="ui-toast__title">{{ toast.title }}</div>
          }
          <div class="ui-toast__message">{{ toast.message }}</div>
        </div>
        @if (toast.action) {
          <button ui-button variant="ghost" size="sm" (click)="toast.ref._triggerAction()">
            {{ toast.action }}
          </button>
        }
        @if (toast.dismissible) {
          <button
            ui-icon-button
            variant="ghost"
            size="sm"
            class="ui-toast__close"
            [label]="labels.close"
            (click)="toasts.close(toast.ref)"
          >
            <ui-icon [icon]="closeIcon" />
          </button>
        }
      </div>
    }
  `,
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-toast-container',
    role: 'region',
    '[class]': '"ui-toast-container--" + position',
    '[attr.aria-label]': 'labels.notifications',
    '(mouseenter)': 'toasts.pause("pointer")',
    '(mouseleave)': 'toasts.resume("pointer")',
    '(focusin)': 'toasts.pause("focus")',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiToastContainer {
  protected readonly toasts = inject(UiToast);
  protected readonly labels = inject(UI_LABELS);
  protected readonly position = inject(UI_TOAST_CONFIG).position;
  protected readonly icons = ICONS;
  protected readonly closeIcon = uiIconX;

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) this.toasts.resume('focus');
  }
}

/**
 * Shows brief, non-modal notifications. Messages are announced to screen readers through the CDK
 * `LiveAnnouncer` (`danger` assertively, others politely). Timers pause while the pointer or
 * focus is on a toast (WCAG 2.2.1).
 *
 * @example
 * this.toast.success('The plan was sent to the owner');
 * this.toast.show({ message: 'Plan deleted', action: 'Undo' }).onAction.subscribe(() => restore());
 */
@Injectable({ providedIn: 'root' })
export class UiToast {
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly config = inject(UI_TOAST_CONFIG);

  private readonly items = signal<readonly UiToastItem[]>([]);
  private readonly timers = new Map<UiToastRef, Timer>();
  private readonly pausedBy = new Set<'pointer' | 'focus'>();
  private overlayRef: OverlayRef | null = null;
  private nextId = 0;

  /** Toasts currently shown, oldest first. */
  readonly active = this.items.asReadonly();

  show(options: UiToastOptions | string): UiToastRef {
    const opts = typeof options === 'string' ? { message: options } : options;
    const ref = new UiToastRef(this.nextId++, (r, reason) => this.remove(r, reason));
    const item: UiToastItem = {
      ref,
      message: opts.message,
      title: opts.title ?? '',
      tone: opts.tone ?? 'info',
      action: opts.action ?? '',
      dismissible: opts.dismissible ?? true,
      duration: opts.duration ?? this.config.duration,
    };

    const overflow = this.items().length + 1 - this.config.max;
    this.items()
      .slice(0, Math.max(overflow, 0))
      .forEach((old) => this.remove(old.ref, 'overflow'));
    this.items.update((items) => [...items, item]);
    this.timers.set(ref, { remaining: item.duration, startedAt: 0 });
    if (!this.pausedBy.size) this.startTimer(ref);

    this.attach();
    const text = item.title ? `${item.title}. ${item.message}` : item.message;
    void this.announcer.announce(text, item.tone === 'danger' ? 'assertive' : 'polite');
    return ref;
  }

  info(message: string, options?: Partial<UiToastOptions>): UiToastRef {
    return this.show({ ...options, message, tone: 'info' });
  }

  success(message: string, options?: Partial<UiToastOptions>): UiToastRef {
    return this.show({ ...options, message, tone: 'success' });
  }

  warning(message: string, options?: Partial<UiToastOptions>): UiToastRef {
    return this.show({ ...options, message, tone: 'warning' });
  }

  error(message: string, options?: Partial<UiToastOptions>): UiToastRef {
    return this.show({ ...options, message, tone: 'danger' });
  }

  dismissAll(): void {
    this.items().forEach((item) => this.remove(item.ref, 'programmatic'));
  }

  /** @internal Close button. */
  close(ref: UiToastRef): void {
    this.remove(ref, 'close');
  }

  /** @internal Pauses all timers while the pointer or focus is on the stack. */
  pause(source: 'pointer' | 'focus'): void {
    if (!this.pausedBy.size) {
      for (const timer of this.timers.values()) {
        clearTimeout(timer.handle);
        if (timer.handle !== undefined) timer.remaining -= Date.now() - timer.startedAt;
        timer.handle = undefined;
      }
    }
    this.pausedBy.add(source);
  }

  /** @internal */
  resume(source: 'pointer' | 'focus'): void {
    this.pausedBy.delete(source);
    if (!this.pausedBy.size) this.timers.forEach((_, ref) => this.startTimer(ref));
  }

  private startTimer(ref: UiToastRef): void {
    const timer = this.timers.get(ref);
    if (!timer || timer.remaining <= 0 || timer.handle !== undefined) return;
    const item = this.items().find((i) => i.ref === ref);
    if (!item?.duration) return;
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.remove(ref, 'timeout'), timer.remaining);
  }

  private remove(ref: UiToastRef, reason: UiToastDismissReason): void {
    if (!this.items().some((item) => item.ref === ref)) return;
    clearTimeout(this.timers.get(ref)?.handle);
    this.timers.delete(ref);
    this.items.update((items) => items.filter((item) => item.ref !== ref));
    if (!this.items().length) {
      this.overlayRef?.detach();
      // The stack is gone, so nothing can hold the pause any more.
      this.pausedBy.clear();
    }
    ref._finish(reason);
  }

  private attach(): void {
    const overlayRef = (this.overlayRef ??= this.createOverlay());
    overlayRef.setDirection(resolveDirection(this.document.documentElement));
    if (!overlayRef.hasAttached()) {
      overlayRef.attach(new ComponentPortal(UiToastContainer, null, this.injector));
    } else {
      this.raise(overlayRef.hostElement);
    }
    overlayRef.updatePosition();
  }

  /** Moves the stack above overlays opened after it (e.g. a dialog) in the top layer. */
  private raise(host: HTMLElement): void {
    if (host.hasAttribute('popover') && host.matches(':popover-open')) {
      host.hidePopover();
      host.showPopover();
    }
  }

  private createOverlay(): OverlayRef {
    const [vertical, horizontal] = this.config.position.split('-');
    const strategy = createGlobalPositionStrategy(this.injector);
    if (vertical === 'top') strategy.top('0');
    else strategy.bottom('0');
    if (horizontal === 'start') strategy.start('0');
    else if (horizontal === 'end') strategy.end('0');
    else strategy.centerHorizontally();
    return createOverlayRef(this.injector, {
      positionStrategy: strategy,
      panelClass: 'ui-toast-pane',
    });
  }
}
