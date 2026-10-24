# Calendar dialog field: one base class for the calendar dialog of the two date pickers

Status: ready-for-agent

Architecture work outside the phases, chosen in the architecture review of 2026-10-23 (candidate
3). Terms are from `GLOSSARY.md` → "Dropdowns": **calendar dialog** and **calendar dialog field**
were added there for this work.

## Problem Statement

`ui-datepicker` and `ui-date-range-picker` live in the same entry point and both open a calendar
dialog. Each one wires that dialog by hand, and the copies are word for word the same, comments
included:

- `isOpen`, `open()` / `close()` / `toggle()` with the disabled and readonly guard, the commit of
  the typed text on open, the `opened` / `closed` outputs and touched on close;
- `onAttach()` that moves focus to the active day, `onInputKeydown()` (Alt+ArrowDown opens, Enter
  commits), `onFocusOut()` that marks the field touched once focus leaves the field, the button
  and the dialog;
- `panelId`, the panel positions, the calendar icon and the `toggleButton` / `panel` / calendar
  queries;
- the inputs `dateFilter`, `startAt`, `placeholder`, `size`, `id`, `aria-label`, the outputs
  `opened` / `closed`, and `labels`, the locale, the format hint and `inputMode`.

About 80 lines are duplicated. A maintainer fixing focus return or touched in one picker has to
find the same code in the other, and the two have already started to drift where they could: the
limits are `min`/`max` in one and `minDate`/`maxDate` in the other.

## Solution

One abstract base class, `UiCalendarDialogField<V>`, in the `datepicker` entry point, like
`UiPopupListboxField<V>` in `listbox`. It owns the calendar dialog behavior and the inputs,
outputs and helpers both pickers share. Each picker extends it and keeps its template, what a pick
does to its value, its limits and its typed text config.

Consumers see no change: the public inputs, outputs, methods, the rendered DOM and classes, the
harnesses and the visual baselines stay the same.

## User Stories

1. As a kit maintainer, I want the calendar dialog of both date pickers to live in one class, so
   that a bug in opening, closing, focus return or touched is fixed once.
2. As a kit maintainer, I want the inputs and outputs both pickers share to be declared once, so
   that their names, defaults and docs cannot drift apart.
3. As a kit maintainer, I want to test the calendar dialog behavior with a small test host, so
   that it has its own spec next to the two pickers' specs.
4. As a kit maintainer, I want each picker to keep only its own logic (one day or a range,
   presets, Today, Clear, limits), so that reading a picker shows what makes it different.
5. As a kit maintainer adding a third calendar dialog field, I want to extend one base class and
   follow a documented template contract, instead of copying a picker.
6. As a user, I want the calendar dialog of both pickers to open, close, move and return focus,
   and react to Alt+ArrowDown and Enter exactly as today.
7. As a form author, I want both pickers to mark the control touched exactly as today: when the
   dialog closes and when focus leaves the field, its button and the dialog.
8. As a form author, I want the limit inputs to keep their names (`min`/`max` on the datepicker,
   `minDate`/`maxDate` on the range picker), so that my templates keep compiling.

## Implementation Decisions

- **Placement.** `projects/ui-kit/datepicker/calendar-dialog-field.ts`, exported from
  `@vplans/ui-kit/datepicker` as internal `ɵUiCalendarDialogField`, like `ɵUiPopupListboxField`
  in `listbox`.
- **Form.** An abstract `@Directive` class `UiCalendarDialogField<V>` that extends
  `UiFormControlBase<V>` and implements `UiFormFieldControl`. Not an injection function: the
  shared inputs and outputs must be class fields.
- **What the field gives the base:**
  - `classPrefix()`: the BEM block, `'ui-datepicker'` or `'ui-date-range-picker'`. A method, not a
    field, because the `id` default reads it while the base is built (prior art:
    `UiPopupListboxField.classPrefix()`);
  - an abstract `typedText` typed as `Pick<ɵUiTypedText<…>, 'commit'>`: the field's typed text
    module, which the base commits on open, Enter and blur;
  - the template contract, documented on the class: a calendar button with `#toggleButton`, the
    dialog element with `#panel`, and one `ui-calendar` inside it.
