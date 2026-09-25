import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { UiSize } from '@vplans/ui-kit/core';

/**
 * Indeterminate loading indicator. Inherits the current text color.
 *
 * @example <ui-spinner label="Loading orders" />
 */
@Component({
  selector: 'ui-spinner',
  template: `
    <svg class="ui-spinner__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle class="ui-spinner__track" cx="12" cy="12" r="10" />
      <circle class="ui-spinner__arc" cx="12" cy="12" r="10" pathLength="100" />
    </svg>
  `,
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-spinner',
    '[class]': '"ui-spinner--" + size()',
    '[attr.role]': 'decorative() ? null : "progressbar"',
    '[attr.aria-label]': 'decorative() ? null : label()',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
  },
})
export class UiSpinner {
  readonly size = input<UiSize>('md');
  /** Accessible name announced by screen readers. */
  readonly label = input('Loading');
  /** Hide from assistive technologies when the surrounding element already conveys busy state. */
  readonly decorative = input(false, { transform: booleanAttribute });
}
