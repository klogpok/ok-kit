import { ContentContainerComponentHarness, TestElement } from '@angular/cdk/testing';

/** Required markers of `ui-form-field` inside its label. */
const REQUIRED_MARKERS = '.ui-form-field__required, .ui-form-field__required-text';

/**
 * Base of the kit's component harnesses. It adds focus helpers that act on the element that
 * really takes focus (the native input of a checkbox, the trigger of a select), and it can load
 * harnesses of the content (`getHarness()`), e.g. a button inside a dialog.
 *
 * Harnesses find components by their host class or tag, so tests do not depend on the internal
 * DOM. Anything a harness does not expose is internal.
 */
export abstract class UiHarness<
  S extends string = string,
> extends ContentContainerComponentHarness<S> {
  /** The element that takes focus. The host unless a subclass says otherwise. */
  protected focusTarget(): Promise<TestElement> {
    return this.host();
  }

  async focus(): Promise<void> {
    await (await this.focusTarget()).focus();
  }

  async blur(): Promise<void> {
    await (await this.focusTarget()).blur();
  }

  async isFocused(): Promise<boolean> {
    return (await this.focusTarget()).isFocused();
  }

  /**
   * Label of a form control: its `aria-label`, or the text of `label[for]` anywhere in the
   * document (e.g. the label of `ui-form-field`, without its required marker).
   */
  protected async controlLabel(control: TestElement): Promise<string | null> {
    const ariaLabel = await control.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    const id = await control.getAttribute('id');
    if (!id) return null;
    const label = await this.documentRootLocatorFactory().locatorForOptional(
      `label[for="${id}"]`,
    )();
    return label ? label.text({ exclude: REQUIRED_MARKERS }) : null;
  }
}
