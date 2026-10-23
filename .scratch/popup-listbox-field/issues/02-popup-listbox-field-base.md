# 02: `ɵUiPopupListboxField` and `ɵprovideUiPopupListboxField()` own the field shell

**Status:** done
**Blocked by:** 01

Spec: `../spec.md` → "Implementation Decisions": base class, select chain, provider helper.

**What to build:** a maintainer adds a popup listbox field by extending one base class, applying
the directive of ticket 01 and calling one provider helper, and writes only the field's value
semantics. The four fields lose their copies of the shared inputs, outputs, host block, blur step
and providers; consumers see no change.

- The internal abstract base class `ɵUiPopupListboxField<V>` extends `UiFormControlBase<V>` and
  implements `UiFormFieldControl`. It owns the inputs `id`, `aria-label`, `size`, `name`,
  `placeholder`; the outputs `opened`, `closed`; `labelStrategy`, `controlId`, `focus()`,
  `open()`, `close()`; a protected `onBlur()` (close, then mark touched) that fields extend with
  `super.onBlur()`; the host id, `null` host `aria-label` / `aria-describedby`, and the
  `<prefix>--<size>` / `--disabled` / `--readonly` / `--invalid` classes from an abstract
  `classPrefix`; a protected `fieldListboxConfig()`. `listbox` is abstract: each field still
  creates it with `injectListbox()`.
- The free `fieldListboxConfig()` function is removed.
- `UiSelectBase` extends the new base class and keeps only its select-specific members and host
  classes. `ui-autocomplete` and `ui-time-input` extend it directly.
- The internal helper `ɵprovideUiPopupListboxField(() => Field)` returns the field token,
  `UI_FORM_FIELD_CONTROL` and the listbox providers. Each field keeps its own
  `NG_VALUE_ACCESSOR` line.

- [x] The base class and the provider helper exist in the `listbox` entry point as internal
      exports; the free `fieldListboxConfig()` is gone.
- [x] Select, multi-select, autocomplete and time input extend the base class and use the helper;
      none of them re-declares a member the base class owns.
- [x] Each field's own blur behavior is kept (autocomplete resets its text and query, time input
      commits its draft), in today's order.
- [x] Public inputs, outputs and methods of the four fields are unchanged; the rendered host and
      inner-control attributes and classes are unchanged (order may differ).
- [x] The contract spec of ticket 01 is extended: the test field extends the base class and uses
      the helper; it covers the host classes from the prefix, `null` host `aria-label` /
      `aria-describedby`, the `opened` / `closed` outputs and blur marking the control touched.
- [x] The existing specs and harnesses of the four fields pass without edits.
- [ ] `/phase-check` passes, visual baselines unchanged; `pnpm sync:client --verify` passes (the
      client compiles with `useDefineForClassFields: false`).
  - 2026-10-23, orchestrator: `pnpm phase-check` passed on `spec/popup-listbox-field` (1017 tests, 315 stories in 3 modes, baselines unchanged). `pnpm sync:client --verify` was not run: there is no client checkout on this machine, so the item stays open.
- [x] One commit, `refactor(listbox): ...`.
  - 2026-10-23: the user kept one commit per TDD step instead.

## Русский перевод

# 02: `ɵUiPopupListboxField` и `ɵprovideUiPopupListboxField()` владеют оболочкой поля

**Статус:** сделано
**Заблокирован:** 01

Spec: `../spec.md` → «Решения по реализации»: базовый класс, цепочка select, provider-helper.

**Что сделать:** мейнтейнер добавляет popup listbox field, расширяя один базовый класс, применяя
директиву из тикета 01 и вызывая один provider-helper, и пишет только смысл значения поля. Четыре
поля теряют свои копии общих inputs, outputs, host-блока, шага blur и providers; потребители
изменений не видят.

- Внутренний абстрактный базовый класс `ɵUiPopupListboxField<V>` расширяет `UiFormControlBase<V>`
  и реализует `UiFormFieldControl`. Он владеет inputs `id`, `aria-label`, `size`, `name`,
  `placeholder`; outputs `opened`, `closed`; `labelStrategy`, `controlId`, `focus()`, `open()`,
  `close()`; protected `onBlur()` (закрыть, затем отметить touched), который поля расширяют через
  `super.onBlur()`; id хоста, `null` в host `aria-label` / `aria-describedby` и классами
  `<prefix>--<size>` / `--disabled` / `--readonly` / `--invalid` из абстрактного `classPrefix`;
  protected `fieldListboxConfig()`. `listbox` абстрактный: каждое поле по-прежнему создаёт его
  через `injectListbox()`.
- Свободная функция `fieldListboxConfig()` удаляется.
- `UiSelectBase` расширяет новый базовый класс и сохраняет только члены и host-классы, которые есть
  только у select. `ui-autocomplete` и `ui-time-input` расширяют его напрямую.
- Внутренний helper `ɵprovideUiPopupListboxField(() => Field)` возвращает токен поля,
  `UI_FORM_FIELD_CONTROL` и providers listbox. Каждое поле сохраняет свою строку
  `NG_VALUE_ACCESSOR`.

- [x] Базовый класс и provider-helper есть в entry point `listbox` как внутренние экспорты;
      свободной `fieldListboxConfig()` больше нет.
- [x] Select, multi-select, autocomplete и time input расширяют базовый класс и используют helper;
      ни одно из них не объявляет заново член, которым владеет базовый класс.
- [x] Собственное поведение blur каждого поля сохранено (autocomplete сбрасывает текст и запрос,
      time input фиксирует черновик) в нынешнем порядке.
- [x] Публичные inputs, outputs и методы четырёх полей не изменились; отрисованные атрибуты и
      классы хоста и внутреннего элемента управления не изменились (порядок может отличаться).
- [x] Контрактный спек из тикета 01 расширен: тестовое поле расширяет базовый класс и использует
      helper; спек покрывает host-классы из префикса, `null` в host `aria-label` /
      `aria-describedby`, outputs `opened` / `closed` и отметку touched при blur.
- [x] Существующие спеки и harnesses четырёх полей проходят без правок.
- [ ] `/phase-check` проходит, визуальные baselines не меняются; `pnpm sync:client --verify`
      проходит (клиент собирается с `useDefineForClassFields: false`).
  - 2026-10-23, оркестратор: `pnpm phase-check` прошёл на `spec/popup-listbox-field` (1017 тестов, 315 историй в 3 режимах, baselines без изменений). `pnpm sync:client --verify` не запускался: на этой машине нет копии клиента, поэтому пункт остаётся открытым.
- [x] Один коммит, `refactor(listbox): ...`.
  - 2026-10-23: пользователь оставил по коммиту на каждый шаг TDD.
