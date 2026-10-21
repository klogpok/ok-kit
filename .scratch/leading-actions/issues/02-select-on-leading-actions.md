# 02: select and multi-select on the leading actions

**Status:** ready-for-agent
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

- [ ] Select, multi-select, harness and `form-field/forms-interop.spec.ts` specs green.
- [ ] The decisions in `DECISIONS.md` about `creatable`, `selectAll` and `maxSelections` hold.
- [ ] `test-storybook` for select and multi-select clean; visual baselines unchanged.
- [ ] Commits `refactor(select): ...`.

## Comments

## Русский перевод

# 02: select и multi-select на leading actions

**Статус:** ready-for-agent
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

- [ ] Spec select, multi-select, harness'ов и `form-field/forms-interop.spec.ts` зелёные.
- [ ] Решения из `DECISIONS.md` о `creatable`, `selectAll` и `maxSelections` сохраняются.
- [ ] `test-storybook` для select и multi-select чистый; визуальные снимки не меняются.
- [ ] Коммиты `refactor(select): ...`.
