import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  inject,
} from '@angular/core';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { CdkDialogContainer, DialogConfig } from '@angular/cdk/dialog';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';

export type UiDialogSize = 'sm' | 'md' | 'lg';

/** CDK dialog config with the kit's own options. Internal. */
export interface UiDialogConfig<D = unknown, R = unknown> extends DialogConfig<D, R> {
  size?: UiDialogSize;
  /** Focus `[cdkFocusInitial]`, else the first form field, else the first tabbable element. */
  focusFirstField?: boolean;
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
export class UiDialogContainer extends CdkDialogContainer<UiDialogConfig> {
  private readonly checker = inject(InteractivityChecker);
  private readonly injector = inject(Injector);
  protected readonly size: UiDialogSize = this._config.size ?? 'md';

  override attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    const ref = super.attachComponentPortal(portal);
    // The content component's host takes no box, so header/content/actions lay out in the surface.
    (ref.location.nativeElement as HTMLElement).classList.add('ui-dialog-component-host');
    return ref;
  }

  protected override _captureInitialFocus(): void {
    // Runs before the CDK's own callback, which then leaves the focus alone ('dialog' mode
    // only focuses the container when nothing inside has focus).
    if (this._config.focusFirstField) {
      afterNextRender(() => this.focusFirstField(), { injector: this.injector });
    }
    super._captureInitialFocus();
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
