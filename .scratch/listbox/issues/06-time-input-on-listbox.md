# 06: time-input on the listbox

**Status:** done
**Blocked by:** 04

`time-input.ts` drops its own `ActiveDescendantKeyManager`, `activeId`, open/close, `onAttach`,
`onOutsideClick`, the hand-written `UiOptionOwner` and its `onKeydown` branches for the list, and
uses the listbox controller in free text mode with its slots as `items`. Its draft and typed-text
parsing stay.

- [x] Existing time-input and harness specs green; skipping unavailable slots still works.
- [x] Visual baselines unchanged.
- [x] Commit `refactor(time): use the popup listbox`.

## Comments

**2026-10-11 - done.** Commit `refactor(time): use the popup listbox`.

- `ui-time-input` lists `ɵprovideUiListbox()` and calls `ɵinjectListbox()` with `mode: 'freeText'`,
  its slots as `items`, `locked` (readonly or disabled), `isSelected`, `select` (pick), `opened` /
  `closed` (its outputs) and `openAt`: the slot at the value, or at the time now, or the first
  later one. Typing still activates the nearest slot (`activateValue()`). The keyboard is
  `listbox.handleKeydown()`; when it returns false on Enter, the field commits the typed text. The
  list renders as `ui-listbox` inside `uiDropdownPanel`; the field no longer includes the
  `select/panel` styles. Nothing changed in `projects/ui-kit/listbox/`.
- Virtual scroll: the slots reach the default threshold of 100 at an interval of 14 minutes or
  less, so the field passes `virtualThreshold: () => Infinity` and every slot stays rendered (the
  harness reads the whole list). New test: an interval of 5 renders 288 options without a
  viewport and opens at 23:55; it fails without the override.
- "Skipping unavailable slots" cannot be tested: slots are never disabled (`timeSlots()` returns
  only times inside the limits, and the field gives no `isBlocked`). The controller's skip
  predicate (disabled or blocked) covers it if such slots ever appear; no feature was invented.
- Behavior change from ticket 04: ArrowUp in an open list without an active slot goes to the last
  slot (it did nothing). It is hard to reach, because opening always activates a slot. A list
  with no slots (`minTime` after `maxTime`) now shows the "no options" row instead of an empty
  panel.
- Checked in Edge (built Storybook, light/dark RTL and light LTR): the list opens at 14:30, as
  wide as the field, ArrowDown moves to 15:00, Escape and ArrowDown reopen at 14:30.
- Tests: `time-input.spec.ts` 24, `time-input-harness.spec.ts` 3, `forms-interop.spec.ts` 2; full
  suite 960 green; lint and format clean; `pnpm test-visual --filter time-input`: no changes
  (no story opens the list).
- Left for ticket 05 (it edits `select`): the comment in `select/public-api.ts` still names
  `ui-time-input` as a user of `ɵprovideUiOptionParent`.

## Русский перевод

# 06: time-input на listbox

**Статус:** сделано
**Зависит от:** 04

`time-input.ts` убирает свой `ActiveDescendantKeyManager`, `activeId`, open/close, `onAttach`,
`onOutsideClick`, рукописный `UiOptionOwner` и ветки `onKeydown` для списка и использует контроллер
listbox в режиме free text, отдавая слоты как `items`. Черновик и разбор введённого текста остаются.

- [x] Существующие spec time-input и harness'а зелёные; пропуск недоступных слотов работает.
- [x] Визуальные снимки не меняются.
- [x] Коммит `refactor(time): use the popup listbox`.

## Комментарии

**2026-10-11 - сделано.** Коммит `refactor(time): use the popup listbox`.

- `ui-time-input` указывает `ɵprovideUiListbox()` и вызывает `ɵinjectListbox()` с
  `mode: 'freeText'`, слотами как `items`, `locked` (readonly или disabled), `isSelected`, `select`
  (pick), `opened` / `closed` (его outputs) и `openAt`: слот на значении или на текущем времени,
  иначе первый следующий. Ввод по-прежнему делает активным ближайший слот (`activateValue()`).
  Клавиатура — `listbox.handleKeydown()`; если он вернул false на Enter, поле фиксирует введённый
  текст. Список рендерится как `ui-listbox` внутри `uiDropdownPanel`; поле больше не подключает
  стили `select/panel`. В `projects/ui-kit/listbox/` ничего не менялось.
- Virtual scroll: слоты достигают порога по умолчанию 100 при интервале 14 минут и меньше, поэтому
  поле передаёт `virtualThreshold: () => Infinity` и все слоты остаются отрисованными (harness
  читает весь список). Новый тест: интервал 5 рендерит 288 опций без viewport и открывается на
  23:55; без override он падает.
- «Пропуск недоступных слотов» проверить нельзя: слоты никогда не бывают disabled (`timeSlots()`
  возвращает только времена в пределах лимитов, а поле не передаёт `isBlocked`). Skip predicate
  контроллера (disabled или blocked) покроет это, если такие слоты появятся; новую функцию не
  придумывали.
- Изменение поведения из тикета 04: ArrowUp в открытом списке без активного слота ведёт на
  последний слот (раньше ничего не делал). Достичь этого трудно: открытие всегда делает слот
  активным. Список без слотов (`minTime` позже `maxTime`) теперь показывает строку «нет опций»
  вместо пустой панели.
- Проверено в Edge (собранный Storybook, light/dark RTL и light LTR): список открывается на 14:30,
  шириной с поле, ArrowDown переходит на 15:00, Escape и ArrowDown снова открывают на 14:30.
- Тесты: `time-input.spec.ts` 24, `time-input-harness.spec.ts` 3, `forms-interop.spec.ts` 2; весь
  набор 960 зелёных; lint и format чистые; `pnpm test-visual --filter time-input`: изменений нет
  (ни одна story не открывает список).
- Оставлено тикету 05 (он правит `select`): комментарий в `select/public-api.ts` ещё называет
  `ui-time-input` пользователем `ɵprovideUiOptionParent`.
