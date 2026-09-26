import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, minLength } from '@angular/forms/signals';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiChipInput } from './chip-input';

const KEY_CODES: Record<string, number> = {
  ArrowLeft: 37,
  ArrowRight: 39,
  Backspace: 8,
  Enter: 13,
};

function keydown(target: Element, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    keyCode: KEY_CODES[key] ?? 0,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

@Component({
  imports: [UiChipInput, UiFormField],
  template: `
    <div [attr.dir]="dir()">
      <ui-form-field label="Tags">
        <ui-chip-input
          [(value)]="tags"
          [addOnBlur]="addOnBlur()"
          [allowDuplicates]="duplicates()"
          [separators]="[',', ';']"
          [disabled]="disabled()"
          [readonly]="readonly()"
          placeholder="Add a tag"
        />
      </ui-form-field>
      <button id="outside">Outside</button>
    </div>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly tags = signal<readonly string[]>(['north']);
  readonly addOnBlur = signal(true);
  readonly duplicates = signal(false);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
}

describe('UiChipInput', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  let announce: ReturnType<typeof vi.spyOn>;
  const input = () => root.querySelector<HTMLInputElement>('.ui-chip-input__input')!;
  const chips = () => [...root.querySelectorAll('ui-chip')].map((c) => c.textContent.trim());
  const removeButtons = () => [...root.querySelectorAll<HTMLButtonElement>('.ui-chip__remove')];
  const type = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
  };
  const press = async (key: string) => {
    const event = keydown(input(), key);
    await settle(fixture);
    return event;
  };
  const leave = async () => {
    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    input().dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: root.querySelector('#outside') }),
    );
    await settle(fixture);
  };

  beforeEach(async () => {
    announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('labels the text field and the chip list', () => {
    const label = root.querySelector('label')!;
    expect(label.htmlFor).toBe(input().id);
    expect(root.querySelector('ui-chip-set')!.getAttribute('aria-labelledby')).toBe(label.id);
    expect(chips()).toEqual(['north']);
    expect(input().placeholder).toBe('Add a tag');
  });

  it('adds trimmed text with Enter or a separator', async () => {
    await type('  south ');
    expect((await press('Enter')).defaultPrevented).toBe(true);
    expect(host.tags()).toEqual(['north', 'south']);
    expect(input().value).toBe('');

    await type('east');
    await press(';');
    expect(host.tags()).toEqual(['north', 'south', 'east']);
    expect(chips()).toEqual(['north', 'south', 'east']);
  });

  it('lets Enter submit the form when the field is empty', async () => {
    expect((await press('Enter')).defaultPrevented).toBe(false);
  });

  it('skips duplicates unless allowed', async () => {
    await type('North');
    await press('Enter');
    expect(host.tags()).toEqual(['north']);
    host.duplicates.set(true);
    await settle(fixture);
    await type('North');
    await press('Enter');
    expect(host.tags()).toEqual(['north', 'North']);
  });

  it('splits pasted text at the separators and line breaks', async () => {
    const paste = new Event('paste', { cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', {
      value: { getData: () => 'a, b;c\nd' },
    });
    input().dispatchEvent(paste);
    await settle(fixture);
    expect(paste.defaultPrevented).toBe(true);
    expect(host.tags()).toEqual(['north', 'a', 'b', 'c', 'd']);
  });

  it('removes the last chip with Backspace in the empty field', async () => {
    host.tags.set(['a', 'b']);
    await settle(fixture);
    await type('x');
    await press('Backspace');
    expect(host.tags()).toEqual(['a', 'b']);
    await type('');
    await press('Backspace');
    expect(host.tags()).toEqual(['a']);
    expect(announce).toHaveBeenCalledWith('b הוסר', 'polite');
  });

  it('adds the typed text and marks touched when focus leaves', async () => {
    await type('west');
    await leave();
    expect(host.tags()).toEqual(['north', 'west']);

    host.addOnBlur.set(false);
    await settle(fixture);
    await type('kept');
    await leave();
    expect(host.tags()).toEqual(['north', 'west']);
    expect(input().value).toBe('kept');
  });

  it('moves between the field and the chips with the arrow keys', async () => {
    host.tags.set(['a', 'b']);
    await settle(fixture);
    input().focus();
    await press('ArrowLeft');
    expect(document.activeElement).toBe(removeButtons()[1]);
    keydown(removeButtons()[1], 'ArrowRight');
    await settle(fixture);
    expect(document.activeElement).toBe(input());

    host.dir.set('rtl');
    await settle(fixture);
    await press('ArrowRight');
    expect(document.activeElement).toBe(removeButtons()[1]);
  });

  it('removes a chip with its button and returns focus to the field after the last one', async () => {
    removeButtons()[0].focus();
    removeButtons()[0].click();
    await settle(fixture);
    await settle(fixture);
    expect(host.tags()).toEqual([]);
    expect(document.activeElement).toBe(input());
  });

  it('keeps the chips while disabled or readonly', async () => {
    host.readonly.set(true);
    await settle(fixture);
    expect(removeButtons()).toHaveLength(0);
    expect(input().readOnly).toBe(true);
    await press('Backspace');
    expect(host.tags()).toEqual(['north']);

    host.readonly.set(false);
    host.disabled.set(true);
    await settle(fixture);
    expect(input().disabled).toBe(true);
    expect(removeButtons()).toHaveLength(0);
  });
});

@Component({
  imports: [UiChipInput, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="Emails">
      <ui-chip-input [formControl]="emails" />
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly emails = new FormControl<readonly string[]>([], Validators.required);
}

describe('UiChipInput with Reactive Forms', () => {
  it('binds the value both ways and reads required', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const { emails } = fixture.componentInstance;
    const input = root.querySelector('input')!;
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(emails.invalid).toBe(true);

    input.value = 'dana@vplans.com';
    input.dispatchEvent(new Event('input'));
    keydown(input, 'Enter');
    await settle(fixture);
    expect(emails.value).toEqual(['dana@vplans.com']);
    expect(emails.valid).toBe(true);

    emails.setValue(['a@b.c', 'd@e.f']);
    await settle(fixture);
    expect(root.querySelectorAll('ui-chip')).toHaveLength(2);

    emails.disable();
    await settle(fixture);
    expect(input.disabled).toBe(true);
  });
});

@Component({
  imports: [UiChipInput, UiFormField, FormField],
  template: `
    <ui-form-field label="Codes">
      <ui-chip-input [formField]="plan.codes" />
    </ui-form-field>
  `,
})
class SignalHost {
  readonly model = signal<{ codes: readonly string[] }>({ codes: ['A1'] });
  readonly plan = form(this.model, (p) => {
    minLength(p.codes, 1, { message: 'Add a code' });
  });
}

describe('UiChipInput with Signal Forms', () => {
  it('binds the value and marks the field touched', async () => {
    const fixture = TestBed.createComponent(SignalHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const host = fixture.componentInstance;
    root.querySelector<HTMLButtonElement>('.ui-chip__remove')!.click();
    await settle(fixture);
    expect(host.model().codes).toEqual([]);
    expect(host.plan.codes().invalid()).toBe(true);

    const input = root.querySelector('input')!;
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await settle(fixture);
    expect(host.plan.codes().touched()).toBe(true);
    expect(root.querySelector('.ui-form-field__error')!.textContent).toContain('Add a code');
    root.remove();
  });
});
