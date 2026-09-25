import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  TemplateRef,
  contentChild,
  contentChildren,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { UiIcon, uiIconChevronDown } from '@vplans/ui-kit/icon';

/**
 * Lazy panel content: created the first time the item opens, then kept while it is closed.
 * Without it, the projected content is created up front.
 *
 * @example <ng-template uiAccordionContent><app-plan-history /></ng-template>
 */
@Directive({ selector: 'ng-template[uiAccordionContent]' })
export class UiAccordionContent {
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/** Header keyboard navigation provided by `ui-accordion` to its items. */
interface UiAccordionNavigation {
  onHeaderKeydown(event: KeyboardEvent, item: FocusableOption): void;
}

const UI_ACCORDION = new InjectionToken<UiAccordionNavigation>('UiAccordion');

/**
 * One collapsible section. Use inside `ui-accordion`; alone it works as a disclosure.
 * `expanded` supports two-way binding: `[(expanded)]="open"`.
 *
 * @example <ui-accordion-item label="Documents" headingLevel="2">...</ui-accordion-item>
 */
@Component({
  selector: 'ui-accordion-item',
  exportAs: 'uiAccordionItem',
  imports: [NgTemplateOutlet, UiIcon],
  template: `
    <div class="ui-accordion-item__heading" role="heading" [attr.aria-level]="headingLevel()">
      <button
        #trigger
        type="button"
        class="ui-accordion-item__trigger"
        [id]="headerId"
        [disabled]="item.disabled"
        [attr.aria-expanded]="item.expanded"
        [attr.aria-controls]="panelId"
        (click)="item.toggle()"
        (keydown)="onKeydown($event)"
      >
        <span class="ui-accordion-item__label">{{ label() }}</span>
        <ui-icon class="ui-accordion-item__chevron" size="md" [icon]="chevron" />
      </button>
    </div>
    <div
      role="region"
      class="ui-accordion-item__panel"
      [id]="panelId"
      [attr.aria-labelledby]="headerId"
    >
      <div class="ui-accordion-item__body">
        <div class="ui-accordion-item__content">
          @if (lazyContent(); as lazy) {
            @if (rendered()) {
              <ng-container [ngTemplateOutlet]="lazy.template" />
            }
          } @else {
            <ng-content />
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './accordion-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkAccordionItem,
      inputs: ['expanded', 'disabled'],
      outputs: ['expandedChange', 'opened', 'closed'],
    },
  ],
  host: {
    class: 'ui-accordion-item',
    '[class.ui-accordion-item--expanded]': 'item.expanded',
    '[class.ui-accordion-item--disabled]': 'item.disabled',
  },
})
export class UiAccordionItem implements FocusableOption {
  protected readonly item = inject(CdkAccordionItem);
  private readonly accordion = inject(UI_ACCORDION, { optional: true });
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  /** Header text. Not called `title`, which would show a native tooltip. */
  readonly label = input('');
  /** `aria-level` of the header. Match the document outline (usually 2 or 3). */
  readonly headingLevel = input(3, { transform: numberAttribute });

  protected readonly lazyContent = contentChild(UiAccordionContent);
  protected readonly chevron = uiIconChevronDown;
  protected readonly headerId = `${this.item.id}-header`;
  protected readonly panelId = `${this.item.id}-panel`;

  /** Lazy content stays rendered once the item has been opened. */
  protected readonly rendered = signal(false);

  constructor() {
    const sub = this.item.opened.subscribe(() => this.rendered.set(true));
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  get expanded(): boolean {
    return this.item.expanded;
  }

  get disabled(): boolean {
    return this.item.disabled;
  }

  toggle(): void {
    this.item.toggle();
  }

  open(): void {
    this.item.open();
  }

  close(): void {
    this.item.close();
  }

  /** Moves keyboard focus to the header. */
  focus(): void {
    this.trigger().nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.accordion?.onHeaderKeydown(event, this);
  }
}

const HEADER_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End']);

/**
 * A set of collapsible sections (WAI-ARIA accordion pattern). One item is open at a time
 * unless `multi` is set.
 *
 * Keyboard: Enter/Space toggles the focused header, Arrow Up/Down move between headers,
 * Home/End jump to the first/last one. Disabled items are skipped.
 *
 * @example
 * <ui-accordion>
 *   <ui-accordion-item label="Details" expanded>...</ui-accordion-item>
 *   <ui-accordion-item label="History">
 *     <ng-template uiAccordionContent><app-history /></ng-template>
 *   </ui-accordion-item>
 * </ui-accordion>
 */
@Component({
  selector: 'ui-accordion',
  exportAs: 'uiAccordion',
  template: '<ng-content />',
  styleUrl: './accordion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: CdkAccordion, inputs: ['multi'] }],
  providers: [{ provide: UI_ACCORDION, useExisting: UiAccordion }],
  host: { class: 'ui-accordion' },
})
export class UiAccordion implements UiAccordionNavigation {
  private readonly cdkAccordion = inject(CdkAccordion);
  private readonly items = contentChildren(UiAccordionItem);
  private readonly keyManager = new FocusKeyManager(this.items, inject(Injector))
    .withVerticalOrientation()
    .withHomeAndEnd()
    .withWrap();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());
  }

  /** Opens every enabled item. Only works with `multi`. */
  openAll(): void {
    this.cdkAccordion.openAll();
  }

  /** Closes every enabled item. */
  closeAll(): void {
    this.cdkAccordion.closeAll();
  }

  /** @docs-private */
  onHeaderKeydown(event: KeyboardEvent, item: FocusableOption): void {
    if (!HEADER_KEYS.has(event.key)) return;
    this.keyManager.updateActiveItem(item as UiAccordionItem);
    this.keyManager.onKeydown(event);
  }
}