- **What moves to the base:**
  - the open state (`isOpen`), `open()` / `close()` (public, as today) and `toggle()`, with the
    disabled and readonly guard, the commit on open, `opened` / `closed`, and touched on close;
  - `onAttach()` (focus on the active day after render), `onInputKeydown()` (Alt+ArrowDown opens,
    Enter commits), `onBlur()` (commits) and `onFocusOut()` (touched once focus leaves the host
    and the dialog);
  - `panelId`, `positions` (`UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK`), `calendarIcon` and the
    `toggleElement` / `panel` / `calendar` queries;
  - the inputs `dateFilter`, `startAt`, `placeholder`, `size`, `id` (default from `classPrefix()`)
    and `aria-label`, and the outputs `opened` / `closed`;
  - `labels`, the locale, the format `hint` and `inputMode`;
  - the host bindings both share: the block class and its `--size`, `--disabled`, `--readonly`,
    `--invalid` modifiers, `id`, `aria-label` and `aria-describedby` set to `null`, and
    `(focusout)`. The rendered classes and attributes stay the same.
- **What stays in the fields:** the template (calendar button, panel, calendar, footer); what a
  pick does (one day and close, or start then end; presets; Today; Clear); the limits (`min` /
  `max`, `minDate` / `maxDate`); `name` (datepicker only); `labelStrategy`, `controlId` and
  `focus()`; the value model, `writeValue()`, `ownErrors()` and the typed text config; the range
  picker's group role, labels and two months; the providers (`UI_FORM_FIELD_CONTROL` and
  `NG_VALUE_ACCESSOR` on each field, as `.claude/rules/forms.md` requires).
- **Limits keep their names.** No `min`/`max` on the range picker, no rename on either (user
  decision, `.claude/rules/forms.md`).
- **Unchanged public interface.** No input, output or public method of the two pickers is added,
  removed or renamed; the rendered DOM and classes, the harnesses and the visual baselines stay
  the same.
- **Order.** This work comes after the parsed text field spec (`.scratch/parsed-text-field/`,
  merged into `master`): it builds on the pickers that already use the typed text module.

## Testing Decisions

- A good test drives the base through a test host the way a user and a form do (clicks, keys,
  focus moves, a bound form control) and asserts the DOM, the outputs and the control state. It
  does not assert protected signals.
- **New spec `datepicker/calendar-dialog-field.spec.ts`** with a minimal test field that extends
  the base and follows the template contract. It covers: the button and Alt+ArrowDown open the
  dialog, Escape and a second click close it; `opened` / `closed` fire once each; a disabled or
  readonly field does not open; open, Enter and blur commit the typed text; focus moves to the
  active day when the dialog attaches and returns to the button when it closes; `aria-expanded`
  and `aria-controls` follow the open state; touched on close and on focus leaving the host and
  the dialog, not on focus moving between them; the `id` default from `classPrefix()` and the
  host classes.
- **Existing specs and harnesses of both pickers pass without edits.**
- **Prior art:** `listbox/popup-listbox-field.spec.ts` for a spec of an abstract field base with a
  test field.
- **Visual baselines** are unchanged (`/phase-check`).

## Out of Scope

- Renaming `min`/`max` or `minDate`/`maxDate`, or adding aliases.
- Any behavior change, including aligning the footers (Today in the range picker) or giving the
  range picker a `name`.
- Sharing the template (a panel shell component): the template stays in each field.
- A provider helper like `ɵprovideUiPopupListboxField()`: each field keeps its two provider lines.
- The harnesses (candidate 6 of the review).

## Further Notes

- No ADR: the class is internal and easy to reverse.
- The decision record is in `docs/DECISIONS.md` → "Calendar dialog field".
- Gotchas that apply: a control extending `UiFormControlBase` must not inject `NgControl` while it
  is constructed (`.claude/rules/forms.md`); the client compiles with
  `useDefineForClassFields: false` (`.claude/rules/components.md` → "The client copy"), so a field
  initializer of the base must not read a field of the subclass; `viewChild` metadata needs the
  queried class declared above (`.claude/rules/components.md` → "Storybook JIT").

## Русский перевод

# Calendar dialog field: один базовый класс для calendar dialog двух date pickers

Статус: ready-for-agent

Архитектурная работа вне фаз, выбрана на архитектурном ревью 2026-10-23 (кандидат 3). Термины из
`GLOSSARY.md` → «Dropdowns»: **calendar dialog** и **calendar dialog field** добавлены туда для
этой работы.

## Постановка проблемы

`ui-datepicker` и `ui-date-range-picker` живут в одном entry point и оба открывают calendar
dialog. Каждый проводит этот диалог вручную, и копии совпадают дословно, вместе с комментариями:

