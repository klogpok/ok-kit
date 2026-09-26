import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

/**
 * Placeholder for a list, table or page with nothing to show yet: an icon or illustration,
 * a title, a description and actions.
 *
 * - A projected `<ui-icon>` is drawn in a tinted circle. Mark an image or an inline SVG with
 *   `uiEmptyStateMedia` to show it as is; give it `alt=""` when it is decorative.
 * - The projected content is the description.
 * - Buttons and links marked `uiEmptyStateActions` go below it.
 *
 * `size="sm"` fits inside a card or a table (`tr[ui-table-message]`).
 *
 * @example
 * <ui-empty-state title="No plans yet" headingLevel="2">
 *   <ui-icon icon="file" />
 *   Plans you create or that are shared with you show up here.
 *   <button uiEmptyStateActions ui-button>Create a plan</button>
 * </ui-empty-state>
 */
@Component({
  selector: 'ui-empty-state',
  template: `
    <div class="ui-empty-state__icon"><ng-content select="ui-icon" /></div>
    <div class="ui-empty-state__media"><ng-content select="[uiEmptyStateMedia]" /></div>
    @if (title()) {
      <div class="ui-empty-state__title" role="heading" [attr.aria-level]="headingLevel()">
        {{ title() }}
      </div>
    }
    <div class="ui-empty-state__description"><ng-content /></div>
    <div class="ui-empty-state__actions"><ng-content select="[uiEmptyStateActions]" /></div>
  `,
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-empty-state',
    '[class]': '"ui-empty-state--" + size()',
    // `title` is an input; the native attribute would show a browser tooltip.
    '[attr.title]': 'null',
  },
})
export class UiEmptyState {
  readonly title = input('');
  /** Level of the title in the page outline. */
  readonly headingLevel = input(3, { transform: numberAttribute });
  readonly size = input<'sm' | 'md'>('md');
}
