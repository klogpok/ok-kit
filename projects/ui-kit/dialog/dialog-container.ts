import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  inject,
} from '@angular/core';
import { FocusMonitor, InteractivityChecker } from '@angular/cdk/a11y';
import { CdkDialogContainer, DialogConfig } from '@angular/cdk/dialog';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';

export type UiDialogSize = 'sm' | 'md' | 'lg';

/** Side of the screen a drawer slides in from. `end` is the right side in LTR, the left in RTL. */
export type UiDrawerPosition = 'start' | 'end';

/** CDK dialog config with the kit's own options. Internal. */
export interface UiDialogConfig<D = unknown, R = unknown> extends DialogConfig<D, R> {
  size?: UiDialogSize;
  /** Drawers only. */
  position?: UiDrawerPosition;
  /** Focus `[cdkFocusInitial]`, else the first form field, else the first tabbable element. */
  focusFirstField?: boolean;
  /**
   * Return focus to the element that opened the dialog. Replaces the CDK `restoreFocus: true`,
   * which loses focus when that element is gone by then (a menu item of a closed menu).
   */
  restoreToOpener?: boolean;
}

const FIELDS = [
  'input:not([type="hidden"])',
  'textarea',
  'select',
  '[role="combobox"]',
  '[contenteditable="true"]',
].join(', ');

const TABBABLE = 'button, [href], input, select, textarea, [tabindex]';

/**
 * Focus handling shared by the dialog and drawer surfaces: the first field gets focus on open,
 * and focus returns to the opener on close. Internal. A component, since it extends the CDK
 * container component.
 */
// On Angular 20 an omitted `changeDetection` means eager checking, and a subclass that carries no
// decorator of its own inherits this metadata verbatim, so the strategy is declared here too.
@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
export abstract class UiDialogContainerBase extends CdkDialogContainer<UiDialogConfig> {
  private readonly checker = inject(InteractivityChecker);
  private readonly injector = inject(Injector);
  private readonly focusMonitor = inject(FocusMonitor);
  private opener: HTMLElement | null = null;
  protected readonly size: UiDialogSize = this._config.size ?? 'md';

  override attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    const ref = super.attachComponentPortal(portal);
    // The content component's host takes no box, so header/content/actions lay out in the surface.
    (ref.location.nativeElement as HTMLElement).classList.add('ui-dialog-component-host');
    return ref;
  }

  protected override _captureInitialFocus(): void {
    this.opener = this.focusedOutside();
    // Runs before the CDK's own callback, which then leaves the focus alone ('dialog' mode
    // only focuses the container when nothing inside has focus).
    afterNextRender(
      () => {
        // A menu item that opened the dialog is removed when its menu closes, and the menu has
        // moved focus to its trigger by now.
        if (!this.opener?.isConnected) this.opener = this.focusedOutside();
        if (this._config.focusFirstField) this.focusFirstField();
      },
      { injector: this.injector },
    );
    super._captureInitialFocus();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (!this._config.restoreToOpener || !this.opener?.isConnected) return;
    const active = this._document.activeElement;
    const root = this._elementRef.nativeElement;
    if (!active || active === this._document.body || root.contains(active)) {
      this.focusMonitor.focusVia(this.opener, this._closeInteractionType);
    }
  }

  private focusedOutside(): HTMLElement | null {
    const active = this._document.activeElement;
    return active instanceof HTMLElement &&
      active !== this._document.body &&
      !this._elementRef.nativeElement.contains(active)
      ? active
      : null;
  }

  private focusFirstField(): void {
    const root = this._elementRef.nativeElement;
    const initial = root.querySelector<HTMLElement>('[cdkFocusInitial]');
    const candidates = [
      ...root.querySelectorAll<HTMLElement>(FIELDS),
      ...root.querySelectorAll<HTMLElement>(TABBABLE),
    ];
    const target =
      (initial && this.checker.isFocusable(initial) ? initial : null) ??
      candidates.find((el) => this.checker.isTabbable(el));
    target?.focus();
  }
}

/**
 * Dialog surface. Internal: `UiDialog.open()` uses it as the CDK dialog container, which keeps
 * the CDK focus trap, focus restoration and ARIA wiring.
 */
@Component({
  selector: 'ui-dialog-container',
  imports: [CdkPortalOutlet],
  template: '<ng-template cdkPortalOutlet />',
  styleUrl: './dialog-container.scss',
  // Also styles the backdrop and the content component host, which live outside this view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-dialog-container',
    '[class]': '"ui-dialog-container--" + size',
  },
})
export class UiDialogContainer extends UiDialogContainerBase {}

/**
 * Drawer surface: a full-height panel at the start or end side. Internal: used by
 * `UiDialog.openDrawer()`.
 */
@Component({
  selector: 'ui-drawer-container',
  imports: [CdkPortalOutlet],
  template: '<ng-template cdkPortalOutlet />',
  styleUrls: ['./dialog-container.scss', './drawer-container.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-drawer-container',
    '[class]': '["ui-drawer-container--" + size, "ui-drawer-container--" + position]',
  },
})
export class UiDrawerContainer extends UiDialogContainerBase {
  protected readonly position: UiDrawerPosition = this._config.position ?? 'end';
}
