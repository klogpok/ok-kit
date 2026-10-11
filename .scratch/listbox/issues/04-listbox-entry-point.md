# 04: listbox entry point with the listbox controller

**Status:** done
**Blocked by:** 02

New internal secondary entry point `@vplans/ui-kit/listbox` (README → "Adding a component").

- `UiOption`, `UiOptionGroup` and the item options move there from `select/option.ts` and
  `select/option-items.ts`. `select` re-exports `UiOption` and `UiOptionGroup`.
- A listbox controller, created by the field in its injection context, owns: options from content
  and from `items`, filter, virtual scroll, the active option, the `ActiveDescendantKeyManager`,
  scrolling to the active option, ids for `aria-activedescendant` / `aria-controls`, and the one
  keyboard handler. The field passes a mode (trigger button / searchable / free text) and
  callbacks (is selected, select, activate on open, blocked, always shown).
- Options reach the controller through one DI token instead of `UiOptionParent` with an owner of 7
  methods.
- Panel styles from `select/_panel.scss` move there; `.ui-select__panel` becomes `.ui-listbox`.
- The listbox renders inside `uiDropdownPanel`.

- [x] Entry point, controller and styles; spec of the controller through its interface (keyboard
  in every mode, including ArrowUp/ArrowDown from no active option).
- [x] `select` still builds and its specs stay green (it may still use the old panel until 05).
- [x] Commit `feat(listbox): popup listbox entry point`.

## Comments

**2026-10-11 - done.** Commit `feat(listbox): popup listbox entry point`.

- `listbox/listbox.ts`: `UiListbox` (exported as `ɵUiListbox`). The field lists
  `provideUiListbox()` in `providers` and calls `injectListbox({ mode, id, isSelected, select,
  ... })` in a field initializer. Optional config: `contentOptions`, `leadingOptions`, `items`,
  `filterText`, `filterOptions`, `compareWith`, `displayWith`, `virtualThreshold`, `loading`,
  `locked` (disabled or readonly), `showEmpty`, `activateOnOpen`, `openAt`, `isBlocked`,
  `alwaysShown`, `isIndeterminate`, `opened`, `closed`. API: `isOpen`, `shown`, `activeId`,
  `panelId`, `options`, `selectedOptions`, `noResults`, `open({ activate })`, `close()`,
  `handleKeydown(event): boolean` (false = the field may act: Enter commits typed text, Escape
  clears it), `selectActive()`, `activateFirst/Last/Value()`, `clearActive()`, `labelFor()`,
  `matches()`.
- Queries: the field passes its `contentChildren(UiOption)` (and `viewChildren` of "select all")
  to the controller. Options do not register through the DI token, because content options exist
  while the panel is closed and are not in the document then, so DOM order (needed for the key
  manager) is not defined; `@for` also reorders them. The rendered item options and the viewport
  are queried by the new `ui-listbox` component (`listbox-panel.ts`), which connects to the
  controller while it is rendered.
- One DI token: `UiListboxHost` (abstract class), which the controller extends. Until 05/06 the
  old fields provide `UiOptionParent` as that token (`provideUiOptionParent()` in `select`).
- `ui-listbox` renders the leading options (`uiListboxLeading`), the content options or the
  `items` (virtual past the threshold), and the loading / "no options" rows
  (`.ui-listbox__loading`, `.ui-listbox__empty`). Its styles are its own (`:host` = `.ui-listbox`),
  so the fields will drop the `panel.styles` mixin.