- `isOpen`, `open()` / `close()` / `toggle()` с guard на disabled и readonly, commit typed text при
  открытии, outputs `opened` / `closed` и touched при закрытии;
- `onAttach()`, который переводит фокус на активный день, `onInputKeydown()` (Alt+ArrowDown
  открывает, Enter делает commit), `onFocusOut()`, который помечает поле touched, когда фокус
  уходит из поля, кнопки и диалога;
- `panelId`, позиции панели, иконка календаря и запросы `toggleButton` / `panel` / календаря;
- inputs `dateFilter`, `startAt`, `placeholder`, `size`, `id`, `aria-label`, outputs
  `opened` / `closed`, а также `labels`, локаль, подсказка формата и `inputMode`.

Дублируется около 80 строк. Мейнтейнер, чинящий возврат фокуса или touched в одном picker, должен
найти тот же код в другом, а там, где могли, они уже начали расходиться: пределы — `min`/`max` в
одном и `minDate`/`maxDate` в другом.

## Решение

Один абстрактный базовый класс, `UiCalendarDialogField<V>`, в entry point `datepicker`, как
`UiPopupListboxField<V>` в `listbox`. Он владеет поведением calendar dialog и общими для обоих
pickers inputs, outputs и helpers. Каждый picker расширяет его и оставляет себе шаблон, то, что
выбор делает с его значением, свои пределы и конфиг typed text.

Потребители изменений не видят: публичные inputs, outputs, методы, отрисованный DOM и классы,
harnesses и visual baselines остаются прежними.

## Пользовательские истории

1. Как мейнтейнер kit, я хочу, чтобы calendar dialog обоих date pickers жил в одном классе, чтобы
   баг открытия, закрытия, возврата фокуса или touched чинился один раз.
2. Как мейнтейнер kit, я хочу, чтобы общие для обоих pickers inputs и outputs объявлялись один
   раз, чтобы их имена, значения по умолчанию и документация не могли разойтись.
3. Как мейнтейнер kit, я хочу тестировать поведение calendar dialog на маленьком тестовом хосте,
   чтобы у него был свой spec рядом со spec двух pickers.
4. Как мейнтейнер kit, я хочу, чтобы каждый picker держал только свою логику (один день или
   диапазон, presets, Today, Clear, пределы), чтобы по коду picker было видно, чем он отличается.
5. Как мейнтейнер kit, добавляющий третье calendar dialog field, я хочу расширить один базовый
   класс и следовать описанному шаблонному контракту, а не копировать picker.
6. Как пользователь, я хочу, чтобы calendar dialog обоих pickers открывался, закрывался, переводил
   и возвращал фокус и реагировал на Alt+ArrowDown и Enter ровно как сейчас.
7. Как автор формы, я хочу, чтобы оба pickers помечали control touched ровно как сейчас: при
   закрытии диалога и когда фокус уходит из поля, его кнопки и диалога.
8. Как автор формы, я хочу, чтобы inputs пределов сохранили имена (`min`/`max` у datepicker,
   `minDate`/`maxDate` у range picker), чтобы мои шаблоны продолжали компилироваться.

## Решения по реализации

- **Размещение.** `projects/ui-kit/datepicker/calendar-dialog-field.ts`, экспорт из
  `@vplans/ui-kit/datepicker` как внутренний `ɵUiCalendarDialogField`, как
  `ɵUiPopupListboxField` в `listbox`.
- **Форма.** Абстрактный класс `@Directive` `UiCalendarDialogField<V>`, который расширяет
  `UiFormControlBase<V>` и реализует `UiFormFieldControl`. Не injection-функция: общие inputs и
  outputs должны быть полями класса.
- **Что поле даёт базе:**
  - `classPrefix()`: BEM-блок, `'ui-datepicker'` или `'ui-date-range-picker'`. Метод, а не поле,
    потому что значение `id` по умолчанию читает его, пока база строится (образец:
    `UiPopupListboxField.classPrefix()`);
  - абстрактный `typedText` с типом `Pick<ɵUiTypedText<…>, 'commit'>`: module typed text поля,
    которому база делает commit при открытии, Enter и blur;
  - шаблонный контракт, описанный на классе: кнопка календаря с `#toggleButton`, элемент диалога
    с `#panel` и один `ui-calendar` внутри него.
