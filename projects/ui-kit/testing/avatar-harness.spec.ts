import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiAvatar, UiAvatarGroup } from '@vplans/ui-kit/avatar';
import { UiAvatarGroupHarness, UiAvatarHarness } from './avatar-harness';

@Component({
  imports: [UiAvatar, UiAvatarGroup],
  template: `
    <ui-avatar name="Dana Levi" size="lg" />
    <ui-avatar name="Noa Cohen" src="/noa.png" shape="square" />
    <ui-avatar name="Yossi Mizrahi" decorative />
    <ui-avatar />
    <ui-avatar-group max="2" size="sm" aria-label="Coordinators">
      <ui-avatar name="Avi Ben" />
      <ui-avatar name="Rina Tal" />
      <ui-avatar name="Omer Gal" />
      <ui-avatar name="Lior Dan" />
    </ui-avatar-group>
  `,
})
class Host {}

describe('UiAvatarHarness and UiAvatarGroupHarness', () => {
  let loader: HarnessLoader;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds avatars by name', async () => {
    expect(await loader.getAllHarnesses(UiAvatarHarness)).toHaveLength(8);
    expect(await loader.getAllHarnesses(UiAvatarHarness.with({ name: /Levi|Cohen/ }))).toHaveLength(
      2,
    );
  });

  it('reads the name, initials, image and look', async () => {
    const dana = await loader.getHarness(UiAvatarHarness.with({ name: 'Dana Levi' }));
    expect(await dana.getInitials()).toBe('DL');
    expect(await dana.hasImage()).toBe(false);
    expect(await dana.getSize()).toBe('lg');
    expect(await dana.getShape()).toBe('circle');
    expect(await dana.isDecorative()).toBe(false);

    const noa = await loader.getHarness(UiAvatarHarness.with({ name: 'Noa Cohen' }));
    expect(await noa.hasImage()).toBe(true);
    expect(await noa.getInitials()).toBe('');
    expect(await noa.getShape()).toBe('square');
    expect(await noa.getSize()).toBe('md');
  });

  it('has no name when it is decorative or nameless', async () => {
    const [, , yossi, empty] = await loader.getAllHarnesses(UiAvatarHarness);
    expect(await yossi.getName()).toBeNull();
    expect(await yossi.getInitials()).toBe('YM');
    expect(await yossi.isDecorative()).toBe(true);
    expect(await empty.getName()).toBeNull();
    expect(await empty.getInitials()).toBe('');
    expect(await empty.isDecorative()).toBe(true);
  });

  it('reads the avatars a group shows and the hidden count', async () => {
    const group = await loader.getHarness(UiAvatarGroupHarness.with({ label: 'Coordinators' }));
    expect(await group.getLabel()).toBe('Coordinators');
    const shown = await group.getAvatars();
    expect(await Promise.all(shown.map((avatar) => avatar.getName()))).toEqual([
      'Avi Ben',
      'Rina Tal',
    ]);
    expect(await shown[0].getSize()).toBe('sm');
    expect(await group.getAvatars({ name: 'Lior Dan' })).toEqual([]);
    expect(await group.getHiddenCount()).toBe(2);
  });
});
