# 04: listbox entry point with the listbox controller

**Status:** ready-for-agent
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

- [ ] Entry point, controller and styles; spec of the controller through its interface (keyboard
  in every mode, including ArrowUp/ArrowDown from no active option).
- [ ] `select` still builds and its specs stay green (it may still use the old panel until 05).
- [ ] Commit `feat(listbox): popup listbox entry point`.

## Русский перевод

# 04: entry point listbox с контроллером listbox

**Статус:** ready-for-agent
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

- [ ] Entry point, контроллер и стили; spec контроллера через его интерфейс (клавиатура во всех
  режимах, включая ArrowUp/ArrowDown без active option).
- [ ] `select` собирается, его spec зелёные (до 05 он может ещё использовать старую панель).
- [ ] Коммит `feat(listbox): popup listbox entry point`.
