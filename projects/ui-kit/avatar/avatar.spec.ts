import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiAvatar, UiAvatarGroup, UiAvatarSize, uiAvatarColor, uiInitials } from './avatar';

describe('uiInitials', () => {
  it('takes the first letters of the first and last words', () => {
    expect(uiInitials('Dana Levi')).toBe('DL');
    expect(uiInitials('  noa   bat   friedman ')).toBe('NF');
    expect(uiInitials('Noa')).toBe('N');
    expect(uiInitials('דנה לוי')).toBe('דל');
  });

  it('skips words without letters', () => {
    expect(uiInitials('Dana - Levi (2)')).toBe('DL');
    expect(uiInitials('"Yossi"')).toBe('Y');
    expect(uiInitials('  ')).toBe('');
    expect(uiInitials('42')).toBe('');
  });
});

describe('uiAvatarColor', () => {
  it('gives the same name the same color from 1 to 8', () => {
    const names = ['Dana Levi', 'Yossi Peretz', 'Noa Friedman', 'David Cohen', 'דנה לוי', 'A'];
    for (const name of names) {
      const color = uiAvatarColor(name);
      expect(color).toBeGreaterThanOrEqual(1);
      expect(color).toBeLessThanOrEqual(8);
      expect(uiAvatarColor(` ${name} `)).toBe(color);
    }
    expect(new Set(names.map(uiAvatarColor)).size).toBeGreaterThan(1);
  });
});

@Component({
  imports: [UiAvatar],
  template: `
    <ui-avatar id="avatar" [name]="name()" [src]="src()" [size]="size()" shape="square" />
    <ui-avatar id="anonymous" />
    <ui-avatar id="decorative" name="Dana Levi" decorative />
  `,
})
class AvatarHost {
  readonly name = signal('Dana Levi');
  readonly src = signal<string | null>(null);
  readonly size = signal<UiAvatarSize | undefined>(undefined);
}

describe('UiAvatar', () => {
  let fixture: ComponentFixture<AvatarHost>;
  const el = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`)!;
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(AvatarHost);
    await render();
  });

  it('shows the initials on a color from the name, labelled by the name', () => {
    const avatar = el('avatar');
    const initials = avatar.querySelector('.ui-avatar__initials')!;
    expect(initials.textContent).toBe('DL');
    expect(initials.getAttribute('aria-hidden')).toBe('true');
    expect(avatar.getAttribute('role')).toBe('img');
    expect(avatar.getAttribute('aria-label')).toBe('Dana Levi');
    expect(avatar.classList).toContain(`ui-avatar--color-${uiAvatarColor('Dana Levi')}`);
    expect([...avatar.classList]).toEqual(
      expect.arrayContaining(['ui-avatar--md', 'ui-avatar--square']),
    );
  });

  it('shows the image with the name as alt, and the initials when it fails', async () => {
    fixture.componentInstance.src.set('data:image/png;base64,broken');
    await render();
    const img = el('avatar').querySelector('img')!;
    expect(img.alt).toBe('Dana Levi');
    expect(el('avatar').hasAttribute('role')).toBe(false);
    expect(el('avatar').classList).toContain('ui-avatar--fallback');

    img.dispatchEvent(new Event('error'));
    await render();
    expect(el('avatar').querySelector('img')).toBeNull();
    expect(el('avatar').querySelector('.ui-avatar__initials')?.textContent).toBe('DL');

    // A new source is tried again.
    fixture.componentInstance.src.set('data:image/png;base64,other');
    await render();
    expect(el('avatar').querySelector('img')).not.toBeNull();
  });

  it('is a decorative person icon without a name', () => {
    const avatar = el('anonymous');
    expect(avatar.querySelector('ui-icon')).not.toBeNull();
    expect(avatar.getAttribute('aria-hidden')).toBe('true');
    expect(avatar.hasAttribute('role')).toBe(false);
    expect(avatar.classList).toContain('ui-avatar--fallback');
  });

  it('can be hidden from assistive technologies when the name is shown next to it', () => {
    const avatar = el('decorative');
    expect(avatar.getAttribute('aria-hidden')).toBe('true');
    expect(avatar.hasAttribute('aria-label')).toBe(false);
    expect(avatar.querySelector('.ui-avatar__initials')?.textContent).toBe('DL');
  });

  it('follows the size', async () => {
    fixture.componentInstance.size.set('xl');
    await render();
    expect(el('avatar').classList).toContain('ui-avatar--xl');
  });
});

@Component({
  imports: [UiAvatar, UiAvatarGroup],
  template: `
    <ui-avatar-group [max]="max()" size="sm" aria-label="Coordinators">
      @for (name of names(); track name) {
        <ui-avatar [name]="name" />
      }
    </ui-avatar-group>
    <ui-avatar-group id="plain"><ui-avatar name="Noa" size="lg" /></ui-avatar-group>
  `,
})
class GroupHost {
  readonly max = signal<number | null>(2);
  readonly names = signal(['Dana Levi', 'Yossi Peretz', 'Noa Friedman', 'David Cohen']);
}

describe('UiAvatarGroup', () => {
  let fixture: ComponentFixture<GroupHost>;
  const root = () => fixture.nativeElement as HTMLElement;
  const avatars = () => [...root().querySelectorAll<HTMLElement>('ui-avatar-group ui-avatar')];
  const more = () => root().querySelector('.ui-avatar-group__more');
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideUiLabels(UI_LABELS_EN)] });
    fixture = TestBed.createComponent(GroupHost);
    await render();
  });

  it('shows the first max avatars and a +N counter', () => {
    expect(avatars().map((a) => a.hidden)).toEqual([false, false, true, true, false]);
    expect(more()?.textContent.trim()).toBe('+2');
    expect(more()?.getAttribute('role')).toBe('img');
    expect(more()?.getAttribute('aria-label')).toBe('2 more');
  });

  it('passes its size to avatars without their own size', () => {
    const [first] = avatars();
    expect(first.classList).toContain('ui-avatar--sm');
    expect(first.classList).toContain('ui-avatar--grouped');
    expect(root().querySelector('#plain ui-avatar')?.classList).toContain('ui-avatar--lg');
    expect(more()?.classList).toContain('ui-avatar-group__more--sm');
  });

  it('is a named group only with a label', () => {
    const [group, plain] = [...root().querySelectorAll('ui-avatar-group')];
    expect(group.getAttribute('role')).toBe('group');
    expect(plain.hasAttribute('role')).toBe(false);
  });

  it('follows max and the number of avatars', async () => {
    fixture.componentInstance.max.set(null);
    await render();
    expect(avatars().every((a) => !a.hidden)).toBe(true);
    expect(more()).toBeNull();

    fixture.componentInstance.max.set(1);
    fixture.componentInstance.names.update((names) => [...names, 'Tal Mor']);
    await render();
    expect(more()?.textContent.trim()).toBe('+4');
  });
});
