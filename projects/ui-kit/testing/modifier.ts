import { TestElement } from '@angular/cdk/testing';

/** The value of the first `${prefix}${value}` class of `element`. Internal. */
export async function uiModifier<T extends string>(
  element: TestElement,
  prefix: string,
  values: readonly T[],
): Promise<T | null> {
  for (const value of values) {
    if (await element.hasClass(`${prefix}${value}`)) return value;
  }
  return null;
}
