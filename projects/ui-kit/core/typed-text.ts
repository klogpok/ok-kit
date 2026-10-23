import { type Signal, type WritableSignal, computed, linkedSignal } from '@angular/core';

/** What `parse` reads from typed text: a value, or the code of a parse error. Internal. */
export interface UiTypedTextParse<V, E = string> {
  value: V | null;
  error: E | null;
}

/** The value model of a parsed text field and its value rules. Internal. */
export interface UiTypedTextConfig<V, T = string, E = string> {
  /** The field's value model. */
  value: WritableSignal<V | null>;
  /** Tells the form about a value the user changed (the field's `notifyChange`). */
  notify(value: V | null): void;
  /** Blank text gives `{ value: null, error: null }`. */
  parse(text: T): UiTypedTextParse<V, E>;
  format(value: V | null): T;
  /** The readable value, or `null`. */
  valid(raw: unknown): V | null;
  /** Whether two readable values are the same value. */
  equals(a: V, b: V): boolean;
  /** The value a valid commit settles on, e.g. rounded and clamped. Without it the value is kept. */
  commitValue?(value: V): V;
}

/**
 * The typed text of a parsed text field. Internal. The members are properties, so a field can
 * take `text` and `error` as its own signals and pass the functions on unbound.
 */
export interface UiTypedText<V, T = string, E = string> {
  /** The typed text while there is one, otherwise the formatted value. */
  readonly text: Signal<T>;
  /** The parse error code of committed typed text, otherwise `null`. */
  readonly error: Signal<E | null>;
  /** The user typed `text`: writes and notifies its value unless the field holds it already. */
  readonly input: (text: T) => void;
  /** The user left the field or pressed Enter: invalid text stays with its error, other text goes. */
  readonly commit: () => void;
  /** The user picked `value`: drops the typed text, then writes and notifies a new value. */
  readonly set: (value: V | null) => void;
  /** For `writeValue`: drops the typed text and stores the readable value without notifying. */
  readonly write: (value: unknown) => void;
}

/** Text the user is typing and what it parsed to. */
interface Typed<V, T, E> extends UiTypedTextParse<V, E> {
  text: T;
  /** Committed: a parse error now shows. */
  committed: boolean;
}

/**
 * The typed text of a parsed text field (date, date range, time, number): the text the user is
 * typing, its commit and parse error, and writing the value with the "same value" rule. The field
 * keeps the DOM, keys, blur and touched, and turns the error code into a message.
 *
 * Call it in a field initializer after the value model. It calls nothing from `config` while it is
 * created, so the rules may read fields declared after it. Internal.
 */
export function ɵinjectTypedText<V, T = string, E = string>(
  config: UiTypedTextConfig<V, T, E>,
): UiTypedText<V, T, E> {
  /** `value` is `raw`, or both are readable and equal. */
  function same(value: V | null, raw: unknown): boolean {
    if (value === raw) return true;
    const readable = config.valid(raw);
    return value !== null && readable !== null && config.equals(value, readable);
  }

  /** Kept only while it holds the field's value, so old text does not come back. */
  const typed = linkedSignal<V | null, Typed<V, T, E> | null>({
    source: () => config.value(),
    computation: (value, previous) => {
      const kept = previous?.value;
      return kept && same(kept.value, value) ? kept : null;
    },
  });
  const text = computed(() => typed()?.text ?? config.format(config.valid(config.value())));
  const error = computed(() => {
    const current = typed();
    return current?.committed ? current.error : null;
  });

  /** Writes and notifies a value the field does not hold yet. */
  function change(value: V | null): void {
    if (same(value, config.value())) return;
    config.value.set(value);
    config.notify(value);
  }

  function set(value: V | null): void {
    typed.set(null);
    change(value);
  }

  return {
    text,
    error,
    input: (input) => {
      const parsed = config.parse(input);
      typed.set({ text: input, ...parsed, committed: false });
      change(parsed.value);
    },
    commit: () => {
      const current = typed();
      if (!current) return;
      if (current.error !== null) {
        typed.set({ ...current, committed: true });
      } else if (current.value !== null && config.commitValue) {
        set(config.commitValue(current.value));
      } else {
        typed.set(null);
      }
    },
    set,
    write: (value) => {
      typed.set(null);
      config.value.set(config.valid(value));
    },
  };
}
