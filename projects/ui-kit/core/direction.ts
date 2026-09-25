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
