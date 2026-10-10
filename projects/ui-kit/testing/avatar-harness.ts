import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import type { UiAvatarSize } from '@vplans/ui-kit/avatar';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiAvatarHarnessFilters extends BaseHarnessFilters {
  /** The accessible name (the `name` of an avatar that is not decorative). */
  name?: string | RegExp;
}

export interface UiAvatarGroupHarnessFilters extends BaseHarnessFilters {
  /** `aria-label` of the group. */
  label?: string | RegExp;
}

const SIZES: readonly UiAvatarSize[] = ['sm', 'md', 'lg', 'xl'];
const SHAPES = ['circle', 'square'] as const;

/** Harness for `ui-avatar`. */
export class UiAvatarHarness extends UiHarness {
  static hostSelector = '.ui-avatar';

  private readonly image = this.locatorForOptional('.ui-avatar__image');

  static with<T extends UiAvatarHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiAvatarHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('name', options.name, (harness, name) =>
      HarnessPredicate.stringMatches(harness.getName(), name),
    );
  }

  /**
   * The name screen readers read: the label of the initials or the `alt` of the image. `null`
   * for a decorative avatar or one without a name.
   */
  async getName(): Promise<string | null> {
    const image = await this.image();
    const name = image
      ? await image.getAttribute('alt')
      : await (await this.host()).getAttribute('aria-label');
    return name === '' ? null : name;
  }

  /** The initials shown instead of an image, or `''` (an image or the person icon). */
  async getInitials(): Promise<string> {
    const initials = await this.locatorForOptional('.ui-avatar__initials')();
    return initials ? initials.text() : '';
  }

  /** Whether the image of `src` is shown (it has not failed to load). */
  async hasImage(): Promise<boolean> {
    return (await this.image()) !== null;
  }

  /** Hidden from screen readers: `decorative`, or no name. */
  async isDecorative(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-hidden')) === 'true';
  }

  /** Hidden behind the "+N" counter of its group. */
  async isHidden(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('hidden');
  }

  async getSize(): Promise<UiAvatarSize> {
    return (await uiModifier(await this.host(), 'ui-avatar--', SIZES))!;
  }

  async getShape(): Promise<'circle' | 'square'> {
    return (await uiModifier(await this.host(), 'ui-avatar--', SHAPES))!;
  }
}

/** Harness for `ui-avatar-group` (avatars: `UiAvatarHarness`). */
export class UiAvatarGroupHarness extends UiHarness {
  static hostSelector = '.ui-avatar-group';

  static with<T extends UiAvatarGroupHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiAvatarGroupHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** The avatars shown, without those hidden behind the "+N" counter. */
  async getAvatars(filters: UiAvatarHarnessFilters = {}): Promise<UiAvatarHarness[]> {
    const avatars = await this.locatorForAll(UiAvatarHarness.with(filters))();
    const hidden = await Promise.all(avatars.map((avatar) => avatar.isHidden()));
    return avatars.filter((_, index) => !hidden[index]);
  }

  /** The N of the "+N" counter; `0` when every avatar is shown. */
  async getHiddenCount(): Promise<number> {
    const more = await this.locatorForOptional('.ui-avatar-group__more')();
    return more ? Number((await more.text()).replace(/\D/g, '')) : 0;
  }
}
