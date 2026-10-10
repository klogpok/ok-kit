import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { UiButtonHarness, UiButtonHarnessFilters } from './button-harness';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiEmptyStateHarnessFilters extends BaseHarnessFilters {
  title?: string | RegExp;
  /** The projected description. */
  description?: string | RegExp;
}

const SIZES = ['sm', 'md'] as const;

/** Harness for `ui-empty-state`. */
export class UiEmptyStateHarness extends UiHarness {
  static hostSelector = '.ui-empty-state';

  private readonly title = this.locatorForOptional('.ui-empty-state__title');

  static with<T extends UiEmptyStateHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiEmptyStateHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('title', options.title, (harness, title) =>
        HarnessPredicate.stringMatches(harness.getTitle(), title),
      )
      .addOption('description', options.description, (harness, description) =>
        HarnessPredicate.stringMatches(harness.getDescription(), description),
      );
  }

  /** The title, or `''`. */
  async getTitle(): Promise<string> {
    const title = await this.title();
    return title ? title.text() : '';
  }

  /** Level of the title in the page outline; `null` without a title. */
  async getHeadingLevel(): Promise<number | null> {
    const title = await this.title();
    return title ? Number(await title.getAttribute('aria-level')) : null;
  }

  /** The projected description (without the icon, the media and the actions). */
  async getDescription(): Promise<string> {
    return (await this.locatorFor('.ui-empty-state__description')()).text();
  }

  /** The `[uiEmptyStateActions]` buttons and links. */
  async getActions(filters: UiButtonHarnessFilters = {}): Promise<UiButtonHarness[]> {
    return (await this.getChildLoader('.ui-empty-state__actions')).getAllHarnesses(
      UiButtonHarness.with(filters),
    );
  }

  async getSize(): Promise<'sm' | 'md'> {
    return (await uiModifier(await this.host(), 'ui-empty-state--', SIZES))!;
  }
}
