import { ElementRef, Provider, inject } from '@angular/core';
import {
  TREE_KEY_MANAGER,
  TreeKeyManager,
  TreeKeyManagerFactory,
  TreeKeyManagerItem,
  TreeKeyManagerOptions,
} from '@angular/cdk/a11y';
import { resolveDirection } from '@vplans/ui-kit/core';

/**
 * CDK's tree key manager with ←/→ that follow the direction at the time of the key press. CDK
 * reads `Directionality` once, when the tree starts, so a runtime switch to RTL kept the LTR
 * arrows. The manager runs as LTR and swaps the two arrows itself while the host is RTL.
 */
class UiTreeKeyManager<T extends TreeKeyManagerItem> extends TreeKeyManager<T> {
  constructor(
    items: Parameters<TreeKeyManagerFactory<T>>[0],
    options: TreeKeyManagerOptions<T>,
    private readonly host: Element,
  ) {
    super(items, { ...options, horizontalOrientation: 'ltr' });
  }

  override onKeydown(event: KeyboardEvent): void {
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    if (!horizontal || resolveDirection(this.host) !== 'rtl') {
      super.onKeydown(event);
      return;
    }
    const key = event.key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    const { altKey, ctrlKey, metaKey, shiftKey } = event;
    super.onKeydown(new KeyboardEvent('keydown', { key, altKey, ctrlKey, metaKey, shiftKey }));
    event.preventDefault();
  }
}

/** Provides the key manager of `ui-tree`; resolves the direction from the host element. */
export function provideUiTreeKeyManager(): Provider {
  return {
    provide: TREE_KEY_MANAGER,
    useFactory: (): TreeKeyManagerFactory<TreeKeyManagerItem> => {
      const host = inject<ElementRef<Element>>(ElementRef).nativeElement;
      return (items, options) => new UiTreeKeyManager(items, options, host);
    },
  };
}
