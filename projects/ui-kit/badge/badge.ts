import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

/** Color of a badge. `warning` is the olive status color, `neutral` is gray. */
export type UiBadgeTone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger';

/** Maps an optional numeric attribute (`count="3"`) to a number, keeping `null` for "no count". */
function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Compact status label (pill). `soft` uses a tinted background, `solid` a filled one.
 * Icons can be projected next to the text.
 *
 * - `count` shows a number instead of the text, capped at `max` ("99+"). The projected text is
 *   then read by screen readers only, e.g. `<ui-badge [count]="3">unread messages</ui-badge>`.
 * - `dot` shows only a small dot in the tone color; the projected text is read by screen
 *   readers only.
 *
 * Badges are plain text for screen readers. When the color is the only cue, include it in the
 * text (e.g. "Overdue" instead of a red dot).
 *
 * @example <ui-badge tone="primary">ממתין לאישור מתאם</ui-badge>
 * @example <ui-badge tone="success" appearance="soft"><ui-icon icon="check" /> Approved</ui-badge>
 * @example <ui-badge tone="danger" [count]="unread()">unread</ui-badge>
 */
@Component({
  selector: 'ui-badge',
  template: `
    @if (dot()) {
      <span class="ui-badge__dot" aria-hidden="true"></span>
    } @else if (countText(); as text) {
      <span class="ui-badge__count" dir="ltr">{{ text }}</span>
    }
    <span class="ui-badge__label" [class.ui-badge__label--hidden]="dot() || countText()">
      <ng-content />
    </span>
  `,
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-badge',
    '[class]': '["ui-badge--" + tone(), "ui-badge--" + appearance(), "ui-badge--" + size()]',
    '[class.ui-badge--dot]': 'dot()',
    '[class.ui-badge--count]': '!dot() && !!countText()',
  },
})
export class UiBadge {
  readonly tone = input<UiBadgeTone>('neutral');
  readonly appearance = input<'soft' | 'solid'>('solid');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Shows only a dot; the text is kept for screen readers. */
  readonly dot = input(false, { transform: booleanAttribute });
  /** Number shown instead of the text. */
  readonly count = input<number | null, unknown>(null, { transform: optionalNumber });
  /** Largest count shown as is; above it the badge shows "max+". */
  readonly max = input(99, { transform: (value: unknown) => numberAttribute(value, 99) });

  protected readonly countText = computed(() => {
    const count = this.count();
    if (count === null) return '';
    return count > this.max() ? `${this.max()}+` : String(count);
  });
}
