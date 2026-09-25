import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

/**
 * Thin line that separates content. Horizontal by default; `vertical` separates inline items
 * such as toolbar buttons. With a `label` the text sits in the middle of the line (e.g. "או").
 *
 * Without a label the host has `role="separator"`. A labelled divider has no role, so screen
 * readers read the label as plain text (a separator hides its children from them).
 *
 * @example <ui-divider />
 * @example <ui-divider label="או" />
 * @example <ui-divider orientation="vertical" />
 */
@Component({
  selector: 'ui-divider',
  template: `
    @if (label()) {
      <span class="ui-divider__label">{{ label() }}</span>
    }
  `,
  styleUrl: './divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-divider',
    '[class]': '"ui-divider--" + orientation()',
    '[class.ui-divider--labelled]': '!!label()',
    '[attr.role]': 'role()',
    '[attr.aria-orientation]': 'role() && orientation() === "vertical" ? "vertical" : null',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
  },
})
export class UiDivider {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Text shown in the middle of a horizontal divider. */
  readonly label = input('');
  /** Hide from assistive technologies when the line is purely visual. */
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly role = computed(() =>
    this.decorative() || this.label() ? null : 'separator',
  );
}
