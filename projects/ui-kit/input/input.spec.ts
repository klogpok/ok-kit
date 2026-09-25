import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { UiSize } from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiInput } from './input';
import { UiTextarea } from './textarea';

@Component({
  imports: [FormsModule, UiInput, UiTextarea],
  template: `
    <input ui-input [size]="size()" [invalid]="invalid()" [(ngModel)]="value" />
    <textarea ui-textarea [autosize]="autosize()" [minRows]="2"></textarea>
  `,
})
class Host {
  readonly size = signal<UiSize>('md');
  readonly invalid = signal(false);
  readonly autosize = signal(false);
  value = 'hello';
  readonly input = viewChild.required(UiInput);
}

describe('UiInput / UiTextarea', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      input: el.querySelector('input')!,
      textarea: el.querySelector('textarea')!,
      update: async (fn: (h: Host) => void) => {
        fn(fixture.componentInstance);
        fixture.detectChanges();
        await fixture.whenStable();
      },
    };
  }

  it('applies size classes and a generated id', async () => {
    const { input, update } = await setup();
    expect(input.classList).toContain('ui-input');
    expect(input.classList).toContain('ui-input--md');
    expect(input.id).toMatch(/^ui-input-/);
    await update((h) => h.size.set('lg'));
    expect(input.classList).toContain('ui-input--lg');
  });

  it('works with ngModel', async () => {
    const { input, fixture } = await setup();
    expect(input.value).toBe('hello');
    input.value = 'world';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.value).toBe('world');
  });

  it('shows the error state only after touch when bound to forms', async () => {
    const { input, update } = await setup();
    // ngModel is bound and valid, so the manual `invalid` input is ignored.
    await update((h) => h.invalid.set(true));
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('focuses the native element through the control API', async () => {
    const { input, fixture } = await setup();
    fixture.componentInstance.input().focus();
    expect(document.activeElement).toBe(input);
  });

  it('toggles textarea autosize', async () => {
    const { textarea, update } = await setup();
    expect(textarea.classList).toContain('ui-textarea');
    expect(textarea.classList).not.toContain('ui-textarea--autosize');
    await update((h) => h.autosize.set(true));
    expect(textarea.classList).toContain('ui-textarea--autosize');
  });
});

@Component({
  imports: [UiInput, UiFormField],
  template: `
    <input ui-input aria-describedby="rules" />
    <ui-form-field label="Password" hint="8 characters">
      <input ui-input aria-describedby="rules" />
    </ui-form-field>
  `,
})
class DescribedHost {}

describe('UiInput aria-describedby', () => {
  it('keeps the app description and adds the field hint after it', async () => {
    const fixture = TestBed.createComponent(DescribedHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const [alone, inField] = (fixture.nativeElement as HTMLElement).querySelectorAll('input');
    expect(alone.getAttribute('aria-describedby')).toBe('rules');
    const [own, hint] = inField.getAttribute('aria-describedby')!.split(' ');
    expect(own).toBe('rules');
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector(`#${hint}`)!.textContent).toContain('8 characters');
  });
});
