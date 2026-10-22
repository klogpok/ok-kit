# 02: select and multi-select on the leading actions

**Status:** done
**Blocked by:** 01

Spec: `../spec.md`, decisions 2–7 and 9.

- `UiSelectBase` passes the "create" part (`creatable` and `searchable`, `createBlocked()`, the
  selected values, `addCreated`) and drops `createText`, `leadingCount`, `createOption`,
  `leadingOptions`, `isLeading`, `isCreate`, the `CREATE` symbol, the activation effect and the
  Enter case in `onKeydown`.
- `UiMultiSelect` passes the "select all" part (`selectAll()` and `maxSelections() === null`) and
  a `selectAll(values, on)` that builds the new array; `selectable`, `allSelected`,
  `isIndeterminate`, `selectAllOption`, `SELECT_ALL` and the marker checks in `isSelected` /
  `toggleValue` go away. `isBlocked` keeps only the `maxSelections` rule.
- `select.html` loses the leading block; `select.scss` loses the leading rules.
- The internal listbox harness gets methods for the two actions; the select specs and stories move
  from `.ui-select__create` / `.ui-select__all` / `.ui-select__leading` to them or to the new
  classes.
- Tests: the rule tests in `select-creatable.spec.ts`, `multi-select.spec.ts` and
  `select-items.spec.ts` that ticket 01 now covers in `listbox.spec.ts` are deleted; each spec keeps
  what the value means and one end-to-end test per action.

- [x] Select, multi-select, harness and `form-field/forms-interop.spec.ts` specs green.
- [x] The decisions in `DECISIONS.md` about `creatable`, `selectAll` and `maxSelections` hold.
- [x] `test-storybook` for select and multi-select clean; visual baselines unchanged.
- [x] Commits `refactor(select): ...`.

## Comments

- 2026-10-22, agent: the committed baselines differ from today's Edge 155 screenshots in every
  story (text anti-aliasing; `forms-input` and `actions-button` too), so "unchanged" was checked
  against screenshots of the `spec/leading-actions` build taken in the same environment: select
  and multi-select show no visual changes. The committed baselines were left alone.
- The `@for (...; track action)` of the leading actions in `listbox.ts` logs the dev warning
  NG0956 when one action replaces the other (e.g. typing turns "Select all" into "Add «…»").
  Harmless; left to ticket 03 or a follow-up.
- Kept in the select specs beyond the end-to-end tests: "does not offer the label of the value
  again" (`ui-select` passes its value as the selected values) and "select all" over `items`
  (`select-items.spec.ts`), which `listbox.spec.ts` covers only with projected options.

## Русский перевод

# 02: select и multi-select на leading actions

**Статус:** сделано
**Зависит от:** 01

Спека: `../spec.md`, решения 2–7 и 9.

- `UiSelectBase` передаёт часть «создать» (`creatable` и `searchable`, `createBlocked()`, выбранные
  значения, `addCreated`) и удаляет `createText`, `leadingCount`, `createOption`, `leadingOptions`,
  `isLeading`, `isCreate`, символ `CREATE`, effect активации и случай Enter в `onKeydown`.
- `UiMultiSelect` передаёт часть «выбрать все» (`selectAll()` и `maxSelections() === null`) и
  `selectAll(values, on)`, который собирает новый массив; `selectable`, `allSelected`,
  `isIndeterminate`, `selectAllOption`, `SELECT_ALL` и проверки маркеров в `isSelected` /
  `toggleValue` удаляются. В `isBlocked` остаётся только правило `maxSelections`.
- `select.html` теряет блок ведущих строк; `select.scss` — их правила.
- Внутренний harness listbox получает методы для двух действий; spec и истории select переходят с
  `.ui-select__create` / `.ui-select__all` / `.ui-select__leading` на них или на новые классы.
- Тесты: тесты правил в `select-creatable.spec.ts`, `multi-select.spec.ts` и `select-items.spec.ts`,
  которые тикет 01 теперь покрывает в `listbox.spec.ts`, удаляются; каждый spec сохраняет смысл
  значения и один сквозной тест на действие.

- [x] Spec select, multi-select, harness'ов и `form-field/forms-interop.spec.ts` зелёные.
- [x] Решения из `DECISIONS.md` о `creatable`, `selectAll` и `maxSelections` сохраняются.
- [x] `test-storybook` для select и multi-select чистый; визуальные снимки не меняются.
- [x] Коммиты `refactor(select): ...`.

## Комментарии

- 2026-10-22, агент: закоммиченные снимки отличаются от сегодняшних скриншотов Edge 155 во всех
  историях (сглаживание текста; `forms-input` и `actions-button` тоже), поэтому «не меняются»
  проверено по скриншотам сборки `spec/leading-actions`, снятым в том же окружении: у select и
  multi-select визуальных изменений нет. Закоммиченные снимки не трогались.
- `@for (...; track action)` ведущих действий в `listbox.ts` пишет dev-предупреждение NG0956,
  когда одно действие заменяет другое (например, ввод превращает «Выбрать все» в «Добавить «…»»).
  Безвредно; оставлено тикету 03 или отдельной задаче.
- В spec select кроме сквозных тестов оставлены: «не предлагает подпись значения повторно»
  (`ui-select` передаёт своё значение как выбранные значения) и «выбрать все» над `items`
  (`select-items.spec.ts`), которое `listbox.spec.ts` проверяет только на проецируемых опциях.
