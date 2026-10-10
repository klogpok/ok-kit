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

/**
 * Like `uiModifier()`, for a modifier the component always sets: throws when the element has
 * none of the classes (it is not the kit's component, or the component changed). Internal.
 */
export async function uiRequiredModifier<T extends string>(
  element: TestElement,
  prefix: string,
  values: readonly T[],
  name: string,
): Promise<T> {
  const value = await uiModifier(element, prefix, values);
  if (value === null) {
    throw Error(`The element has no ${name} class (${values.map((v) => prefix + v).join(', ')}).`);
  }
  return value;
}
