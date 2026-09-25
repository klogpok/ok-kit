import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UI_TOOLTIP_HOST, UiVariant } from '@vplans/ui-kit/core';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import { UiButtonBase } from './button-base';

/**
 * Square button containing only an icon. `label` is required and becomes the accessible name.
 *
 * @example
 * <button ui-icon-button label="Close dialog" (click)="close()"><ui-icon icon="x" /></button>
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
    '[attr.aria-label]': 'label()',
    '[attr.title]': 'nativeTitle()',
  },
})
export class UiIconButton extends UiButtonBase {
  readonly variant = input<UiVariant>('ghost');
  /** Accessible name, also shown as a native tooltip unless `uiTooltip` is set. */
  readonly label = input.required<string>();

  private readonly tooltip = inject(UI_TOOLTIP_HOST, { self: true, optional: true });
  protected readonly nativeTitle = computed(() => (this.tooltip?.active() ? null : this.label()));
}
