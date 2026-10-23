# Parsed text field: one module for the typed text of date, range, time and number fields

Status: ready-for-agent

Architecture work outside the phases, chosen in the architecture review of 2026-10-23 (candidate
2). Terms are from `GLOSSARY.md` → "Typed values": **parsed text field**, **typed text**,
**commit** and **parse error** were added there for this work.

## Problem Statement

The kit has four parsed text fields: `ui-datepicker`, `ui-date-range-picker`, `ui-time-input` and
`ui-number-input`. Their pure parse and format functions are tested, but each field wires the typed
text around them by hand:

- a private `Draft` interface and a `linkedSignal` that drops the typed text when the value changes
  elsewhere;
- `onInput` that parses, writes the value and notifies the form;
- `commitDraft()` on blur and Enter, a `parseError` signal and `ownErrors()`;
- `writeValue()` that drops the typed text, and a `setValue()` that skips equal values.

The four copies have already drifted:

| | keeps typed text when the value is | "same value" check on write | parse error when |
|---|---|---|---|
| datepicker | the same object, or the same day | `sameDay` against the raw value | committed, text not blank, no value |
| range picker | the same object, or the same days | `sameRange` against the readable range | committed, a field invalid or out of order |
| time input | `===` the readable time | `===` against the readable time | committed, text not blank, no value |
| number input | `===` the raw value | `===` against the raw value | committed, text re-parses to `NaN` |

So a written value the field cannot read (an Invalid Date, `"abc"` for a time) drops the typed
text in the datepicker but keeps it in the time input, and typing over it notifies the form in the
datepicker but not in the time input. Committing blank text drops the typed text in the number
input and keeps an invisible committed one in the others. A maintainer fixing a commit bug has to
find and fix it four times, and a new parsed text field would copy a fifth version.

## Solution

One deep module, **typed text**, in the `core` entry point: an internal injection function
`ɵinjectTypedText()` called in a field initializer, like `ɵinjectListbox()`. It owns the typed
text, commit, the parse error code, and writing the value with the "same value" rule and the form
notification. A field passes it its value model, a notify callback and its value rules (parse,
format, valid, equals and, for numbers, the value a commit settles on), and keeps everything else:
the DOM, the time mask, keyboard handling, blur / focus-out and touched, the listbox, the calendar,
the stepper, and turning the error code into a message.

Consumers see no change: the public inputs, outputs, methods, the DOM and the messages stay the
same, except the edge cases listed under "Aligned edge cases".

## User Stories

1. As a kit maintainer, I want the typed text of every parsed text field to live in one module, so
   that a commit or drop bug is fixed once and reaches all four fields.
2. As a kit maintainer, I want one rule for when a written value drops the typed text, so that
   date, range, time and number fields cannot drift apart again.
3. As a kit maintainer, I want one "same value" rule for writing and notifying, so that a field
   never notifies the form of a value it already holds.
4. As a kit maintainer, I want to test commit, drop and parse-error behavior without mounting a
   component, so that the state machine has its own fast spec.
5. As a kit maintainer, I want each field to pass only its value rules, so that adding a parsed
   text field means writing parse, format and equality, not the wiring around them.
6. As a kit maintainer, I want the number field to keep clamping and rounding on commit while date
   and time fields keep rejecting values outside their limits, so that each field keeps the
   meaning of its value.
7. As a kit maintainer, I want the range picker's per-field errors and its order error to fit the
   same module, so that the most drifted copy is not left out.
8. As a kit maintainer, I want parse errors stored as codes, so that changing `UI_LABELS` (for
   example the locale) shows the message in the new language.
9. As a user, I want my typed text to stay while I type and to be replaced by the formatted value
   when I leave the field, in every parsed text field alike.
10. As a user, I want invalid typed text to stay with a parse error after I leave the field, so
    that I can fix it, in every parsed text field alike.
11. As a user, I want picking a value (calendar, list of times, stepper, preset, clear, Home/End)
    to replace my typed text and its error, even when I pick the value I already have.
12. As a form author, I want the bound form control to see only values, never parse errors, as
    today.
13. As a form author, I want `setValue` / `patchValue` of the same day, range, time or number not
    to wipe the text the user is typing.

## Implementation Decisions

- **Placement.** `projects/ui-kit/core/typed-text.ts`, exported from `@vplans/ui-kit/core` as
  internal `ɵinjectTypedText` and the config / result types. `core` already holds the form control
  base; no other entry point is needed.
