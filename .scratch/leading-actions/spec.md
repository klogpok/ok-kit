# Leading actions: the popup listbox owns "Add «…»" and "Select all"

Architecture work outside the phases, chosen in the architecture review of 2026-10-21 (candidate
1). Terms are from `GLOSSARY.md` → "Dropdowns"; **leading action** was added there for this work.

## Problem

The popup listbox does not know that a choice can act on the value instead of being one value. The
two leading actions of `ui-select` / `ui-multi-select` are faked in several modules:

- They are `viewChild` options of `select/select.html`, projected through the `uiListboxLeading`
  slot and passed back as `leadingOptions`. The controller sees them only after they render, so
  `select-base.ts` carries an effect that activates "Add «…»" once it renders and a keydown case
  for Enter typed before that.
- Five config hooks exist only for them: `alwaysShown`, `passedOver`, `leadingShown`,
  `isIndeterminate`, and the `isLeading` exclusion inside multi-select's `isBlocked`.
- Their values are the `CREATE` and `SELECT_ALL` symbols, which `isSelected` and `toggleValue`
  filter out by hand.
- `aria-setsize` / `aria-posinset` are computed in `select.html` (`leadingCount`) and again in
  `listbox/listbox.ts`.
- The rules are tested only through the select specs; `listbox.spec.ts` never uses these hooks.

`1051abc` (creatable) touched four modules and added two hooks for one field feature.

## Decisions (user, 2026-10-21)

1. **Two named leading actions.** The listbox knows "create" and "select all" and applies their
   rules itself: "Add «…»" comes first, is passed over by `activateFirst()` while the search shows
   another option, and keeps the "no options" row away; "Select all" can be partially checked.
   No generic "action row" with flags: that would rebuild the hooks.
2. **Leading actions are data of the controller**, like `UiItemEntry`, and `ui-listbox` renders
   them with labels from `UI_LABELS` (`create(text)`, `selectAll`). They are in the keyboard order
   as soon as they exist, without waiting for a render; the activation effect and the Enter case
   in `select-base.ts` go away.
3. **Separate handlers.** Picking a leading action calls the field's `create(text)` or
   `selectAll(values, on)`, never `select(value)`. The `CREATE` and `SELECT_ALL` symbols go away.
4. **The listbox owns the "Add «…»" rule.** The field says whether it can create now (`creatable`,
   `searchable`, and `maxSelections` not reached) and which values are selected. The listbox
   compares the trimmed search text, ignoring case, with the labels of the options and of the
   selected values.
5. **The listbox owns the "Select all" state.** The field says whether it is on (`selectAll` and
   no `maxSelections`). The listbox computes the options it acts on (enabled and shown by the
   search), whether they are all or partly selected, and whether it is shown (at least one such
   option). `ui-multi-select` only builds the new array in `selectAll(values, on)`.
6. **Classes of the listbox.** `.ui-select__leading`, `.ui-select__create` and `.ui-select__all`
   become `.ui-listbox__actions`, `.ui-listbox__create` and `.ui-listbox__select-all` in
   `listbox/listbox.scss`, with the row that sticks over a virtual list. CHANGELOG notes the
   rename. The internal listbox harness gets methods for the two actions.
7. **Tests: replace, don't layer.** The rules move to `listbox.spec.ts` through its test field:
   keyboard order, passing over "Add «…»", the "no options" row, the mixed state,
   `aria-setsize`/`aria-posinset`, Enter right after typing. The select specs keep what the value
   means (created string values, their label, `maxLength`, the FSI isolation of the Hebrew label,
   `maxSelections`) and one end-to-end test per action. Play stories that need real layout (the
   sticky row, fonts) stay.
8. **The `uiListboxLeading` slot and the `leadingOptions` config member are removed.** Only
   `select` used them.
9. **Out of scope:** the `input.value = ''` write in `UiMultiSelect.addCreated` stays in the field
   (architecture candidate 2, the combobox shell). `maxSelections` keeps `isBlocked`; leading
   actions are never blocked, so its `isLeading` exclusion goes away.
10. **No ADR:** easy to reverse.

## Constraints

- The listbox is internal (`ɵ` exports); the public interface of `ui-select` and
  `ui-multi-select` does not change. Their harnesses keep their public methods.
- The decisions in `docs/DECISIONS.md` hold, including `creatable` alone labelling a string value
  outside the list (client-pilot ticket 02) and the Hebrew "Add" label isolating the typed text.
- The VPlans client is not checked out locally: whether it styles `.ui-select__create` or
  `.ui-select__all` is unknown. Check the client copy with `pnpm sync:client --check` before the
  rename lands and note the result in ticket 03.

## Tickets

01 → 02 → 03. See `issues/`.

## Русский перевод

# Leading actions: popup listbox владеет «Добавить «…»» и «Выбрать все»

Архитектурная работа вне фаз, выбранная на архитектурном обзоре 2026-10-21 (кандидат 1). Термины —
из `GLOSSARY.md` → «Dropdowns»; термин **leading action** добавлен туда для этой работы.

## Проблема

