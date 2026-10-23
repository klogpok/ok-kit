import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { type UiTypedText, ɵinjectTypedText } from './typed-text';

/**
 * A small string-to-number rule set. Numbers that round to the same cent are the same value, so
 * the module's "same value" rule is visibly `equals`, not `===`. A numeric string is readable too.
 */
function setup(options: { commitValue?: (value: number) => number } = {}) {
  const value = signal<number | null>(null);
  const notify = vi.fn<(value: number | null) => void>();
  const typed: UiTypedText<number> = TestBed.runInInjectionContext(() =>
    ɵinjectTypedText<number>({
      value,
      notify,
      parse: (text) => {
        if (!text.trim()) return { value: null, error: null };
        const number = Number(text);
        return Number.isFinite(number)
          ? { value: number, error: null }
          : { value: null, error: 'invalid' };
      },
      format: (number) => (number === null ? '' : number.toFixed(2)),
      valid: (raw) => {
        const number = typeof raw === 'string' && raw.trim() ? Number(raw) : raw;
        return typeof number === 'number' && Number.isFinite(number) ? number : null;
      },
      equals: (a, b) => Math.round(a * 100) === Math.round(b * 100),
      commitValue: options.commitValue,
    }),
  );
  return { value, notify, typed };
}

describe('ɵinjectTypedText', () => {
  it('writes and notifies the value of typed text, and shows the text as typed', () => {
    const { value, notify, typed } = setup();

    typed.input('12.5');

    expect(value()).toBe(12.5);
    expect(notify).toHaveBeenCalledExactlyOnceWith(12.5);
    expect(typed.text()).toBe('12.5');
    expect(typed.error()).toBeNull();
  });

  it('does not notify typed text of the same value by `equals`, and keeps the text', () => {
    const { value, notify, typed } = setup();
    value.set(12.5);

    typed.input('12.501');

    expect(value()).toBe(12.5);
    expect(notify).not.toHaveBeenCalled();
    expect(typed.text()).toBe('12.501');
  });

  it('drops the typed text when a different value is written to the model', () => {
    const { value, typed } = setup();
    typed.input('12.5');

    value.set(7);

    expect(typed.text()).toBe('7.00');
  });

  it('drops the typed text when an unreadable value is written to the model', () => {
    const { value, typed } = setup();
    typed.input('12.5');

    value.set(Number.NaN);

    expect(typed.text()).toBe('');
  });

  it('keeps the typed text when the same value is written to the model', () => {
    const { value, typed } = setup();
    typed.input('12.5');

    value.set(12.501);
    expect(typed.text()).toBe('12.5');

    // A readable value of another type is the same value too.
    (value as unknown as { set(raw: unknown): void }).set('12.50');
    expect(typed.text()).toBe('12.5');
  });

  it('writes and notifies typed text over a value it cannot read', () => {
    const { value, notify, typed } = setup();
    value.set(Number.NaN);

    typed.input('abc');

    expect(value()).toBeNull();
    expect(notify).toHaveBeenCalledExactlyOnceWith(null);
    expect(typed.text()).toBe('abc');
  });

  it('reports no error for invalid text before a commit', () => {
    const { value, notify, typed } = setup();
    value.set(4);

    typed.input('12x');

    expect(value()).toBeNull();
    expect(notify).toHaveBeenCalledExactlyOnceWith(null);
    expect(typed.text()).toBe('12x');
    expect(typed.error()).toBeNull();
  });

  it('commit of valid text drops it and shows the formatted value', () => {
    const { value, notify, typed } = setup();
    typed.input('12.5');
    notify.mockClear();

    typed.commit();

    expect(typed.text()).toBe('12.50');
    expect(typed.error()).toBeNull();
    expect(value()).toBe(12.5);
    expect(notify).not.toHaveBeenCalled();
  });

  it('commit of invalid text keeps it and reports the error code', () => {
    const { typed } = setup();
    typed.input('12x');

    typed.commit();

    expect(typed.text()).toBe('12x');
    expect(typed.error()).toBe('invalid');
  });

  it('typing again after a commit hides the error until the next commit', () => {
    const { typed } = setup();
    typed.input('12x');
    typed.commit();

    typed.input('12xy');

    expect(typed.error()).toBeNull();
  });

  it('commit of blank text drops it', () => {
    const { value, typed } = setup();
    value.set(4);
    typed.input('  ');

    typed.commit();

    expect(value()).toBeNull();
    expect(typed.text()).toBe('');
    expect(typed.error()).toBeNull();
  });

  it('commit without typed text does nothing', () => {
    const { value, notify, typed } = setup({ commitValue: (number) => Math.round(number) });
    value.set(4.4);

    typed.commit();

    expect(value()).toBe(4.4);
    expect(notify).not.toHaveBeenCalled();
    expect(typed.text()).toBe('4.40');
  });

  it('a valid commit writes the value `commitValue` settles on and notifies it once', () => {
    const { value, notify, typed } = setup({ commitValue: (number) => Math.min(number, 10) });
    typed.input('12.5');
    notify.mockClear();

    typed.commit();

    expect(value()).toBe(10);
    expect(typed.text()).toBe('10.00');
    expect(notify).toHaveBeenCalledExactlyOnceWith(10);
  });

  it('a valid commit that settles on the same value does not notify', () => {
    const { value, notify, typed } = setup({ commitValue: (number) => Math.min(number, 10) });
    typed.input('7');
    notify.mockClear();

    typed.commit();

    expect(value()).toBe(7);
    expect(notify).not.toHaveBeenCalled();
  });

  it('write() drops the typed text and stores the readable value without notifying', () => {
    const { value, notify, typed } = setup();
    typed.input('12x');
    typed.commit();
    notify.mockClear();

    typed.write(12.5);

    expect(value()).toBe(12.5);
    expect(typed.text()).toBe('12.50');
    expect(typed.error()).toBeNull();
    expect(notify).not.toHaveBeenCalled();
  });

  it('write() drops the typed text also for the same value', () => {
    const { typed } = setup();
    typed.input('12.501');

    typed.write(12.5);

    expect(typed.text()).toBe('12.50');
  });

  it('write() stores an unreadable value as null', () => {
    const { value, typed } = setup();

    typed.write(Number.NaN);
    expect(value()).toBeNull();

    typed.write('7');
    expect(value()).toBe(7);
  });

  it('calls none of its rules while it is created', () => {
    const rules = {
      notify: vi.fn(),
      parse: vi.fn(),
      format: vi.fn(),
      valid: vi.fn(),
      equals: vi.fn(),
      commitValue: vi.fn(),
    };

    TestBed.runInInjectionContext(() =>
      ɵinjectTypedText<number>({ value: signal<number | null>(1), ...rules }),
    );

    for (const rule of Object.values(rules)) expect(rule).not.toHaveBeenCalled();
  });

  it('set() drops a committed error, also for the same value', () => {
    const { typed } = setup();
    typed.input('12x');
    typed.commit();

    typed.set(null);

    expect(typed.text()).toBe('');
    expect(typed.error()).toBeNull();
  });

  it('set() drops the typed text also for the same value, and notifies only a change', () => {
    const { value, notify, typed } = setup();
    typed.input('12.5');
    notify.mockClear();

    typed.set(12.5);

    expect(typed.text()).toBe('12.50');
    expect(notify).not.toHaveBeenCalled();

    typed.set(3);

    expect(value()).toBe(3);
    expect(typed.text()).toBe('3.00');
    expect(notify).toHaveBeenCalledExactlyOnceWith(3);
  });
});