- **Generic over** `V` (the value without `null`), `T` (the typed text, default `string`; the range
  picker uses its two texts plus the edited edge) and `E` (the parse error code).
- **Config:**
  - `value`: the field's `model<V | null>`;
  - `notify(value)`: calls the field's `notifyChange`;
  - `parse(text: T) → { value: V | null; error: E | null }`; blank text gives
    `{ value: null, error: null }`;
  - `format(value: V | null) → T`;
  - `valid(raw: unknown) → V | null`: the readable value, or `null` (`validDay`, `validRange`,
    `validNumber`, the `"HH:mm"` check of the time input);
  - `equals(a: V, b: V) → boolean` for two readable values (`sameDay`, `sameRange`, `===`);
  - optional `commitValue(value: V) → V`: the value a valid commit settles on (number: round to
    `maxFractionDigits`, clamp to `min` / `max`). Without it the value is kept.
- **The "same value" rule.** `same(v, raw)` is true when `v === raw`, or when `v` and `valid(raw)`
  are both non-null and `equals(v, valid(raw))`. It is used both for keeping the typed text and for
  skipping a write.
- **Result:**
  - `text()`: the typed text while there is one, else `format(valid(value()))`;
  - `error()`: the parse error code of committed typed text, else `null`;
  - `input(text)`: parses, stores the typed text uncommitted, writes the value and notifies unless
    `same(parsed, value())`;
  - `commit()`: no typed text: nothing. Typed text with an error: kept, marked committed. Without
    an error: dropped; with `commitValue` and a non-null value, the settled value is written like
    `set()`;
  - `set(value)`: drops the typed text and its error (also for the same value), then writes and
    notifies unless `same(value, value())`;
  - `write(value)`: for `writeValue`: drops the typed text and stores `valid(value)` without
    notifying.
- **Dropping on external writes.** The typed text is kept only while `same(typed.value, value())`.
  A written value the field cannot read therefore drops it, as the date pickers do today.
- **Error codes, not messages.** Date, time and number fields use one code (`'invalid'`); the range
  picker uses `{ kind: 'invalid' | 'order'; fields: Record<'start' | 'end', boolean> }`. Each field
  builds the message from `labels()` in `ownErrors()`, and the range picker its per-field
  `aria-invalid` from `fields`.
- **What stays in the fields.** DOM events, the time mask (`maskTime`, applied before `input()`),
  Enter and Alt+ArrowDown handling, blur / focus-out and `notifyTouched()`, opening the listbox or
  calendar, the stepper and its repeat, the `min` / `max` / filter rules inside `parse`, and
  `ownErrors()`.
- **Out-of-range values stay different by design.** The number field clamps on commit
  (`commitValue`); the date and time fields return a parse error for values outside their limits.
- **Aligned edge cases** (visible only in corner cases; each is covered by a test in the module
  spec):
  - committing blank text drops it (date, range, time used to keep an invisible committed text);
  - a written value the time input cannot read drops the typed text (it used to keep it);
  - typing over a value the time input cannot read writes and notifies the parsed value (it used to
    skip it when the parse gave `null`); the same holds for the range picker, where `sameRange`
    against the readable `null` range used to skip the write.
- **Unchanged public interface.** No input, output or public method of the four fields is added,
  removed or renamed; the rendered DOM and classes stay the same.
- **Order.** This work comes before the popup listbox field spec (`.scratch/popup-listbox-field/`).
  That spec's ticket 02 then keeps the time input's own blur step as "commit the typed text"
  through this module.

## Testing Decisions

- A good test drives the module through its result (`input`, `commit`, `set`, `write`, writes to
  the value model) and asserts `text()`, `error()`, the value and the notify calls. It does not
  assert internal signals.
- **New spec `core/typed-text.spec.ts`**, run in an injection context without mounting a
  component, with a small string-to-number rule set. It covers: typing writes and notifies; typing
  the same value does not notify; commit of valid text drops it and shows the format; commit of
  invalid text keeps it with the error; commit of blank text drops it; `commitValue` settles and
  notifies once; `set()` drops the typed text even for the same value; `write()` drops it without
  notifying; an external write of the same value keeps the typed text; an external write of a
  different or unreadable value drops it; an error code is reported only after commit.
- **Existing specs and harnesses of the four fields pass without edits**, apart from tests that
  assert one of the aligned edge cases, which change in the same commit with a note.