- **Что переезжает в базу:**
  - состояние открытия (`isOpen`), `open()` / `close()` (публичные, как сейчас) и `toggle()`, с
    guard на disabled и readonly, commit при открытии, `opened` / `closed` и touched при закрытии;
  - `onAttach()` (фокус на активный день после рендера), `onInputKeydown()` (Alt+ArrowDown
    открывает, Enter делает commit), `onBlur()` (commit) и `onFocusOut()` (touched, когда фокус
    уходит из хоста и диалога);
  - `panelId`, `positions` (`UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK`), `calendarIcon` и запросы
    `toggleElement` / `panel` / `calendar`;
  - inputs `dateFilter`, `startAt`, `placeholder`, `size`, `id` (по умолчанию из `classPrefix()`)
    и `aria-label`, outputs `opened` / `closed`;
  - `labels`, локаль, подсказка формата `hint` и `inputMode`;
  - общие host bindings: класс блока и его модификаторы `--size`, `--disabled`, `--readonly`,
    `--invalid`, `id`, `aria-label` и `aria-describedby` в `null` и `(focusout)`. Отрисованные
    классы и атрибуты остаются прежними.
- **Что остаётся в полях:** шаблон (кнопка календаря, панель, календарь, footer); то, что делает
  выбор (один день и закрытие или начало, затем конец; presets; Today; Clear); пределы (`min` /
  `max`, `minDate` / `maxDate`); `name` (только у datepicker); `labelStrategy`, `controlId` и
  `focus()`; value model, `writeValue()`, `ownErrors()` и конфиг typed text; роль group, подписи и
  два месяца range picker; providers (`UI_FORM_FIELD_CONTROL` и `NG_VALUE_ACCESSOR` в каждом поле,
  как требует `.claude/rules/forms.md`).
- **Пределы сохраняют имена.** Ни `min`/`max` у range picker, ни переименования ни у одного
  (решение пользователя, `.claude/rules/forms.md`).
- **Публичный interface не меняется.** Ни один input, output или публичный метод двух pickers не
  добавляется, не удаляется и не переименовывается; отрисованный DOM и классы, harnesses и visual
  baselines остаются прежними.
- **Порядок.** Работа идёт после спеки parsed text field (`.scratch/parsed-text-field/`, влита в
  `master`): она строится на pickers, которые уже используют module typed text.

## Решения по тестированию

- Хороший тест ведёт базу через тестовый хост так, как это делают пользователь и форма (клики,
  клавиши, перемещения фокуса, связанный form control), и проверяет DOM, outputs и состояние
  control. Он не проверяет protected signals.
- **Новый spec `datepicker/calendar-dialog-field.spec.ts`** с минимальным тестовым полем, которое
  расширяет базу и следует шаблонному контракту. Покрывает: кнопка и Alt+ArrowDown открывают
  диалог, Escape и повторный клик закрывают; `opened` / `closed` срабатывают по одному разу;
  disabled или readonly поле не открывается; открытие, Enter и blur делают commit typed text;
  фокус переходит на активный день, когда диалог подключается, и возвращается на кнопку при
  закрытии; `aria-expanded` и `aria-controls` следуют состоянию открытия; touched при закрытии и
  когда фокус уходит из хоста и диалога, но не при переходе между ними; значение `id` по умолчанию
  из `classPrefix()` и host-классы.
- **Существующие specs и harnesses обоих pickers проходят без правок.**
- **Образец:** `listbox/popup-listbox-field.spec.ts` — spec абстрактной базы поля с тестовым
  полем.
- **Visual baselines** не меняются (`/phase-check`).

## Вне рамок

- Переименование `min`/`max` или `minDate`/`maxDate` и добавление алиасов.
- Любое изменение поведения, включая выравнивание footer (Today в range picker) и `name` у range
  picker.
- Общий шаблон (компонент-оболочка панели): шаблон остаётся в каждом поле.
- Helper providers вроде `ɵprovideUiPopupListboxField()`: каждое поле оставляет свои две строки
  providers.
- Harnesses (кандидат 6 ревью).

## Дополнительные заметки

- ADR нет: класс внутренний и легко откатывается.
- Запись о решениях — в `docs/DECISIONS.md` → «Calendar dialog field».
- Применимые gotchas: control, расширяющий `UiFormControlBase`, не должен инжектить `NgControl` во
  время конструирования (`.claude/rules/forms.md`); клиент компилируется с
  `useDefineForClassFields: false` (`.claude/rules/components.md` → «The client copy»), поэтому
  field initializer базы не должен читать поле подкласса; метаданные `viewChild` требуют, чтобы
  запрашиваемый класс был объявлен выше (`.claude/rules/components.md` → «Storybook JIT»).
