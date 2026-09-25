/**
 * Text direction of an element, read from the closest `dir` attribute at call time.
 * Unlike the CDK `Directionality` service it follows runtime changes of `dir` on `<html>`.
 */
export function resolveDirection(element: Element): 'ltr' | 'rtl' {
  return element.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl' ? 'rtl' : 'ltr';
}
