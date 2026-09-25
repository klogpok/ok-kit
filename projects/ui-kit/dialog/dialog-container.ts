import { ChangeDetectionStrategy, Component, ComponentRef, ViewEncapsulation } from '@angular/core';
import { CdkDialogContainer, DialogConfig } from '@angular/cdk/dialog';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';

export type UiDialogSize = 'sm' | 'md' | 'lg';

/** CDK dialog config with the kit's own options. Internal. */
export interface UiDialogConfig<D = unknown, R = unknown> extends DialogConfig<D, R> {
  size?: UiDialogSize;
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
export class UiDialogContainer extends CdkDialogContainer<UiDialogConfig> {
  protected readonly size: UiDialogSize = this._config.size ?? 'md';

  override attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    const ref = super.attachComponentPortal(portal);
    // The content component's host takes no box, so header/content/actions lay out in the surface.
    (ref.location.nativeElement as HTMLElement).classList.add('ui-dialog-component-host');
    return ref;
  }
}
