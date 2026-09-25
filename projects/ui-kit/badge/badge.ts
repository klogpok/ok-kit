import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Color of a badge. `warning` is the olive status color, `neutral` is gray. */
export type UiBadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

/**
 * Compact status label (pill). `soft` uses a tinted background, `solid` a filled one.
 * Icons can be projected next to the text.
 *
 * Badges are plain text for screen readers. When the color is the only cue, include it in the
 * text (e.g. "Overdue" instead of a red dot).
 *
 * @example <ui-badge tone="primary">ממתין לאישור מתאם</ui-badge>
 * @example <ui-badge tone="success" appearance="solid"><ui-icon icon="check" /> Approved</ui-badge>
 */
@Component({
  selector: 'ui-badge',
  template: '<ng-content />',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-badge',
    '[class]': '["ui-badge--" + tone(), "ui-badge--" + appearance(), "ui-badge--" + size()]',
  },
})
export class UiBadge {
  readonly tone = input<UiBadgeTone>('neutral');
  readonly appearance = input<'soft' | 'solid'>('soft');
  readonly size = input<'sm' | 'md'>('md');
}