- **Prior art:** `ɵinjectListbox()` and its spec in `listbox/` for an injection function with a
  config object; `control-state.spec.ts` for core specs.
- **Visual baselines** are unchanged (`/phase-check`).
- **Client copy:** `pnpm sync:client --verify` passes.

## Out of Scope

- Changing out-of-range behavior (clamp versus error) of any field.
- New or changed messages in `UI_LABELS`.
- The calendar dialog shared by the two date pickers (candidate 3), the popup listbox field shell
  (candidate 1) and the harnesses (candidate 6).
- Changing the pure parse / format helpers (`parseDay`, `parseTime`, `parseNumber`, …).
- Aligning `min` / `max` with `minDate` / `maxDate` input names.

## Further Notes

- No ADR: the module is internal and easy to reverse.
- The decision record is in `docs/DECISIONS.md` → "Parsed text field".
- Gotchas that apply: a control extending `UiFormControlBase` must not inject `NgControl` while it
  is constructed (`.claude/rules/forms.md`); the client compiles with
  `useDefineForClassFields: false` (`.claude/rules/components.md` → "The client copy"), so the
  injection call must not read class fields declared after it.

## Русский перевод

# Parsed text field: один module для typed text полей даты, диапазона, времени и числа

Статус: ready-for-agent

Архитектурная работа вне фаз, выбрана на архитектурном ревью 2026-10-23 (кандидат 2). Термины из
`GLOSSARY.md` → «Typed values»: **parsed text field**, **typed text**, **commit** и **parse error**
добавлены туда для этой работы.

## Постановка проблемы

В kit четыре parsed text field: `ui-datepicker`, `ui-date-range-picker`, `ui-time-input` и
`ui-number-input`. Их чистые функции разбора и форматирования протестированы, но typed text вокруг
них каждое поле проводит вручную:

- приватный interface `Draft` и `linkedSignal`, который сбрасывает typed text, когда значение
  меняется извне;
- `onInput`, который разбирает текст, пишет значение и уведомляет форму;
- `commitDraft()` на blur и Enter, signal `parseError` и `ownErrors()`;
- `writeValue()`, который сбрасывает typed text, и `setValue()`, который пропускает равные
  значения.

Четыре копии уже разошлись:

| | typed text сохраняется, если значение | проверка «то же значение» при записи | parse error, когда |
|---|---|---|---|
| datepicker | тот же объект или тот же день | `sameDay` с сырым значением | commit, текст не пустой, значения нет |
| range picker | тот же объект или те же дни | `sameRange` с читаемым диапазоном | commit, поле неверно или порядок нарушен |
| time input | `===` читаемому времени | `===` с читаемым временем | commit, текст не пустой, значения нет |
| number input | `===` сырому значению | `===` с сырым значением | commit, повторный разбор даёт `NaN` |

Поэтому записанное значение, которое поле не может прочитать (Invalid Date, `"abc"` для времени),
сбрасывает typed text в datepicker, но сохраняет его в time input, а ввод поверх него уведомляет
форму в datepicker, но не в time input. Commit пустого текста сбрасывает typed text в number input
и оставляет невидимый закоммиченный текст в остальных. Мейнтейнер, чинящий баг commit, должен
найти и починить его четыре раза, а новое parsed text field скопировало бы пятую версию.

## Решение

Один deep module, **typed text**, в entry point `core`: внутренняя injection-функция
`ɵinjectTypedText()`, вызываемая в field initializer, как `ɵinjectListbox()`. Он владеет typed
text, commit, кодом parse error и записью значения по правилу «то же значение» с уведомлением
формы. Поле передаёт ему свою value model, callback уведомления и свои правила значения (parse,
format, valid, equals и, для чисел, значение, на котором останавливается commit), а всё остальное
оставляет себе: DOM, маску времени, клавиатуру, blur / focus-out и touched, listbox, календарь,
stepper и превращение кода ошибки в сообщение.

Потребители изменений не видят: публичные inputs, outputs, методы, DOM и сообщения остаются
прежними, кроме крайних случаев из раздела «Выровненные крайние случаи».

## Пользовательские истории

1. Как мейнтейнер kit, я хочу, чтобы typed text каждого parsed text field жил в одном module,
   чтобы баг commit или сброса чинился один раз и доходил до всех четырёх полей.
2. Как мейнтейнер kit, я хочу одно правило того, когда записанное значение сбрасывает typed text,
   чтобы поля даты, диапазона, времени и числа не могли снова разойтись.
