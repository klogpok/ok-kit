import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UI_LABELS } from '@vplans/ui-kit/core';
import { UiIcon, uiIconChevronDown } from '@vplans/ui-kit/icon';
import { injectColumnCount } from './columns';

/**
 * A row that shows or hides a detail row below it. Put `td[ui-row-toggle]` in the row and the
 * detail content in a `tr[ui-row-detail]` right after it. `expanded` supports two-way binding.
 *
 * @example
 * @for (plan of rows(); track plan.id) {
 *   <tr uiExpandableRow #row="uiExpandableRow">
 *     <td ui-row-toggle></td>
 *     <td>{{ plan.name }}</td>
 *   </tr>
 *   <tr [ui-row-detail]="row">Units, owners and history of {{ plan.name }}</tr>
 * }
 */
@Directive({
  selector: 'tr[uiExpandableRow]',
  exportAs: 'uiExpandableRow',
  host: {
    class: 'ui-expandable-row',
    '[class.ui-expandable-row--expanded]': 'expanded()',
  },
})
export class UiExpandableRow {
  readonly expanded = model(false);
  /** Id of the detail row, the target of `aria-controls`. */
  readonly detailId = inject(_IdGenerator).getId('ui-row-detail-');
  /** Whether a `tr[ui-row-detail]` is rendered for this row. Internal. */
  readonly hasDetail = signal(false);

  toggle(): void {
    this.expanded.set(!this.expanded());
  }

  expand(): void {
    this.expanded.set(true);
  }

  collapse(): void {
    this.expanded.set(false);
  }
}

/**
 * Cell with the button that expands or collapses its `tr[uiExpandableRow]`. The button reports
 * `aria-expanded` and controls the detail row.
 *
 * @example <td ui-row-toggle [label]="'Details of ' + plan.name"></td>
 */
@Component({
  selector: 'td[ui-row-toggle]',
  imports: [UiIconButton, UiIcon],
  template: `
    <button
      ui-icon-button
      size="sm"
      class="ui-row-toggle__button"
      [label]="label() || labels().rowDetails"
      [attr.aria-expanded]="row.expanded()"
      [attr.aria-controls]="row.hasDetail() ? row.detailId : null"
      (click)="row.toggle()"
    >
      <ui-icon class="ui-row-toggle__icon" [icon]="icon" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-row-toggle' },
})
export class UiRowToggle {
  protected readonly row = inject(UiExpandableRow);
  protected readonly labels = inject(UI_LABELS);
  protected readonly icon = uiIconChevronDown;
  /** Accessible name of the button; defaults to the `rowDetails` label. */
  readonly label = input('');
}

/**
 * Detail row of a `tr[uiExpandableRow]`, hidden while that row is collapsed. It spans every
 * column. Its content is rendered even while hidden; wrap it in `@if (row.expanded())` to create
 * it on demand.
 *
 * @example <tr [ui-row-detail]="row">...</tr>
 */
@Component({
  selector: 'tr[ui-row-detail]',
  template: `
    <td class="ui-row-detail__cell" [attr.colspan]="span()">
      <ng-content />
    </td>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-row-detail',
    '[id]': 'row().detailId',
    '[hidden]': '!row().expanded()',
  },
})
export class UiRowDetail {
  /** The expandable row this detail belongs to (its `#row="uiExpandableRow"`). */
  readonly row = input.required<UiExpandableRow>({ alias: 'ui-row-detail' });

  protected readonly span = injectColumnCount();

  constructor() {
    // Lets the toggle point `aria-controls` at this row only while it exists.
    effect((onCleanup) => {
      const row = this.row();
      row.hasDetail.set(true);
      onCleanup(() => row.hasDetail.set(false));
    });
  }
}
