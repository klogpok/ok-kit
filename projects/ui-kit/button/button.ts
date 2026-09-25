import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { UiVariant } from '@vplans/ui-kit/core';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import { UiButtonBase } from './button-base';

/**
 * Button with native semantics. Apply to `<button>` for actions and `<a>` for navigation.
 *
 * @example <button ui-button variant="secondary" (click)="cancel()">Cancel</button>
 * @example <a ui-button routerLink="/orders">Orders</a>
 * @example <button ui-button [loading]="saving()"><ui-icon icon="check" /> Save</button>
 */
@Component({
  selector: 'button[ui-button], a[ui-button]',
  imports: [UiSpinner],
  template: `
    @if (loading()) {
      <ui-spinner class="ui-button__spinner" size="sm" decorative />
    }
    <span class="ui-button__content"><ng-content /></span>
  `,
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-button',
    '[class.ui-button--full-width]': 'fullWidth()',
  },
})
export class UiButton extends UiButtonBase {
  readonly variant = input<UiVariant>('primary');
  /** Stretch to the full inline size of the container. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
}
