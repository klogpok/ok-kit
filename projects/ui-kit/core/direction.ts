/**
 * Text direction of an element, read from the closest `dir` attribute at call time.
 * Unlike the CDK `Directionality` service it follows runtime changes of `dir` on `<html>`.
 *
 * `dir="auto"` (common on inputs with mixed Hebrew/English text) and invalid values are skipped,
 * so an overlay opened from such an element takes the direction of the page around it.
 */
export function resolveDirection(element: Element): 'ltr' | 'rtl' {
  for (
    let el: Element | null = element.closest('[dir]');
    el;
    el = el.parentElement?.closest('[dir]') ?? null
  ) {
    const dir = el.getAttribute('dir')?.toLowerCase();
    if (dir === 'rtl' || dir === 'ltr') return dir;
  }
  return 'ltr';
}

/**
 * Horizontal offset that keeps a connected overlay on its origin. The CDK places overlays in
 * viewport coordinates from 0, but the fixed overlay container starts after a page scrollbar on
 * the left (Chrome draws it there in an RTL document inside an iframe, e.g. Storybook), so every
 * overlay would move by the scrollbar width. Read it each time the overlay opens.
 */
export function overlayOffsetX(document: Document): number {
  // A fixed element starts where the overlay container does. The container itself may not be
  // fixed yet: the CDK loads its styles with the first overlay.
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden';
  document.body.appendChild(probe);
  const left = probe.getBoundingClientRect().left;
  probe.remove();
  return -left || 0;
}
