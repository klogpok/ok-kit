# Popup listbox field: one module for the shell of select, multi-select, autocomplete and time input

Status: ready-for-agent

Architecture work outside the phases, chosen in the architecture review of 2026-10-23 (candidate
1). Terms are from `GLOSSARY.md` → "Dropdowns"; **popup listbox field** was added there for this
work.

## Problem Statement

The kit has four popup listbox fields: `ui-select`, `ui-multi-select`, `ui-autocomplete` and
`ui-time-input`. The listbox controller behind them is deep, but every field rebuilds the shell
around it by hand:

- The combobox ARIA of the inner control (`id`, `aria-label`, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`, `aria-required`, `aria-invalid`, `aria-describedby`) is written four
  times: on the select's search input and trigger button, on the autocomplete input and on the
  time input.
- Each field declares the same inputs (`id`, `aria-label`, `size`, `name`, `placeholder`), the
  `opened` / `closed` outputs, `labelStrategy` / `controlId`, `focus` / `open` / `close` that pass
  through to the listbox, an `onBlur` that closes and marks the control touched, the same host
  block (host id, `aria-label` / `aria-describedby` set to `null`, size / disabled / readonly /
  invalid classes) and the same providers: the field-control token, the value accessor and the
  listbox providers.
- `fieldListboxConfig()` was extracted to share four listbox config members, but everything
  above is still copied.

For a maintainer, a fix to combobox ARIA (for example when `aria-controls` is set) has to land in
four templates, and a new popup listbox field has to copy about seven separate pieces. The copies
can drift without any test noticing, because the ARIA contract is tested only through each
field's own spec.

## Solution

One deep module, the **popup listbox field**, in the `listbox` entry point, made of three parts:

1. A directive on the inner control, `[uiComboboxControl]`, that owns the dynamic combobox ARIA.
2. An abstract base class, `ɵUiPopupListboxField`, between `UiFormControlBase` and the four
   fields, that owns the shared inputs, outputs, host bindings, blur handling and the listbox
   config the field gives every listbox alike.
3. A provider helper, `ɵprovideUiPopupListboxField()`, that returns the providers every popup
   listbox field needs except the value accessor.

A field then keeps only what is its own: its value semantics, its static attributes, its dropdown
panel template, its listbox config and its specific host classes. Consumers see no change: the
rendered DOM, the classes and the public inputs and outputs stay the same.

## User Stories

1. As a kit maintainer, I want the combobox ARIA of every popup listbox field to live in one
   directive, so that a fix to it lands once and reaches all four fields.
2. As a kit maintainer, I want `aria-expanded`, `aria-controls` and `aria-activedescendant` to be
   derived from the listbox state in one place, so that the "only while shown" rule cannot drift
   between fields.
3. As a kit maintainer, I want `aria-required`, `aria-invalid` and `aria-describedby` to come from
   the field's control state in one place, so that the form-field integration is the same in every
   popup listbox field.
4. As a kit maintainer, I want the inner control's `id` and `aria-label` to be set by the same
   directive, so that `<label for>` and the accessible name work the same in every field.
5. As a kit maintainer, I want the select's search input and its trigger button to use the same
   directive, so that switching `searchable` does not change the ARIA contract.
6. As a kit maintainer, I want the shared inputs (`id`, `aria-label`, `size`, `name`,
   `placeholder`) declared once, so that their defaults and documentation cannot drift.
7. As a kit maintainer, I want the `opened` and `closed` outputs declared once, so that every
   field emits them the same way.
8. As a kit maintainer, I want `focus`, `open` and `close` provided by the base class, so that a
   field does not re-write pass-throughs to its listbox.
9. As a kit maintainer, I want a shared blur step (close, then mark touched) that a field can
   extend, so that autocomplete can still reset its text and time input can still commit its
   draft.
10. As a kit maintainer, I want the host id and the `null` host `aria-label` / `aria-describedby`
    set by the base class, so that the label and descriptions stay on the inner control in every
    field.
11. As a kit maintainer, I want the size, disabled, readonly and invalid host classes built from
    a class prefix the field declares, so that each field keeps its own BEM block name.
12. As a kit maintainer, I want a field's own host classes (`--open`, `--clearable`, `--chips`) to
    stay on the field, so that the base class does not grow field-specific state.
13. As a kit maintainer, I want one provider helper for the field-control token, the field token
    and the listbox providers, so that a new popup listbox field cannot forget one of them.
14. As a kit maintainer, I want each field to keep declaring its own `NG_VALUE_ACCESSOR`, so that
    the forms rule "every concrete control declares its accessor itself" still holds and stays
    greppable.
15. As a kit maintainer, I want the listbox config shared by every field (`ariaLabel`, `locked`,
    `opened`, `closed`) to be a protected method of the base class, so that the free function can
    go and a field spreads `this.fieldListboxConfig()` into `injectListbox()`.
16. As a kit maintainer, I want each field to keep creating its own listbox with `injectListbox()`,
    so that the field-specific config (selection, search, creatable, time slots) stays with the
    field.
17. As a kit maintainer, I want the dropdown panel template to stay in each field, so that content
    projection and each field's close handler stay simple.
18. As a kit maintainer, I want static attributes (`role`, `aria-haspopup`, `aria-autocomplete`,
    `autocomplete="off"`) and `aria-readonly` to stay in the templates, so that the rendered DOM
    stays the same while the fields differ in them.
19. As a kit maintainer, I want one contract spec that runs the directive and the base class on a
    minimal test field, so that the combobox ARIA contract is verified in one place.
20. As a kit maintainer, I want the existing specs and harnesses of the four fields to pass
    unchanged, so that they prove the refactor changed no behavior.
21. As a kit maintainer, I want the visual baselines to stay unchanged, so that the refactor is
    shown to change nothing a user sees.
22. As a kit maintainer adding a fifth popup listbox field, I want to extend one base class, apply
    one directive and call one provider helper, so that I write only the new field's value
    semantics.
23. As a consuming app developer, I want the public inputs, outputs and DOM of the four fields to
    stay exactly as they are, so that my templates, styles and tests keep working.
24. As a screen-reader user, I want every popup listbox field to announce its expanded state, its
    active option and its errors the same way, so that the fields behave consistently.
25. As a kit maintainer, I want the client copy (`pnpm sync:client --verify`) to compile with the
    client's `useDefineForClassFields: false`, so that the deeper inheritance chain does not break
    field initialization order in the VPlans client.
26. As a kit maintainer, I want the missing `aria-readonly` on the time input recorded as its own
    question, so that the refactor does not silently change it and the gap is not lost.

## Implementation Decisions

- **Placement.** The module lives in the `listbox` entry point, next to the listbox controller.
  `core` does not depend on `listbox`, and the module needs the controller. All three parts are
  internal (`ɵ`-prefixed exports), used by `select`, `autocomplete` and `time`.
- **Field token.** A new internal injection token for the popup listbox field. The directive
  injects it and the listbox controller to read: `controlId`, `ariaLabel`, `isRequired`,
  `showError`, `describedBy` from the field, and `shown`, `panelId`, `activeId` from the listbox.
  `UiFormFieldControl` in `core` is not widened: it is public and used by `ui-form-field`.
- **Directive `[uiComboboxControl]` (`ɵUiComboboxControl`).** Applied to the inner `<input>` or
  `<button>` of a field. Host bindings: `id`, `aria-label` (or `null` when empty),
  `aria-expanded`, `aria-controls` and `aria-activedescendant` (only while the listbox is shown),
  `aria-required` and `aria-invalid` (`'true'` or `null`), `aria-describedby`. It does not set
  `role`, `aria-haspopup`, `aria-autocomplete`, `autocomplete` or `aria-readonly`: those stay in
  the templates, because the fields differ in them and the DOM must not change.
- **Base class `ɵUiPopupListboxField<V>`.** An abstract `@Directive` that extends
  `UiFormControlBase<V>` and implements `UiFormFieldControl`. It owns:
  - inputs `id` (default from the field's id prefix), `aria-label`, `size`, `name`,
    `placeholder`; outputs `opened`, `closed`;
  - `labelStrategy = 'for'`, `controlId` (`${id}-control`), `focus()`, `open()`, `close()`;
  - a protected `onBlur()` that closes the listbox and marks the control touched; autocomplete and
    time input override it and call `super.onBlur()` where today's order allows it;
  - host bindings: host `id`, `aria-label` / `aria-describedby` set to `null`, and the classes
    `<prefix>--<size>`, `<prefix>--disabled`, `<prefix>--readonly`, `<prefix>--invalid`;
  - a protected `fieldListboxConfig()` that replaces the free `fieldListboxConfig()` function,
    which is removed;
  - abstract members: `classPrefix` (for example `'ui-select'`) and `listbox` (the controller the
    field creates with `injectListbox()`).
- **Select chain.** `UiSelectBase` extends `ɵUiPopupListboxField` instead of `UiFormControlBase`
  and keeps its select-only inputs, host classes and abstract members. Candidate 4 of the review
  (a selection model instead of hooks) is not part of this work.
- **Provider helper `ɵprovideUiPopupListboxField(() => Field)`.** Returns the field token, the
  `UI_FORM_FIELD_CONTROL` provider and the listbox providers. Each field still lists
  `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Field), multi: true }` next to it.
- **Unchanged DOM.** Same attributes, values and classes on the host and on the inner control.
  Attribute order may change; there are no DOM snapshot tests.
- **Unchanged public interface.** No input, output or public method of the four fields is added,
  removed or renamed.
- **Order of work.** Two commits: first the directive (applied in all four fields), then the base
  class with the provider helper. Each commit passes the full check on its own.

## Testing Decisions

- A good test drives a field through its public surface (inputs, the bound form control, the
  keyboard, harnesses) and asserts what a user or assistive technology sees: attributes, classes,
  emitted outputs, the control's touched state. It does not assert which class or directive set an
  attribute.
- **Existing specs and harnesses of the four fields pass without edits.** They are the safety net
  that proves no behavior changed. A needed edit to them is a sign the refactor changed behavior
  and must be explained.
- **One new contract spec in the `listbox` entry point** drives a minimal test field that extends
  the base class, applies the directive and uses the provider helper. It covers: the ARIA set while
  closed and while open (expanded, controls, active descendant), required / invalid /
  described-by from a bound form control, `id` / `aria-label` on the inner control and `null` on
  the host, the size / disabled / readonly / invalid host classes from the prefix, `opened` /
  `closed` outputs, and blur marking the control touched.
- **Prior art:** the `TestField` host in the listbox spec (a minimal field around the listbox
  controller), and the select, autocomplete and time-input specs for form-bound ARIA assertions.
- **Visual baselines** are unchanged (`/phase-check`).
- **Client copy:** `pnpm sync:client --verify` passes.

## Out of Scope

- Changing any rendered attribute, class or public input, including aligning the differences
  between fields (missing `aria-readonly` on the time input, `name` on the searchable select).
- Moving the dropdown panel template into the module.
- Moving `injectListbox()` calls or field-specific listbox config into the base class.
- Harness consolidation (candidate 6 of the review).
- The select selection model (candidate 4), the parsed-text draft (candidate 2), the date pickers
  (candidate 3) and the tooltip/popover overlay (candidate 5).
- Widening `UiFormFieldControl` in `core`.

## Further Notes

- The time input has no `aria-readonly` while select and autocomplete set it. This becomes a
  separate `needs-info` ticket; the refactor keeps today's DOM.
- No ADR: the change is internal and reversible.
- Gotchas that apply: `providers` metadata is not inherited (`.claude/rules/forms.md`); the client
  compiles with `useDefineForClassFields: false` (`.claude/rules/components.md` → "The client
  copy"); Storybook JIT needs classes declared before they are queried or referenced through
  `forwardRef` (`.claude/rules/components.md` → "Storybook JIT").

## Русский перевод

# Popup listbox field: один module для оболочки select, multi-select, autocomplete и time input

Статус: ready-for-agent

Архитектурная работа вне фаз, выбранная в architecture review от 2026-10-23 (кандидат 1).
Термины взяты из `GLOSSARY.md` → «Dropdowns»; термин **popup listbox field** добавлен туда для
этой работы.

## Постановка проблемы

В кит входят четыре popup listbox field: `ui-select`, `ui-multi-select`, `ui-autocomplete` и
`ui-time-input`. Контроллер listbox за ними глубокий, но каждое поле вручную заново собирает
оболочку вокруг него:

- ARIA combobox внутреннего элемента управления (`id`, `aria-label`, `aria-expanded`,
  `aria-controls`, `aria-activedescendant`, `aria-required`, `aria-invalid`, `aria-describedby`)
  написана четыре раза: на поле поиска и кнопке-триггере select, на input autocomplete и на input
  time input.
- Каждое поле объявляет одни и те же inputs (`id`, `aria-label`, `size`, `name`, `placeholder`),
  outputs `opened` / `closed`, `labelStrategy` / `controlId`, `focus` / `open` / `close`, которые
  просто передают вызов listbox, `onBlur`, который закрывает список и отмечает control как
  touched, один и тот же host-блок (id хоста, `aria-label` / `aria-describedby` равны `null`,
  классы size / disabled / readonly / invalid) и одни и те же providers: токен field control,
  value accessor и providers listbox.
- `fieldListboxConfig()` уже вынесли, чтобы разделить четыре члена конфигурации listbox, но всё
  перечисленное выше по-прежнему скопировано.

Для мейнтейнера исправление ARIA combobox (например, когда ставится `aria-controls`) нужно внести
в четыре шаблона, а новое popup listbox field должно скопировать около семи отдельных кусков.
Копии могут разойтись, и ни один тест этого не заметит: контракт ARIA проверяется только через
собственный спек каждого поля.

## Решение

Один deep module — **popup listbox field** — в entry point `listbox`, из трёх частей:

1. Директива на внутреннем элементе управления, `[uiComboboxControl]`, которая владеет
   динамической ARIA combobox.
2. Абстрактный базовый класс `ɵUiPopupListboxField` между `UiFormControlBase` и четырьмя полями.
   Он владеет общими inputs, outputs, host-привязками, обработкой blur и конфигурацией listbox,
   которую каждое поле передаёт одинаково.
3. Provider-helper `ɵprovideUiPopupListboxField()`, который возвращает все providers, нужные
   popup listbox field, кроме value accessor.

Тогда в поле остаётся только его собственное: смысл значения, статические атрибуты, шаблон
dropdown panel, конфигурация listbox и специфичные host-классы. Потребители не видят изменений:
отрисованный DOM, классы и публичные inputs и outputs остаются прежними.

## Пользовательские истории

1. Как мейнтейнер кита, я хочу, чтобы ARIA combobox каждого popup listbox field жила в одной
   директиве, чтобы исправление вносилось один раз и доходило до всех четырёх полей.
2. Как мейнтейнер кита, я хочу, чтобы `aria-expanded`, `aria-controls` и `aria-activedescendant`
   выводились из состояния listbox в одном месте, чтобы правило «только пока список показан» не
   могло разойтись между полями.
3. Как мейнтейнер кита, я хочу, чтобы `aria-required`, `aria-invalid` и `aria-describedby` брались
   из состояния control поля в одном месте, чтобы интеграция с form field была одинаковой во всех
   popup listbox field.
4. Как мейнтейнер кита, я хочу, чтобы `id` и `aria-label` внутреннего элемента управления ставила
   та же директива, чтобы `<label for>` и доступное имя работали одинаково во всех полях.
5. Как мейнтейнер кита, я хочу, чтобы поле поиска select и его кнопка-триггер использовали одну
   директиву, чтобы переключение `searchable` не меняло контракт ARIA.
6. Как мейнтейнер кита, я хочу, чтобы общие inputs (`id`, `aria-label`, `size`, `name`,
   `placeholder`) объявлялись один раз, чтобы их значения по умолчанию и документация не
   расходились.
7. Как мейнтейнер кита, я хочу, чтобы outputs `opened` и `closed` объявлялись один раз, чтобы
   каждое поле испускало их одинаково.
8. Как мейнтейнер кита, я хочу, чтобы `focus`, `open` и `close` давал базовый класс, чтобы полю не
   приходилось заново писать передачу вызовов в listbox.
9. Как мейнтейнер кита, я хочу общий шаг blur (закрыть, затем отметить touched), который поле
   может расширить, чтобы autocomplete по-прежнему сбрасывал текст, а time input фиксировал
   черновик.
10. Как мейнтейнер кита, я хочу, чтобы id хоста и `null` в host `aria-label` / `aria-describedby`
    ставил базовый класс, чтобы label и описания во всех полях оставались на внутреннем элементе
    управления.
11. Как мейнтейнер кита, я хочу, чтобы host-классы size, disabled, readonly и invalid строились из
    префикса, который объявляет поле, чтобы у каждого поля осталось своё имя BEM-блока.
12. Как мейнтейнер кита, я хочу, чтобы собственные host-классы поля (`--open`, `--clearable`,
    `--chips`) оставались в поле, чтобы базовый класс не обрастал состоянием конкретных полей.
13. Как мейнтейнер кита, я хочу один provider-helper для токена field control, токена поля и
    providers listbox, чтобы новое popup listbox field не могло забыть один из них.
14. Как мейнтейнер кита, я хочу, чтобы каждое поле по-прежнему само объявляло `NG_VALUE_ACCESSOR`,
    чтобы правило forms «каждый конкретный control сам объявляет свой accessor» продолжало
    выполняться и находилось grep'ом.
15. Как мейнтейнер кита, я хочу, чтобы общая для всех полей конфигурация listbox (`ariaLabel`,
    `locked`, `opened`, `closed`) стала protected-методом базового класса, чтобы свободную функцию
    можно было удалить, а поле передавало `this.fieldListboxConfig()` в `injectListbox()`.
16. Как мейнтейнер кита, я хочу, чтобы каждое поле само создавало свой listbox через
    `injectListbox()`, чтобы специфичная конфигурация (выбор, поиск, creatable, слоты времени)
    оставалась в поле.
17. Как мейнтейнер кита, я хочу, чтобы шаблон dropdown panel оставался в каждом поле, чтобы
    проекция контента и обработчик закрытия каждого поля оставались простыми.
18. Как мейнтейнер кита, я хочу, чтобы статические атрибуты (`role`, `aria-haspopup`,
    `aria-autocomplete`, `autocomplete="off"`) и `aria-readonly` оставались в шаблонах, чтобы
    отрисованный DOM не менялся, пока поля в них различаются.
19. Как мейнтейнер кита, я хочу один контрактный спек, который проверяет директиву и базовый класс
    на минимальном тестовом поле, чтобы контракт ARIA combobox проверялся в одном месте.
20. Как мейнтейнер кита, я хочу, чтобы существующие спеки и harnesses четырёх полей проходили без
    изменений, чтобы они доказывали, что рефакторинг не изменил поведение.
21. Как мейнтейнер кита, я хочу, чтобы визуальные baselines не менялись, чтобы было видно, что
    рефакторинг не меняет ничего видимого пользователю.
22. Как мейнтейнер кита, добавляющий пятое popup listbox field, я хочу расширить один базовый
    класс, применить одну директиву и вызвать один provider-helper, чтобы писать только смысл
    значения нового поля.
23. Как разработчик приложения-потребителя, я хочу, чтобы публичные inputs, outputs и DOM четырёх
    полей оставались ровно такими же, чтобы мои шаблоны, стили и тесты продолжали работать.
24. Как пользователь скринридера, я хочу, чтобы каждое popup listbox field одинаково объявляло
    раскрытое состояние, активную option и ошибки, чтобы поля вели себя согласованно.
25. Как мейнтейнер кита, я хочу, чтобы клиентская копия (`pnpm sync:client --verify`) собиралась с
    клиентским `useDefineForClassFields: false`, чтобы более глубокая цепочка наследования не
    сломала порядок инициализации полей в клиенте VPlans.
26. Как мейнтейнер кита, я хочу, чтобы отсутствие `aria-readonly` в time input было записано
    отдельным вопросом, чтобы рефакторинг не изменил его молча и пробел не потерялся.

## Решения по реализации

- **Размещение.** Module живёт в entry point `listbox`, рядом с контроллером listbox. `core` не
  зависит от `listbox`, а module нужен контроллер. Все три части внутренние (экспорты с префиксом
  `ɵ`); ими пользуются `select`, `autocomplete` и `time`.
- **Токен поля.** Новый внутренний injection token для popup listbox field. Директива получает его
  и контроллер listbox, чтобы читать `controlId`, `ariaLabel`, `isRequired`, `showError`,
  `describedBy` из поля и `shown`, `panelId`, `activeId` из listbox. `UiFormFieldControl` в `core`
  не расширяется: он публичный, им пользуется `ui-form-field`.
- **Директива `[uiComboboxControl]` (`ɵUiComboboxControl`).** Ставится на внутренний `<input>` или
  `<button>` поля. Host-привязки: `id`, `aria-label` (или `null`, если пусто), `aria-expanded`,
  `aria-controls` и `aria-activedescendant` (только пока listbox показан), `aria-required` и
  `aria-invalid` (`'true'` или `null`), `aria-describedby`. Она не ставит `role`, `aria-haspopup`,
  `aria-autocomplete`, `autocomplete` и `aria-readonly`: они остаются в шаблонах, потому что поля в
  них различаются, а DOM меняться не должен.
- **Базовый класс `ɵUiPopupListboxField<V>`.** Абстрактная `@Directive`, которая расширяет
  `UiFormControlBase<V>` и реализует `UiFormFieldControl`. Она владеет:
  - inputs `id` (по умолчанию из префикса id поля), `aria-label`, `size`, `name`, `placeholder`;
    outputs `opened`, `closed`;
  - `labelStrategy = 'for'`, `controlId` (`${id}-control`), `focus()`, `open()`, `close()`;
  - protected `onBlur()`, который закрывает listbox и отмечает control как touched; autocomplete и
    time input переопределяют его и вызывают `super.onBlur()` там, где это позволяет нынешний
    порядок;
  - host-привязками: `id` хоста, `aria-label` / `aria-describedby` равны `null`, классы
    `<prefix>--<size>`, `<prefix>--disabled`, `<prefix>--readonly`, `<prefix>--invalid`;
  - protected `fieldListboxConfig()`, который заменяет свободную функцию `fieldListboxConfig()`;
    она удаляется;
  - абстрактными членами: `classPrefix` (например, `'ui-select'`) и `listbox` (контроллер, который
    поле создаёт через `injectListbox()`).
- **Цепочка select.** `UiSelectBase` расширяет `ɵUiPopupListboxField` вместо `UiFormControlBase` и
  сохраняет свои inputs, host-классы и абстрактные члены, которые есть только у select. Кандидат 4
  из review (модель выбора вместо hooks) в эту работу не входит.
- **Provider-helper `ɵprovideUiPopupListboxField(() => Field)`.** Возвращает токен поля, provider
  `UI_FORM_FIELD_CONTROL` и providers listbox. Каждое поле по-прежнему перечисляет рядом
  `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Field), multi: true }`.
- **DOM не меняется.** Те же атрибуты, значения и классы на хосте и на внутреннем элементе
  управления. Порядок атрибутов может измениться; DOM-снапшотов в тестах нет.
- **Публичный interface не меняется.** Ни один input, output или публичный метод четырёх полей не
  добавляется, не удаляется и не переименовывается.
- **Порядок работы.** Два коммита: сначала директива (применённая во всех четырёх полях), затем
  базовый класс с provider-helper. Каждый коммит сам по себе проходит полную проверку.

## Решения по тестированию

- Хороший тест управляет полем через его публичную поверхность (inputs, привязанный form control,
  клавиатуру, harnesses) и проверяет то, что видит пользователь или вспомогательная технология:
  атрибуты, классы, испущенные outputs, состояние touched у control. Он не проверяет, какой класс
  или какая директива поставили атрибут.
- **Существующие спеки и harnesses четырёх полей проходят без правок.** Это сетка безопасности,
  доказывающая, что поведение не изменилось. Если их приходится править, значит, рефакторинг
  изменил поведение, и это нужно объяснить.
- **Один новый контрактный спек в entry point `listbox`** управляет минимальным тестовым полем,
  которое расширяет базовый класс, применяет директиву и использует provider-helper. Он
  покрывает: набор ARIA в закрытом и открытом состоянии (expanded, controls, active descendant),
  required / invalid / described-by от привязанного form control, `id` / `aria-label` на
  внутреннем элементе управления и `null` на хосте, host-классы size / disabled / readonly /
  invalid из префикса, outputs `opened` / `closed` и отметку touched при blur.
- **Образцы:** тестовый хост `TestField` в спеке listbox (минимальное поле вокруг контроллера
  listbox) и спеки select, autocomplete и time-input для проверок ARIA с привязанной формой.
- **Визуальные baselines** не меняются (`/phase-check`).
- **Клиентская копия:** `pnpm sync:client --verify` проходит.

## Вне рамок

- Изменение любого отрисованного атрибута, класса или публичного input, включая выравнивание
  различий между полями (нет `aria-readonly` в time input, `name` у searchable select).
- Перенос шаблона dropdown panel в module.
- Перенос вызовов `injectListbox()` или специфичной конфигурации listbox в базовый класс.
- Объединение harnesses (кандидат 6 из review).
- Модель выбора select (кандидат 4), draft разбираемого текста (кандидат 2), date picker'ы
  (кандидат 3) и overlay tooltip/popover (кандидат 5).
- Расширение `UiFormFieldControl` в `core`.

## Дополнительные заметки

- В time input нет `aria-readonly`, а в select и autocomplete он есть. Это станет отдельным
  тикетом `needs-info`; рефакторинг сохраняет нынешний DOM.
- ADR не нужен: изменение внутреннее и обратимое.
- Применимые подводные камни: метаданные `providers` не наследуются (`.claude/rules/forms.md`);
  клиент собирается с `useDefineForClassFields: false` (`.claude/rules/components.md` → «The client
  copy»); Storybook JIT требует, чтобы классы были объявлены до того, как на них ссылаются в
  запросах или через `forwardRef` (`.claude/rules/components.md` → «Storybook JIT»).
