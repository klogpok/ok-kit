# Popup listbox: one dropdown panel and one listbox for the fields

Architecture work outside the phases, chosen in the architecture review of 2026-10-11. Terms are
from `GLOSSARY.md` → "Dropdowns".

## Problem

- Four fields open a dropdown panel and each repeats the lifecycle: `select/option-panel.ts`
  (also used by `autocomplete`), `time/time-input.ts`, `datepicker/datepicker.ts`,
  `datepicker/date-range-picker.ts`. Each one repeats the `cdkConnectedOverlay` template,
  `positions`, `panelOffsetX`, `panelWidth`, `syncOverlayDirection` on attach and the outside
  click check. The rule "every overlay syncs the direction and the offset when it opens" lives only
  in `.claude/rules/overlays.md`.
- `time-input` re-implements the popup listbox of `select` (~60 lines: key manager, active option,
  open/close) and borrows its internal class `ui-select__panel`. `autocomplete` borrows the same
  class. `select/public-api.ts` exports `ɵUiOptionPanel`, `ɵUiOptionParent` and `ɵUiItemOption` for
  the neighbours.
- The keyboard policy is written three times (`select-base.ts`, `autocomplete.ts`,
  `time-input.ts`) and has already diverged: see ticket 01.
- A new `items` array with the same values resets the active option and the scroll position.

## Decisions (user, 2026-10-11)

1. **Two modules.** A dropdown panel in `core` owns the overlay lifecycle: open/close, positions,
   offset, width from the origin, direction on attach, outside click, and an optional focus return.
   The datepickers and the popup listbox use it. The popup listbox sits on top of it for `select`,
   `multi-select`, `autocomplete` and `time-input`.
2. **New internal entry point `@vplans/ui-kit/listbox`.** It holds `UiOption`, `UiOptionGroup`,
   the item options, the listbox controller and the panel styles. `select` re-exports `UiOption`
   and `UiOptionGroup`, so consumers' imports do not change. The `ɵ` exports leave `select`.
3. **The dropdown panel is a directive on `<ng-template>`** with
   `hostDirectives: [CdkConnectedOverlay]`, driven through the CDK instance. A prototype works
   under CDK 20.2: `prototype/dropdown-panel.ts` and its spec.
4. **The directive relies on the `offsetX` setter re-applying the position strategy** (CDK
   behavior, not a documented contract). Accepted because Angular and CDK stay on 20; the panel
   spec guards it (reopen with a new offset and width), and `overlays.md` records it.
5. **Focus return is part of the dropdown panel** (optional `returnFocusTo`: if focus was inside
   the panel when it closes, move it there). `notifyTouched` stays in the field: the panel knows
   nothing about forms.
6. **Composition, not inheritance, for the listbox.** The field creates the listbox controller in
   its injection context (like `injectControlState()`) and passes a mode and callbacks. Fields stay
   on `UiFormControlBase`; the three-level hierarchy goes away.
7. **One keyboard handler with a mode** (trigger button / searchable / free text) and a few hooks
   (`activateOnOpen`). The "ArrowUp from no active option" workaround exists once.
8. **The ArrowUp bug in `autocomplete` is fixed first**, test-first, in its own commit.
9. **The panel class `ui-select__panel` becomes `ui-listbox`**, with a CHANGELOG entry. Nothing
   outside the kit uses it; the harnesses do not read it.
10. **The listbox matches entries by value** through `compareWith`: a new `items` array with the
    same values keeps the active option. Only a value that really disappears resets it.
11. **One internal listbox harness**; the select, autocomplete and time harnesses use it. Their
    public interface does not change, so they guard the refactor.
12. **Tracked as its own ROADMAP section** ("Popup listbox"), with the tickets below, one branch,
    `/phase-check` and a report at the end.

## Tickets

01 → 02 → (03, 04) → (05, 06) → 07 → 08 → 09. See `issues/`.

## Out of scope

- Popover, tooltip, dialog and toast focus policy (architecture candidate 3).
- `menu` (CDK Menu holds commands, not values).
- Parsed text field (candidate 2): the datepickers keep their drafts.

## Русский перевод

# Popup listbox: одна dropdown panel и один listbox для полей

Архитектурная работа вне фаз, выбранная на архитектурном обзоре 2026-10-11. Термины — из
`GLOSSARY.md` → «Dropdowns».