3. Как мейнтейнер kit, я хочу одно правило «то же значение» для записи и уведомления, чтобы поле
   никогда не уведомляло форму о значении, которое уже хранит.
4. Как мейнтейнер kit, я хочу тестировать commit, сброс и parse error без монтирования компонента,
   чтобы у машинки состояний был свой быстрый spec.
5. Как мейнтейнер kit, я хочу, чтобы каждое поле передавало только свои правила значения, чтобы
   новое parsed text field требовало написать parse, format и equality, а не проводку вокруг них.
6. Как мейнтейнер kit, я хочу, чтобы поле числа по-прежнему делало clamp и округление при commit, а
   поля даты и времени по-прежнему отвергали значения вне границ, чтобы каждое поле сохранило смысл
   своего значения.
7. Как мейнтейнер kit, я хочу, чтобы ошибки по полям и ошибка порядка range picker укладывались в
   тот же module, чтобы самая разошедшаяся копия не осталась в стороне.
8. Как мейнтейнер kit, я хочу хранить parse error как код, чтобы при смене `UI_LABELS` (например,
   локали) сообщение показывалось на новом языке.
9. Как пользователь, я хочу, чтобы мой typed text оставался, пока я печатаю, и заменялся
   отформатированным значением, когда я ухожу из поля, одинаково во всех parsed text field.
10. Как пользователь, я хочу, чтобы неверный typed text оставался с parse error после ухода из
    поля, чтобы я мог его исправить, одинаково во всех parsed text field.
11. Как пользователь, я хочу, чтобы выбор значения (календарь, список времён, stepper, preset,
    clear, Home/End) заменял мой typed text и его ошибку, даже когда я выбираю то же значение.
12. Как автор формы, я хочу, чтобы связанный form control видел только значения и никогда parse
    error, как сейчас.
13. Как автор формы, я хочу, чтобы `setValue` / `patchValue` того же дня, диапазона, времени или
    числа не стирали текст, который пользователь печатает.

## Решения по реализации

- **Размещение.** `projects/ui-kit/core/typed-text.ts`, экспорт из `@vplans/ui-kit/core` как
  внутренний `ɵinjectTypedText` и типы конфига / результата. В `core` уже лежит базовый класс form
  control; другой entry point не нужен.
- **Generic по** `V` (значение без `null`), `T` (typed text, по умолчанию `string`; range picker
  использует два текста и редактированную границу) и `E` (код parse error).
- **Конфиг:**
  - `value`: `model<V | null>` поля;
  - `notify(value)`: вызывает `notifyChange` поля;
  - `parse(text: T) → { value: V | null; error: E | null }`; пустой текст даёт
    `{ value: null, error: null }`;
  - `format(value: V | null) → T`;
  - `valid(raw: unknown) → V | null`: читаемое значение или `null` (`validDay`, `validRange`,
    `validNumber`, проверка `"HH:mm"` у time input);
  - `equals(a: V, b: V) → boolean` для двух читаемых значений (`sameDay`, `sameRange`, `===`);
  - необязательный `commitValue(value: V) → V`: значение, на котором останавливается валидный
    commit (число: округление до `maxFractionDigits`, clamp к `min` / `max`). Без него значение
    сохраняется.
- **Правило «то же значение».** `same(v, raw)` истинно, когда `v === raw` или когда `v` и
  `valid(raw)` оба не null и `equals(v, valid(raw))`. Используется и для сохранения typed text, и
  для пропуска записи.
- **Результат:**
  - `text()`: typed text, пока он есть, иначе `format(valid(value()))`;
  - `error()`: код parse error закоммиченного typed text, иначе `null`;
  - `input(text)`: разбирает, сохраняет typed text незакоммиченным, пишет значение и уведомляет,
    если не `same(parsed, value())`;
  - `commit()`: нет typed text — ничего. Typed text с ошибкой — сохраняется и помечается
    закоммиченным. Без ошибки — сбрасывается; с `commitValue` и не-null значением итоговое значение
    пишется как в `set()`;
  - `set(value)`: сбрасывает typed text и его ошибку (и при том же значении), затем пишет и
    уведомляет, если не `same(value, value())`;
  - `write(value)`: для `writeValue`: сбрасывает typed text и сохраняет `valid(value)` без
    уведомления.
