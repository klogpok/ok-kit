# 37: Table harness cannot select a range with Shift

**Spec:** [../spec.md](../spec.md) → 9.4, user story 46

**Status:** needs-info

**Facts:** the table selects a range of rows when the user Shift-clicks a row checkbox. `td[ui-table-select-row]` reads Shift from `pointerdown`, but the CDK harness click sends its own `pointerdown` without modifiers, so the harness cannot select a range. Single rows and select all work. The limitation is in the README and the JSDoc. The story asks for "selects rows", which does not require ranges.

**Options:**

1. Leave it documented (recommended until a screen test needs ranges).
2. Change the component to read Shift from the `click` event too, and add `UiTableRowHarness.select({ shift: true })`.

## Русский перевод

# 37: Harness таблицы не умеет выделять диапазон с Shift

**Спека:** [../spec.md](../spec.md) → 9.4, пользовательская история 46

**Статус:** needs-info

**Факты:** таблица выделяет диапазон строк, когда пользователь кликает по чекбоксу строки с Shift. `td[ui-table-select-row]` читает Shift из `pointerdown`, но клик CDK-harness отправляет свой `pointerdown` без модификаторов, поэтому harness не может выделить диапазон. Отдельные строки и «выбрать всё» работают. Ограничение описано в README и JSDoc. История просит «выбирать строки», диапазоны она не требует.

**Варианты:**

1. Оставить с описанием (рекомендую, пока тесту экрана не понадобятся диапазоны).
2. Изменить компонент, чтобы он читал Shift и из события `click`, и добавить `UiTableRowHarness.select({ shift: true })`.