## Проблема

- Четыре поля открывают dropdown panel, и каждое повторяет жизненный цикл: `select/option-panel.ts`
  (его использует и `autocomplete`), `time/time-input.ts`, `datepicker/datepicker.ts`,
  `datepicker/date-range-picker.ts`. Каждое повторяет шаблон `cdkConnectedOverlay`, `positions`,
  `panelOffsetX`, `panelWidth`, `syncOverlayDirection` на attach и проверку outside click. Правило
  «каждый overlay синхронизирует direction и offset при открытии» живёт только в
  `.claude/rules/overlays.md`.
- `time-input` заново реализует popup listbox из `select` (~60 строк: key manager, active option,
  open/close) и заимствует его внутренний класс `ui-select__panel`. `autocomplete` заимствует тот
  же класс. `select/public-api.ts` экспортирует `ɵUiOptionPanel`, `ɵUiOptionParent` и
  `ɵUiItemOption` для соседей.
- Политика клавиатуры написана трижды (`select-base.ts`, `autocomplete.ts`, `time-input.ts`) и уже
  разошлась: см. тикет 01.
- Новый массив `items` с теми же значениями сбрасывает active option и позицию прокрутки.

## Решения (пользователь, 2026-10-11)

1. **Два модуля.** Dropdown panel в `core` владеет жизненным циклом overlay: open/close, позиции,
   offset, ширина по origin, direction на attach, outside click и опциональный возврат фокуса. Её
   используют датапикеры и popup listbox. Popup listbox стоит поверх неё для `select`,
   `multi-select`, `autocomplete` и `time-input`.
2. **Новый internal entry point `@vplans/ui-kit/listbox`.** В нём `UiOption`, `UiOptionGroup`,
   опции из items, контроллер listbox и стили панели. `select` реэкспортирует `UiOption` и
   `UiOptionGroup`, импорты потребителей не меняются. `ɵ`-экспорты уходят из `select`.
3. **Dropdown panel — директива на `<ng-template>`** с `hostDirectives: [CdkConnectedOverlay]`,
   управляемая через инстанс CDK. Прототип работает под CDK 20.2: `prototype/dropdown-panel.ts` и
   его spec.
4. **Директива опирается на то, что сеттер `offsetX` переприменяет стратегию позиционирования**
   (поведение CDK, не документированный контракт). Принято, потому что Angular и CDK остаются на 20;
   spec панели это сторожит (повторное открытие с новым offset и шириной), `overlays.md` это
   записывает.
5. **Возврат фокуса — часть dropdown panel** (опциональный `returnFocusTo`: если при закрытии фокус
   был в панели, перенести его туда). `notifyTouched` остаётся в поле: панель ничего не знает о
   формах.
6. **Композиция, а не наследование, для listbox.** Поле создаёт контроллер listbox в своём
   injection context (как `injectControlState()`) и передаёт режим и колбэки. Поля остаются на
   `UiFormControlBase`; трёхуровневая иерархия исчезает.
7. **Один обработчик клавиатуры с режимом** (trigger-кнопка / searchable / free text) и парой хуков
   (`activateOnOpen`). Обход «ArrowUp без active option» существует в одном месте.
8. **Баг ArrowUp в `autocomplete` исправляется первым**, через красный тест, отдельным коммитом.
9. **Класс панели `ui-select__panel` становится `ui-listbox`**, с записью в CHANGELOG. Вне кита его
   никто не использует; harness'ы его не читают.
10. **Listbox сопоставляет записи по значению** через `compareWith`: новый массив `items` с теми же
    значениями сохраняет active option. Сбрасывает его только реально исчезнувшее значение.
11. **Один внутренний listbox-harness**; harness'ы select, autocomplete и time стоят на нём. Их
    публичный интерфейс не меняется, поэтому они страхуют рефакторинг.
12. **Ведётся отдельным разделом ROADMAP** («Popup listbox»), с тикетами ниже, одной веткой,
    `/phase-check` и отчётом в конце.

## Тикеты

01 → 02 → (03, 04) → (05, 06) → 07 → 08 → 09. См. `issues/`.

## Вне охвата

- Политика фокуса popover, tooltip, dialog и toast (архитектурный кандидат 3).
- `menu` (CDK Menu содержит команды, а не значения).
- Parsed text field (кандидат 2): датапикеры сохраняют свои черновики.
