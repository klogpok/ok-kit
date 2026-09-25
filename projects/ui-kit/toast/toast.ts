import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  Injector,
  afterNextRender,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
import { InputModalityDetector, LiveAnnouncer } from '@angular/cdk/a11y';
import { OverlayRef, createGlobalPositionStrategy, createOverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { _CdkPrivateStyleLoader, _VisuallyHiddenLoader } from '@angular/cdk/private';
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

/** What a ref keeps out of its public API. */
interface UiToastRefState {
  readonly dismissed: Subject<UiToastDismissReason>;
  readonly actions: Subject<void>;
  readonly remove: (reason: UiToastDismissReason) => void;
}

const refStates = new WeakMap<UiToastRef, UiToastRefState>();

/** Handle of a shown toast. Created by `UiToast`. */
export class UiToastRef {
  /** Emits once, when the toast is dismissed, then completes. */
  readonly afterDismissed: Observable<UiToastDismissReason>;
  /** Emits when the action button is clicked. The toast is dismissed right after. */
  readonly onAction: Observable<void>;

  constructor(
    readonly id: number,
    remove: (ref: UiToastRef, reason: UiToastDismissReason) => void,
  ) {
    const state: UiToastRefState = {
      dismissed: new Subject(),
      actions: new Subject(),
      remove: (reason) => remove(this, reason),
    };
    refStates.set(this, state);
    this.afterDismissed = state.dismissed.asObservable();
    this.onAction = state.actions.asObservable();
  }

  dismiss(): void {
    refStates.get(this)?.remove('programmatic');
  }
}

function triggerAction(ref: UiToastRef): void {
  const state = refStates.get(ref);
  if (!state) return;
  state.actions.next();
  state.actions.complete();
  state.remove('action');
}

function finish(ref: UiToastRef, reason: UiToastDismissReason): void {
  const state = refStates.get(ref);
  if (!state) return;
  state.dismissed.next(reason);
  state.dismissed.complete();
  state.actions.complete();
}

/** Links between the stack and its container, kept out of the public `UiToast` API. */
interface UiToastControl {
  close(ref: UiToastRef): void;
  pause(source: 'pointer' | 'focus'): void;
  resume(source: 'pointer' | 'focus'): void;
  /** Set by the container: called before a toast leaves the DOM, for any reason. */
  beforeRemove?: (ref: UiToastRef) => void;
}

const UI_TOAST_CONTROL = new InjectionToken<UiToastControl>('UiToastControl');

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
      <div class="ui-toast" [class]="'ui-toast--' + toast.tone" [attr.data-toast-id]="toast.ref.id">
        <span class="ui-toast__icon"><ui-icon size="md" [icon]="icons[toast.tone]" /></span>
        <div class="ui-toast__body">
          @if (toast.title) {
            <div class="ui-toast__title" dir="auto">{{ toast.title }}</div>
          }
          <div class="ui-toast__message" dir="auto">{{ toast.message }}</div>
        </div>
        @if (toast.action || toast.dismissible) {
          <div class="ui-toast__actions">
            @if (toast.action) {
              <button
                ui-button
                variant="ghost"
                size="sm"
                class="ui-toast__action"
                (click)="triggerAction(toast)"
              >
                {{ toast.action }}
              </button>
            }
            @if (toast.dismissible) {
              <button
                ui-icon-button
                variant="ghost"
                size="sm"
                class="ui-toast__close"
                [label]="labels().close"
                (click)="control.close(toast.ref)"
              >
                <ui-icon size="sm" [icon]="closeIcon" />
              </button>
            }
          </div>
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
    '[attr.aria-label]': 'labels().notifications',
    '(mouseenter)': 'control.pause("pointer")',
    '(mouseleave)': 'control.resume("pointer")',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiToastContainer {
  protected readonly toasts = inject(UiToast);
  protected readonly control = inject(UI_TOAST_CONTROL);
  protected readonly labels = inject(UI_LABELS);
  protected readonly position = inject(UI_TOAST_CONFIG).position;
  protected readonly icons = ICONS;
  protected readonly closeIcon = uiIconX;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly modality = inject(InputModalityDetector);
  private readonly injector = inject(Injector);
  /** Where focus came from when it entered the stack. */
  private returnTo: HTMLElement | null = null;

  constructor() {
    this.control.beforeRemove = (ref) => this.keepFocus(ref);
    inject(DestroyRef).onDestroy(() => (this.control.beforeRemove = undefined));
  }

  protected onFocusIn(event: FocusEvent): void {
    const from = event.relatedTarget;
    if (from instanceof HTMLElement && !this.host.contains(from)) this.returnTo = from;
    this.control.pause('focus');
  }

  protected triggerAction(toast: UiToastItem): void {
    triggerAction(toast.ref);
  }

  /**
   * Keeps keyboard focus when the focused toast goes away (closed, dropped beyond the maximum or
   * dismissed in code): it moves to the neighbouring toast, or back to where it came from when
   * this was the last one. After a mouse or touch close, focus just leaves the stack, so the
   * other toasts do not stay paused.
   */
  private keepFocus(ref: UiToastRef): void {
    const toast = this.host.querySelector<HTMLElement>(`[data-toast-id="${ref.id}"]`);
    const active = this.document.activeElement;
    if (!toast || !(active instanceof HTMLElement) || !toast.contains(active)) return;
    const pointer = this.modality.mostRecentModality;
    if (pointer === 'mouse' || pointer === 'touch') {
      active.blur();
      return;
    }
    // The next toast, else the previous one, among those that stay (dismissAll removes in turn).
    const staying = new Set(this.toasts.active().map((item) => item.ref.id));
    staying.delete(ref.id);
    const all = [...this.host.querySelectorAll<HTMLElement>('.ui-toast')];
    const index = all.indexOf(toast);
    const sibling = [...all.slice(index + 1), ...all.slice(0, index).reverse()].find((el) =>
      staying.has(Number(el.dataset['toastId'])),
    );
    const target =
      sibling?.querySelector<HTMLElement>('.ui-toast__close') ??
      sibling?.querySelector<HTMLElement>('button') ??
      (this.returnTo?.isConnected ? this.returnTo : null);
    if (!target) {
      active.blur();
      return;
    }
    target.focus();
    // Rendering the new list may move the target's toast in the DOM, which drops focus.
    afterNextRender(
      () => {
        const now = this.document.activeElement;
        if (target.isConnected && (!now || now === this.document.body)) target.focus();
      },
      { injector: this.injector },
    );
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) this.control.resume('focus');
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

  constructor() {
    // The announcer element relies on `.cdk-visually-hidden`, which CDK only loads with FocusTrap.
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
  }

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

  private readonly control: UiToastControl = {
    close: (ref) => this.remove(ref, 'close'),
    pause: (source) => this.pause(source),
    resume: (source) => this.resume(source),
  };

  /** Pauses all timers while the pointer or focus is on the stack. */
  private pause(source: 'pointer' | 'focus'): void {
    if (!this.pausedBy.size) {
      for (const timer of this.timers.values()) {
        clearTimeout(timer.handle);
        if (timer.handle !== undefined) timer.remaining -= Date.now() - timer.startedAt;
        timer.handle = undefined;
      }
    }
    this.pausedBy.add(source);
  }

  private resume(source: 'pointer' | 'focus'): void {
    this.pausedBy.delete(source);
    if (!this.pausedBy.size) this.timers.forEach((_, ref) => this.startTimer(ref));
  }

  private startTimer(ref: UiToastRef): void {
    const timer = this.timers.get(ref);
    if (!timer || timer.handle !== undefined) return;
    const item = this.items().find((i) => i.ref === ref);
    if (!item?.duration) return;
    // Paused after the time was up but before the late timer callback ran.
    if (timer.remaining <= 0) {
      this.remove(ref, 'timeout');
      return;
    }
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.remove(ref, 'timeout'), timer.remaining);
  }

  private remove(ref: UiToastRef, reason: UiToastDismissReason): void {
    if (!this.items().some((item) => item.ref === ref)) return;
    this.control.beforeRemove?.(ref);
    clearTimeout(this.timers.get(ref)?.handle);
    this.timers.delete(ref);
    this.items.update((items) => items.filter((item) => item.ref !== ref));
    if (!this.items().length) {
      this.overlayRef?.detach();
      // The stack is gone, so nothing can hold the pause any more.
      this.pausedBy.clear();
    }
    finish(ref, reason);
  }

  private attach(): void {
    const overlayRef = (this.overlayRef ??= this.createOverlay());
    overlayRef.setDirection(resolveDirection(this.document.documentElement));
    if (!overlayRef.hasAttached()) {
      const injector = Injector.create({
        providers: [{ provide: UI_TOAST_CONTROL, useValue: this.control }],
        parent: this.injector,
      });
      overlayRef.attach(new ComponentPortal(UiToastContainer, null, injector));
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
