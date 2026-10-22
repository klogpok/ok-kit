import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollableElement,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { UI_LABELS, UiSize } from '@vplans/ui-kit/core';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import { UiListboxController } from './listbox-controller';
import { UiLeadingActionOption, UiOption } from './option';
import { UiItemOption } from './option-items';

/**
 * The popup listbox of a field, rendered inside its `uiDropdownPanel`. It shows the field's
 * projected options, or the `items` of its listbox controller (in a virtual scroll viewport
 * once there are many), and a loading or "no options" row. The leading actions of the controller
 * ("Add «…»", "Select all") come first, with labels from `UI_LABELS`.
 *
 * The id, `aria-label` / `aria-labelledby`, `aria-multiselectable` and `aria-busy` come from the
 * controller. Internal.
 *
 * @example
 * <ng-template [uiDropdownPanel]="origin" [open]="listbox.shown()" (closed)="listbox.close()">
 *   <ui-listbox [size]="size()"><ng-content /></ui-listbox>
 * </ng-template>
 */
@Component({
  selector: 'ui-listbox',
  imports: [
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
    NgTemplateOutlet,
    UiItemOption,
    UiLeadingActionOption,
    UiOption,
    UiSpinner,
  ],
  // The listbox scrolls, also over a virtual list, so axe sees the combobox popup it is.
  hostDirectives: [CdkVirtualScrollableElement],
  template: `
    <!-- "Add «…»" and "Select all": the row sticks over a virtual list. Tracked by kind: by
      identity, one action replacing the other warns (NG0956). -->
    @if (listbox.leadingActions().length) {
      <div class="ui-listbox__actions" role="none">
        @for (action of listbox.leadingActions(); track action.kind; let i = $index) {
          <ui-option
            [uiLeadingAction]="action"
            [value]="action"
            [class]="'ui-listbox__' + action.slug"
            [attr.aria-setsize]="listbox.setSize()"
            [attr.aria-posinset]="listbox.actionPosInSet(i)"
            >{{ action.getLabel() }}</ui-option
          >
        }
      </div>
    }
    @if (listbox.items()) {
      @if (listbox.virtual()) {
        <cdk-virtual-scroll-viewport
          [itemSize]="listbox.itemSize()"
          [minBufferPx]="listbox.itemSize() * 5"
          [maxBufferPx]="listbox.itemSize() * 10"
        >
          <ng-container
            *cdkVirtualFor="
              let entry of listbox.visibleItems();
              trackBy: listbox.trackEntry;
              let i = index
            "
          >
            <ng-container
              *ngTemplateOutlet="itemOptionTemplate; context: { $implicit: entry, index: i }"
            />
          </ng-container>
        </cdk-virtual-scroll-viewport>
      } @else {
        @for (entry of listbox.visibleItems(); track entry; let i = $index) {
          <ng-container
            *ngTemplateOutlet="itemOptionTemplate; context: { $implicit: entry, index: i }"
          />
        }
      }
    } @else {
      <ng-content />
    }
    @if (listbox.loading()) {
      <div class="ui-listbox__empty ui-listbox__loading">
        <ui-spinner size="sm" decorative />
        {{ labels().loading }}
      </div>
    } @else if (listbox.noResults()) {
      <div class="ui-listbox__empty">{{ labels().noOptions }}</div>
    }

    <!-- An option of items. The position counts the whole list: the viewport renders a part. -->
    <ng-template #itemOptionTemplate let-entry let-index="index">
      <ui-option
        [uiItemEntry]="entry"
        [value]="entry.item.value"
        [label]="entry.item.label"
        [disabled]="entry.isDisabled()"
        [attr.aria-setsize]="listbox.setSize()"
        [attr.aria-posinset]="listbox.itemPosInSet(index)"
      >
        {{ entry.item.label }}
        @if (entry.item.description) {
          <span uiOptionDescription>{{ entry.item.description }}</span>
        }
      </ui-option>
    </ng-template>
  `,
  styleUrl: './listbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listbox',
    class: 'ui-listbox',
    '[class.ui-listbox--virtual]': '!!listbox.items() && listbox.virtual()',
    '[attr.id]': 'listbox.panelId()',
    '[attr.aria-label]': 'listbox.ariaLabel()',
    '[attr.aria-labelledby]': 'listbox.labelledBy()',
    '[attr.aria-multiselectable]': 'listbox.multiple || null',
    '[attr.aria-busy]': 'listbox.loading() ? "true" : null',
    // The --_option-* variables give the options the size of the field.
    '[style.--_option-padding]': '"var(--ui-control-padding-inline-" + size() + ")"',
    '[style.--_option-font-size]': '"var(--ui-control-font-size-" + size() + ")"',
    // Options keep focus in the field: mousedown must not move it.
    '(mousedown)': '$event.preventDefault()',
  },
})
export class UiListbox<T = unknown> {
  protected readonly listbox = inject<UiListboxController<T>>(UiListboxController);
  protected readonly labels = inject(UI_LABELS);

  /** Size of the field; the options take its padding and font size. */
  readonly size = input<UiSize>('md');

  private readonly itemOptions = viewChildren<UiItemOption<T>>(UiItemOption);
  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  constructor() {
    this.listbox.ɵconnectView({ itemOptions: this.itemOptions, viewport: this.viewport });
    inject(DestroyRef).onDestroy(() => this.listbox.ɵconnectView(null));
  }
}
