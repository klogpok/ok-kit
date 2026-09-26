import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UI_LABELS } from '@vplans/ui-kit/core';
import {
  UiIcon,
  UiIconDefinition,
  uiIconAlertCircle,
  uiIconAlertTriangle,
  uiIconCheckCircle,
  uiIconInfo,
  uiIconX,
} from '@vplans/ui-kit/icon';

export type UiAlertTone = 'info' | 'success' | 'warning' | 'danger';

/**
 * How an alert is announced when it appears: `off` (default) is plain content, `polite` is a
 * `status` region, `assertive` an `alert` region that interrupts the screen reader.
 */
export type UiAlertLive = 'off' | 'polite' | 'assertive';

/** The same icons as the toasts of the same tone. */
const ICONS: Record<UiAlertTone, UiIconDefinition> = {
  info: uiIconInfo,
  success: uiIconCheckCircle,
  warning: uiIconAlertTriangle,
  danger: uiIconAlertCircle,
};

const ROLES: Record<UiAlertLive, string | null> = {
  off: null,
  polite: 'status',
  assertive: 'alert',
};

/**
 * Inline message about the page or a section: a tone icon, an optional title, the projected
 * text and optional `[uiAlertActions]` buttons.
 *
 * An alert that is on the page from the start is plain content. Set `live` when the alert
 * appears after a user action and must be announced (`assertive` only for errors that need
 * attention now). Screen readers announce a live region only when its content changes, so
 * render the alert with `@if` rather than toggling `live`.
 *
 * `dismissible` shows a close button; the alert does not hide itself, remove it on `dismissed`.
 *
 * @example
 * <ui-alert tone="warning" title="The plan is not signed">
 *   Send it to the owner before the deadline.
 *   <button uiAlertActions ui-button size="sm" variant="secondary">Send</button>
 * </ui-alert>
 */
@Component({
  selector: 'ui-alert',
  imports: [UiIcon, UiIconButton],
  template: `
    <span class="ui-alert__icon"><ui-icon size="md" [icon]="icons[tone()]" /></span>
    <div class="ui-alert__body">
      @if (title()) {
        <div class="ui-alert__title">{{ title() }}</div>
      }
      <div class="ui-alert__message"><ng-content /></div>
      <div class="ui-alert__actions"><ng-content select="[uiAlertActions]" /></div>
    </div>
    @if (dismissible()) {
      <button
        ui-icon-button
        size="sm"
        class="ui-alert__close"
        [label]="labels().dismiss"
        (click)="dismissed.emit()"
      >
        <ui-icon size="sm" [icon]="closeIcon" />
      </button>
    }
  `,
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-alert',
    '[class]': '"ui-alert--" + tone()',
    '[attr.role]': 'roles[live()]',
    // `title` is an input; the native attribute would show a browser tooltip.
    '[attr.title]': 'null',
  },
})
export class UiAlert {
  protected readonly labels = inject(UI_LABELS);
  protected readonly icons = ICONS;
  protected readonly roles = ROLES;
  protected readonly closeIcon = uiIconX;

  readonly tone = input<UiAlertTone>('info');
  /** Bold first line. */
  readonly title = input('');
  readonly live = input<UiAlertLive>('off');
  /** Shows a close button that emits `dismissed`. */
  readonly dismissible = input(false, { transform: booleanAttribute });

  readonly dismissed = output();
}
