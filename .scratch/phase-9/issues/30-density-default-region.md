# 30: No way back to default density inside a compact region

**Spec:** [../spec.md](../spec.md) → 9.2, "Density"

**Status:** needs-info

**Facts:** the spec defines one value, `data-density="compact"`. A region nested inside a compact one cannot return to the default density: there is no `data-density="default"`. Only a table can, with its explicit `density="default"` input (ticket 10). The README says so. With compact on the root element, this means a single screen cannot keep one default-density form.

**Options:**

1. Keep only `compact`, as the spec says (recommended until a screen needs it).
2. Add `data-density="default"`: the generator emits a block that restores the default control tokens and the table padding, and nested regions work in both directions.

## Русский перевод

# 30: Внутри компактной области нельзя вернуться к обычной плотности

**Спека:** [../spec.md](../spec.md) → 9.2, «Density»

**Статус:** needs-info

**Факты:** спека задаёт одно значение, `data-density="compact"`. Вложенная в компактную область не может вернуться к обычной плотности: значения `data-density="default"` нет. Это может только таблица — явным входом `density="default"` (тикет 10). README об этом говорит. Если compact стоит на корневом элементе, на отдельном экране нельзя оставить одну форму с обычной плотностью.

**Варианты:**

1. Оставить только `compact`, как в спеке (рекомендую, пока это не понадобится какому-то экрану).
2. Добавить `data-density="default"`: генератор выпускает блок, который возвращает обычные токены контролов и отступы таблицы, и вложенные области работают в обе стороны.