- Decisions the spec did not settle (conservative choices): `isIndeterminate` is an extra optional
  callback (multi-select's "select all"); `showEmpty` replaces autocomplete's `panelShown`
  (`shown()`); `openAt` gives time-input its nearest slot; `select/_panel.scss` stays until 05,
  because the fields still render `.ui-select__panel`; the CHANGELOG entry for the class rename
  belongs to 05, when the rendered class changes. Unified behavior: ArrowUp in an open list
  without an active option goes to the last option in every mode (time-input did nothing).
- Tests: `listbox.spec.ts`, 21 tests; full suite 959 green, coverage thresholds met, lint and
  format clean, `pnpm build` builds the new entry point.

## Русский перевод

# 04: entry point listbox с контроллером listbox

**Статус:** сделано
**Зависит от:** 02

Новый internal secondary entry point `@vplans/ui-kit/listbox` (README → «Adding a component»).

- `UiOption`, `UiOptionGroup` и опции из items переезжают туда из `select/option.ts` и
  `select/option-items.ts`. `select` реэкспортирует `UiOption` и `UiOptionGroup`.
- Контроллер listbox, который поле создаёт в своём injection context, владеет: опциями из контента
  и из `items`, фильтром, virtual scroll, active option, `ActiveDescendantKeyManager`, прокруткой к
  active option, id для `aria-activedescendant` / `aria-controls` и единственным обработчиком
  клавиатуры. Поле передаёт режим (trigger-кнопка / searchable / free text) и колбэки (выбрано ли,
  выбрать, активировать при открытии, заблокировано, всегда видно).
- Опции находят контроллер через один DI-токен вместо `UiOptionParent` с owner из 7 методов.
- Стили панели из `select/_panel.scss` переезжают туда; `.ui-select__panel` становится `.ui-listbox`.
- Listbox рендерится внутри `uiDropdownPanel`.

- [x] Entry point, контроллер и стили; spec контроллера через его интерфейс (клавиатура во всех
  режимах, включая ArrowUp/ArrowDown без active option).
- [x] `select` собирается, его spec зелёные (до 05 он может ещё использовать старую панель).
- [x] Коммит `feat(listbox): popup listbox entry point`.

## Комментарии

**2026-10-11 - сделано.** Коммит `feat(listbox): popup listbox entry point`.

- `listbox/listbox.ts`: `UiListbox` (экспорт `ɵUiListbox`). Поле указывает `provideUiListbox()` в
  `providers` и вызывает `injectListbox({ mode, id, isSelected, select, ... })` в инициализаторе
  поля класса. Необязательная конфигурация: `contentOptions`, `leadingOptions`, `items`,
  `filterText`, `filterOptions`, `compareWith`, `displayWith`, `virtualThreshold`, `loading`,
  `locked` (disabled или readonly), `showEmpty`, `activateOnOpen`, `openAt`, `isBlocked`,
  `alwaysShown`, `isIndeterminate`, `opened`, `closed`. API: `isOpen`, `shown`, `activeId`,
  `panelId`, `options`, `selectedOptions`, `noResults`, `open({ activate })`, `close()`,
  `handleKeydown(event): boolean` (false — поле может действовать само: Enter фиксирует введённый
  текст, Escape его очищает), `selectActive()`, `activateFirst/Last/Value()`, `clearActive()`,
  `labelFor()`, `matches()`.
- Запросы: поле передаёт контроллеру свой `contentChildren(UiOption)` (и `viewChildren` для «select
  all»). Опции не регистрируются через DI-токен: опции из контента существуют, пока панель закрыта,
  и тогда их нет в документе, так что порядок в DOM (нужный key manager) не определён; к тому же
  `@for` их переставляет. Отрисованные опции из items и viewport запрашивает новый компонент
  `ui-listbox` (`listbox-panel.ts`), который подключается к контроллеру, пока отрисован.
- Один DI-токен: `UiListboxHost` (абстрактный класс), который расширяет контроллер. До 05/06
  старые поля предоставляют `UiOptionParent` под этим токеном (`provideUiOptionParent()` в
  `select`).
- `ui-listbox` рендерит ведущие опции (`uiListboxLeading`), опции из контента или `items`
  (виртуально после порога) и строки загрузки / «нет опций» (`.ui-listbox__loading`,
  `.ui-listbox__empty`). Стили у него свои (`:host` = `.ui-listbox`), так что поля уберут миксин
  `panel.styles`.
- Решения, которые spec не закрывал (консервативный выбор): `isIndeterminate` — дополнительный
  необязательный колбэк («select all» в multi-select); `showEmpty` заменяет `panelShown`
  autocomplete (`shown()`); `openAt` даёт time-input ближайший слот; `select/_panel.scss` остаётся
  до 05, потому что поля ещё рендерят `.ui-select__panel`; запись в CHANGELOG о переименовании
  класса — в 05, когда меняется отрисованный класс. Единое поведение: ArrowUp в открытом списке
  без active option ведёт на последнюю опцию во всех режимах (time-input ничего не делал).
- Тесты: `listbox.spec.ts`, 21 тест; весь набор 959 зелёных, пороги покрытия выполнены, lint и
  format чистые, `pnpm build` собирает новый entry point.