Popup listbox не знает, что выбор может действовать на значение, а не быть одним из значений. Два
leading action у `ui-select` / `ui-multi-select` изображаются в нескольких модулях:

- Это `viewChild`-опции `select/select.html`: они проецируются через слот `uiListboxLeading` и
  возвращаются как `leadingOptions`. Контроллер видит их только после рендера, поэтому в
  `select-base.ts` есть effect, который активирует «Добавить «…»» после рендера, и случай в keydown
  для Enter, нажатого раньше.
- Пять хуков конфига существуют только ради них: `alwaysShown`, `passedOver`, `leadingShown`,
  `isIndeterminate` и исключение `isLeading` внутри `isBlocked` у multi-select.
- Их значения — символы `CREATE` и `SELECT_ALL`, которые `isSelected` и `toggleValue` отфильтровывают
  вручную.
- `aria-setsize` / `aria-posinset` считаются в `select.html` (`leadingCount`) и ещё раз в
  `listbox/listbox.ts`.
- Правила проверяются только через spec select; `listbox.spec.ts` эти хуки не использует.

`1051abc` (creatable) затронул четыре модуля и добавил два хука ради одной функции поля.

## Решения (пользователь, 2026-10-21)

1. **Два именованных leading action.** Listbox знает «создать» и «выбрать все» и сам применяет их
   правила: «Добавить «…»» идёт первым, `activateFirst()` пропускает его, пока поиск показывает
   другую опцию, и при нём нет строки «нет вариантов»; «Выбрать все» может быть частично отмечено.
   Без общей «строки-действия» с флагами: она восстановила бы хуки.
2. **Leading action — данные контроллера**, как `UiItemEntry`, и `ui-listbox` рендерит их с
   подписями из `UI_LABELS` (`create(text)`, `selectAll`). Они попадают в порядок клавиатуры, как
   только появляются, не дожидаясь рендера; effect активации и случай Enter в `select-base.ts`
   удаляются.
3. **Отдельные обработчики.** Выбор leading action вызывает у поля `create(text)` или
   `selectAll(values, on)`, но не `select(value)`. Символы `CREATE` и `SELECT_ALL` удаляются.
4. **Правило «Добавить «…»» у listbox.** Поле сообщает, можно ли создавать сейчас (`creatable`,
   `searchable` и не достигнут `maxSelections`), и какие значения выбраны. Listbox сравнивает
   обрезанный текст поиска без учёта регистра с подписями опций и выбранных значений.
5. **Состояние «Выбрать все» у listbox.** Поле сообщает, включено ли оно (`selectAll` и нет
   `maxSelections`). Listbox считает опции, на которые оно действует (включённые и показанные
   поиском), выбраны ли они все или частично и показано ли оно (есть хотя бы одна такая опция).
   `ui-multi-select` только собирает новый массив в `selectAll(values, on)`.
6. **Классы listbox.** `.ui-select__leading`, `.ui-select__create` и `.ui-select__all` становятся
   `.ui-listbox__actions`, `.ui-listbox__create` и `.ui-listbox__select-all` в
   `listbox/listbox.scss` вместе со строкой, которая прилипает над виртуальным списком. В CHANGELOG
   — заметка о переименовании. Внутренний harness listbox получает методы для двух действий.
7. **Тесты: заменять, а не наслаивать.** Правила переезжают в `listbox.spec.ts` через его тестовое
   поле: порядок клавиатуры, пропуск «Добавить «…»», строка «нет вариантов», частичная отметка,
   `aria-setsize`/`aria-posinset`, Enter сразу после ввода. В spec select остаётся смысл значения
   (созданные строковые значения, их подпись, `maxLength`, FSI-изоляция ивритской подписи,
   `maxSelections`) и по одному сквозному тесту на действие. Play-истории, которым нужна настоящая
   раскладка (липкая строка, шрифты), остаются.
8. **Слот `uiListboxLeading` и член конфига `leadingOptions` удаляются.** Их использовал только
   `select`.
9. **Вне рамок:** запись `input.value = ''` в `UiMultiSelect.addCreated` остаётся в поле
   (архитектурный кандидат 2, оболочка комбобокса). `maxSelections` сохраняет `isBlocked`; leading
   action никогда не блокируются, поэтому исключение `isLeading` удаляется.
10. **Без ADR:** решение легко отменить.

## Ограничения

- Listbox внутренний (`ɵ`-экспорты); публичный интерфейс `ui-select` и `ui-multi-select` не
  меняется. Их harness'ы сохраняют свои публичные методы.
- Решения из `docs/DECISIONS.md` сохраняются, в том числе: один `creatable` даёт строковому
  значению вне списка его собственную подпись (client-pilot, тикет 02), и ивритская подпись
  «Добавить» изолирует набранный текст.
- Клиент VPlans локально не выкачан: неизвестно, стилизует ли он `.ui-select__create` или
  `.ui-select__all`. Проверить копию клиента через `pnpm sync:client --check` до переименования и
  записать результат в тикет 03.

## Тикеты

01 → 02 → 03. См. `issues/`.
