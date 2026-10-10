import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiVariant } from '@vplans/ui-kit/core';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import { UiButtonBase } from './button-base';

/**
 * Square or circular button containing only an icon. `label` is required and becomes the
 * accessible name.
 *
 * @example
 * <button ui-icon-button label="Close dialog" (click)="close()"><ui-icon icon="x" /></button>
 * @example
 * <button ui-icon-button label="Add" variant="primary" shape="circle"><ui-icon icon="plus" /></button>
 */
@Component({
  selector: 'button[ui-icon-button], a[ui-icon-button]',
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
    class: 'ui-button ui-button--icon',
    '[class.ui-button--circle]': 'shape() === "circle"',
    '[attr.aria-label]': 'label()',
    '[attr.title]': 'label()',
  },
})
export class UiIconButton extends UiButtonBase {
  readonly variant = input<UiVariant>('ghost');
  /** Accessible name, also shown as a native tooltip (`uiTooltip` hides it while active). */
  readonly label = input.required<string>();
  /** `circle` rounds the button fully (`--ui-button-circle-radius`). */
  readonly shape = input<'square' | 'circle'>('square');
}