- **Сброс при внешней записи.** Typed text сохраняется, только пока `same(typed.value, value())`.
  Поэтому записанное значение, которое поле не может прочитать, сбрасывает его, как сейчас делают
  date pickers.
- **Коды ошибок, а не сообщения.** Поля даты, времени и числа используют один код (`'invalid'`);
  range picker — `{ kind: 'invalid' | 'order'; fields: Record<'start' | 'end', boolean> }`. Каждое
  поле строит сообщение из `labels()` в `ownErrors()`, а range picker — свой `aria-invalid` по
  полям из `fields`.
- **Что остаётся в полях.** DOM-события, маска времени (`maskTime`, применяется до `input()`),
  обработка Enter и Alt+ArrowDown, blur / focus-out и `notifyTouched()`, открытие listbox или
  календаря, stepper и его повтор, правила `min` / `max` / filter внутри `parse` и `ownErrors()`.
- **Значения вне границ остаются разными намеренно.** Поле числа делает clamp при commit
  (`commitValue`); поля даты и времени возвращают parse error для значений вне своих границ.
- **Выровненные крайние случаи** (видны только в углах; каждый покрыт тестом в spec module):
  - commit пустого текста сбрасывает его (date, range, time раньше держали невидимый закоммиченный
    текст);
  - записанное значение, которое time input не может прочитать, сбрасывает typed text (раньше
    сохраняло);
  - ввод поверх значения, которое time input не может прочитать, пишет и уведомляет разобранное
    значение (раньше пропускал, когда разбор давал `null`); то же верно для range picker, где
    `sameRange` с читаемым диапазоном `null` раньше пропускал запись.
- **Публичный interface не меняется.** Ни один input, output или публичный метод четырёх полей не
  добавляется, не удаляется и не переименовывается; отрисованный DOM и классы остаются прежними.
- **Порядок.** Эта работа идёт до спеки popup listbox field (`.scratch/popup-listbox-field/`).
  Тикет 02 той спеки затем сохраняет собственный шаг blur у time input как «commit typed text»
  через этот module.

## Решения по тестированию

- Хороший тест ведёт module через его результат (`input`, `commit`, `set`, `write`, записи в value
  model) и проверяет `text()`, `error()`, значение и вызовы notify. Он не проверяет внутренние
  signals.
- **Новый spec `core/typed-text.spec.ts`**, в injection context без монтирования компонента, с
  маленьким набором правил «строка → число». Покрывает: ввод пишет и уведомляет; ввод того же
  значения не уведомляет; commit валидного текста сбрасывает его и показывает формат; commit
  неверного текста сохраняет его с ошибкой; commit пустого текста сбрасывает его; `commitValue`
  приводит значение и уведомляет один раз; `set()` сбрасывает typed text даже при том же значении;
  `write()` сбрасывает его без уведомления; внешняя запись того же значения сохраняет typed text;
  внешняя запись другого или нечитаемого значения сбрасывает его; код ошибки виден только после
  commit.
- **Существующие specs и harnesses четырёх полей проходят без правок**, кроме тестов, которые
  проверяют один из выровненных крайних случаев: они меняются в том же коммите с пояснением.
- **Образцы:** `ɵinjectListbox()` и его spec в `listbox/` — injection-функция с объектом конфига;
  `control-state.spec.ts` — specs в core.
- **Visual baselines** не меняются (`/phase-check`).
- **Копия у клиента:** `pnpm sync:client --verify` проходит.

## Вне рамок

- Изменение поведения вне границ (clamp или ошибка) любого поля.
- Новые или изменённые сообщения в `UI_LABELS`.
- Общий calendar dialog двух date pickers (кандидат 3), оболочка popup listbox field (кандидат 1)
  и harnesses (кандидат 6).
- Изменение чистых helpers разбора / форматирования (`parseDay`, `parseTime`, `parseNumber`, …).
- Выравнивание имён inputs `min` / `max` и `minDate` / `maxDate`.

## Дополнительные заметки

- ADR нет: module внутренний и легко откатывается.
- Запись о решениях — в `docs/DECISIONS.md` → «Parsed text field».
- Применимые gotchas: control, расширяющий `UiFormControlBase`, не должен инжектить `NgControl` во
  время конструирования (`.claude/rules/forms.md`); клиент компилируется с
  `useDefineForClassFields: false` (`.claude/rules/components.md` → «The client copy»), поэтому
  вызов injection-функции не должен читать поля класса, объявленные после него.
