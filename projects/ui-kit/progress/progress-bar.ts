import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UI_LABELS } from '@vplans/ui-kit/core';

export type UiProgressTone = 'primary' | 'success' | 'warning' | 'danger';

/** Maps an optional numeric attribute (`value="40"`) to a number, keeping `null` for "unknown". */
function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Horizontal progress indicator (`role="progressbar"`). With a `value` it shows how much is done
 * out of `max`; without one (`null`) it is indeterminate and a bar slides along the track. The
 * sliding stops when the user prefers reduced motion.
 *
 * The accessible name is `label`, or the element named by `aria-labelledby`, else the `loading`
 * label. Name it after the task, e.g. "Uploading plan.pdf".
 *
 * @example <ui-progress-bar [value]="uploaded()" label="Uploading plan.pdf" />
 * @example <ui-progress-bar size="sm" />
 */
@Component({
  selector: 'ui-progress-bar',
  template: `
    <div class="ui-progress-bar__track">
      <div class="ui-progress-bar__indicator" [style.inline-size.%]="percent()"></div>
    </div>
  `,
  styleUrl: './progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-progress-bar',
    role: 'progressbar',
    '[class]': '["ui-progress-bar--" + size(), "ui-progress-bar--" + tone()]',
    '[class.ui-progress-bar--indeterminate]': 'indeterminate()',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'safeMax()',
    '[attr.aria-valuenow]': 'indeterminate() ? null : clampedValue()',
    '[attr.aria-label]': 'ariaLabelledBy() ? null : label() || labels().loading',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
  },
})
export class UiProgressBar {
  protected readonly labels = inject(UI_LABELS);

  /** Amount done, from 0 to `max`. `null` (the default) means the amount is unknown. */
  readonly value = input<number | null, unknown>(null, { transform: optionalNumber });
  readonly max = input<number, unknown>(100, { transform: (v) => optionalNumber(v) ?? 100 });
  readonly size = input<'sm' | 'md'>('md');
  readonly tone = input<UiProgressTone>('primary');
  /** Accessible name. Defaults to the `loading` label. */
  readonly label = input('');
  readonly ariaLabelledBy = input<string | null>(null, { alias: 'aria-labelledby' });

  protected readonly indeterminate = computed(() => this.value() === null);
  protected readonly safeMax = computed(() => (this.max() > 0 ? this.max() : 100));
  protected readonly clampedValue = computed(() =>
    Math.min(Math.max(this.value() ?? 0, 0), this.safeMax()),
  );
  protected readonly percent = computed(() =>
    this.indeterminate() ? null : (this.clampedValue() / this.safeMax()) * 100,
  );
}
