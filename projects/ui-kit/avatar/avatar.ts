import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  linkedSignal,
  numberAttribute,
} from '@angular/core';
import { UI_LABELS } from '@vplans/ui-kit/core';
import { UiIcon, uiIconUser } from '@vplans/ui-kit/icon';

export type UiAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

/** Number of avatar colors (`--ui-avatar-color-1-*` … `--ui-avatar-color-8-*`). */
const COLORS = 8;

/**
 * Initials of a name: the first letter of the first and the last word, upper-cased
 * ("Dana Levi" → "DL", "דנה לוי" → "דל", "Noa" → "N"). Words without letters are skipped.
 */
export function uiInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .map((word) => /\p{L}/u.exec(word)?.[0])
    .filter((letter): letter is string => !!letter);
  if (!letters.length) return '';
  const initials = letters.length > 1 ? letters[0] + letters[letters.length - 1] : letters[0];
  return initials.toLocaleUpperCase();
}

/** Color index (1–8) for a name; the same name always gets the same color. */
export function uiAvatarColor(name: string): number {
  let hash = 0;
  for (const char of name.trim()) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return (hash % COLORS) + 1;
}

/** What an avatar reads from its group. */
interface UiAvatarGroupOwner {
  size(): UiAvatarSize;
  isHidden(avatar: UiAvatar): boolean;
}

/** Connects avatars to their group without adding these calls to the group's API. Internal. */
@Injectable()
class UiAvatarGroupContext {
  owner: UiAvatarGroupOwner | null = null;
}

/**
 * Picture of a person or an organization. Shows `src` when it loads, otherwise the initials of
 * `name` on a color picked from the name, otherwise a generic person icon.
 *
 * The name is the accessible name: the `alt` of the image, or the label of the initials.
 * Without a name the avatar is decorative. When the name is already shown next to the avatar,
 * set `decorative` so screen readers do not read it twice.
 *
 * @example <ui-avatar name="Dana Levi" [src]="user.photoUrl" />
 */
@Component({
  selector: 'ui-avatar',
  imports: [UiIcon],
  template: `
    @if (showImage()) {
      <img
        class="ui-avatar__image"
        [src]="src()"
        [alt]="decorative() ? '' : name()"
        (error)="failed.set(true)"
      />
    } @else if (initials()) {
      <span class="ui-avatar__initials" aria-hidden="true">{{ initials() }}</span>
    } @else {
      <ui-icon class="ui-avatar__icon" [icon]="userIcon" />
    }
  `,
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-avatar',
    '[class]': '["ui-avatar--" + effectiveSize(), "ui-avatar--" + shape(), colorClass()]',
    '[class.ui-avatar--grouped]': 'grouped',
    '[attr.role]': 'labelled() ? "img" : null',
    '[attr.aria-label]': 'labelled() ? name() : null',
    '[attr.aria-hidden]': 'decorative() || !name().trim() ? "true" : null',
    '[hidden]': 'hiddenInGroup()',
  },
})
export class UiAvatar {
  private readonly group = inject(UiAvatarGroupContext, { optional: true })?.owner ?? null;
  protected readonly grouped = !!this.group;

  /** Full name; gives the initials, the color and the accessible name. */
  readonly name = input('');
  /** Image URL. When it fails to load, the initials are shown instead. */
  readonly src = input<string | null | undefined>(null);
  /** Defaults to the size of the surrounding `ui-avatar-group`, else `md`. */
  readonly size = input<UiAvatarSize | undefined>(undefined);
  readonly shape = input<'circle' | 'square'>('circle');
  /** Hides the avatar from assistive technologies, e.g. when the name is shown next to it. */
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly userIcon = uiIconUser;
  /** Whether `src` failed to load; resets when the source changes. */
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });

  protected readonly showImage = computed(() => !!this.src() && !this.failed());
  protected readonly initials = computed(() => uiInitials(this.name()));
  protected readonly labelled = computed(
    () => !this.decorative() && !this.showImage() && !!this.name().trim(),
  );
  protected readonly colorClass = computed(() =>
    this.initials() && !this.showImage()
      ? `ui-avatar--color-${uiAvatarColor(this.name())}`
      : 'ui-avatar--fallback',
  );
  protected readonly effectiveSize = computed(() => this.size() ?? this.group?.size() ?? 'md');
  protected readonly hiddenInGroup = computed(() => this.group?.isHidden(this) ?? false);
}

/**
 * Row of overlapping avatars. With `max`, only the first avatars are shown, followed by a
 * "+N" counter whose accessible name comes from the `moreCount` label.
 *
 * Name the group when it stands for a list, e.g. `aria-label="Coordinators"`; it then gets
 * `role="group"`.
 *
 * @example
 * <ui-avatar-group max="3" aria-label="Coordinators">
 *   @for (user of users; track user.id) {
 *     <ui-avatar [name]="user.name" [src]="user.photo" />
 *   }
 * </ui-avatar-group>
 */
@Component({
  selector: 'ui-avatar-group',
  template: `
    <ng-content />
    @if (hiddenCount() > 0) {
      <span
        class="ui-avatar-group__more"
        role="img"
        [class]="'ui-avatar-group__more--' + size()"
        [attr.aria-label]="labels().moreCount(hiddenCount())"
      >
        <span aria-hidden="true">+{{ hiddenCount() }}</span>
      </span>
    }
  `,
  styleUrl: './avatar-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UiAvatarGroupContext],
  host: {
    class: 'ui-avatar-group',
    '[attr.role]': 'ariaLabel() ? "group" : null',
  },
})
export class UiAvatarGroup {
  protected readonly labels = inject(UI_LABELS);
  private readonly avatars = contentChildren(UiAvatar);

  readonly size = input<UiAvatarSize>('md');
  /** Number of avatars shown before the "+N" counter. All are shown by default. */
  readonly max = input<number, unknown>(Infinity, {
    transform: (value) => Math.max(0, numberAttribute(value, Infinity)),
  });
  readonly ariaLabel = input('', { alias: 'aria-label' });

  protected readonly hiddenCount = computed(() => Math.max(0, this.avatars().length - this.max()));

  constructor() {
    inject(UiAvatarGroupContext).owner = {
      size: () => this.size(),
      isHidden: (avatar) => this.avatars().indexOf(avatar) >= this.max(),
    };
  }
}
