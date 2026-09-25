import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Surface that groups related content. Compose it from the parts below; each part is optional.
 *
 * @example
 * <ui-card>
 *   <ui-card-header>
 *     <h3 ui-card-title>Project Alpha</h3>
 *     <p ui-card-subtitle>Updated today</p>
 *     <ui-badge uiCardHeaderAside tone="primary">Active</ui-badge>
 *   </ui-card-header>
 *   <ui-card-content>...</ui-card-content>
 *   <ui-card-footer><button ui-button>Open</button></ui-card-footer>
 * </ui-card>
 */
@Component({
  selector: 'ui-card',
  template: '<ng-content />',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-card',
    '[class]': '["ui-card--" + appearance(), "ui-card--padding-" + padding()]',
  },
})
export class UiCard {
  /** `outlined` draws a border; `elevated` adds a shadow instead. */
  readonly appearance = input<'outlined' | 'elevated'>('outlined');
  /** Inner spacing. Use `none` for edge-to-edge content such as images or tables. */
  readonly padding = input<'none' | 'sm' | 'md' | 'lg'>('md');
}

/** Top row of a card: title and subtitle, plus optional `[uiCardHeaderAside]` content at the end. */
@Component({
  selector: 'ui-card-header',
  template: `
    <div class="ui-card-header__text"><ng-content /></div>
    <ng-content select="[uiCardHeaderAside]" />
  `,
  styleUrl: './card-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-card-header' },
})
export class UiCardHeader {}

/** Card title. Apply to a heading of the level that fits the page outline. */
@Component({
  selector: '[ui-card-title]',
  template: '<ng-content />',
  styleUrl: './card-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-card-title' },
})
export class UiCardTitle {}

/** Secondary text under the title. */
@Component({
  selector: '[ui-card-subtitle]',
  template: '<ng-content />',
  styleUrl: './card-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-card-subtitle' },
})
export class UiCardSubtitle {}

/** Main body of a card. */
@Component({
  selector: 'ui-card-content',
  template: '<ng-content />',
  styleUrl: './card-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-card-content' },
})
export class UiCardContent {}

/** Bottom row of a card, usually actions. Aligned to the end (the left side in RTL). */
@Component({
  selector: 'ui-card-footer',
  template: '<ng-content />',
  styleUrl: './card-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-card-footer',
    '[class.ui-card-footer--start]': 'align() === "start"',
  },
})
export class UiCardFooter {
  readonly align = input<'start' | 'end'>('end');
}
