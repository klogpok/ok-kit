import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

/** Form of a skeleton placeholder. */
export type UiSkeletonShape = 'text' | 'rect' | 'circle';

/**
 * Gray placeholder shown while content loads. `text` draws one bar per line (the last line is
 * shorter), `rect` a block (image, card), `circle` an avatar.
 *
 * Skeletons are always hidden from assistive technologies. Mark the loading container with
 * `aria-busy="true"` and give it a name or a status text instead. The shimmer stops when the user
 * prefers reduced motion.
 *
 * @example <ui-skeleton lines="3" />
 * @example <ui-skeleton shape="circle" width="2.5rem" />
 * @example
 * <div aria-busy="true" aria-label="Loading plans"><ui-skeleton shape="rect" height="8rem" /></div>
 */
@Component({
  selector: 'ui-skeleton',
  template: `
    @for (line of lineList(); track line) {
      <span class="ui-skeleton__bone"></span>
    }
  `,
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-skeleton',
    '[class]': '"ui-skeleton--" + shape()',
    'aria-hidden': 'true',
    '[style.inline-size]': 'width()',
    '[style.block-size]': 'shape() === "circle" ? null : height()',
    '[style.--_circle-size]': 'shape() === "circle" ? width() || height() : null',
  },
})
export class UiSkeleton {
  readonly shape = input<UiSkeletonShape>('text');
  /** Any CSS length, e.g. `12rem` or `60%`. Text fills its container by default. */
  readonly width = input<string | null>(null);
  /** Any CSS length. For `circle`, used as the size when `width` is not set. */
  readonly height = input<string | null>(null);
  /** Number of text lines. Only used by `shape="text"`. */
  readonly lines = input(1, { transform: numberAttribute });

  protected readonly lineList = computed(() => {
    const count = this.shape() === 'text' ? Math.max(1, Math.floor(this.lines()) || 1) : 1;
    return Array.from({ length: count }, (_, i) => i);
  });
}
