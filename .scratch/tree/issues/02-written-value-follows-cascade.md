# A value written to the control is brought in line with the cascade

Status: needs-info

## Question

The spec only asks the tree to add keys silently "when children load under a checked branch".
Should the same rule also apply to a value the app **writes** to the control?

## Facts

- The implementation runs one reconcile step (`reconcileChecks` in
  `projects/ui-kit/tree/tree-checks.ts`) whenever the value, the data or the loaded children
  change. For a written value this means:
  - a branch key checks every enabled node under it: writing `['north']` gives
    `['north', 'haifa', 'akko']`;
  - a branch whose children are all in the value joins it: `['haifa', 'akko']` gives
    `['haifa', 'akko', 'north']`;
  - a branch key whose loaded children are not all checked is dropped.
- These writes do not mark the control dirty (`writeDerivedValue`), but `valueChanges` fires.
- Keys of unknown nodes are kept, as the spec asks.
- ADR 0001 states the invariant "the value is every checked key"; this step is what keeps it
  true for values from outside.

## Options

1. **Keep it (recommended):** one rule for every source of the value; a URL or server prefill
   with branch keys works as expected.
2. Apply it only when children load; a written value stays exactly as written, even if it breaks
   the invariant.

## Русский перевод

# Значение, записанное в контрол, приводится к правилам каскада

Статус: needs-info

## Вопрос

Спека просит дерево тихо добавлять ключи только «когда под отмеченной веткой загружаются дети».
Должно ли то же правило действовать и для значения, которое приложение **записывает** в контрол?

## Факты

- Реализация запускает один шаг согласования (`reconcileChecks` в
  `projects/ui-kit/tree/tree-checks.ts`) при каждом изменении значения, данных или загруженных
  детей. Для записанного значения это означает:
  - ключ ветки отмечает все включённые узлы под ней: запись `['north']` даёт
    `['north', 'haifa', 'akko']`;
  - ветка, все дети которой есть в значении, добавляется в него: `['haifa', 'akko']` даёт
    `['haifa', 'akko', 'north']`;
  - ключ ветки, у которой отмечены не все загруженные дети, убирается.
- Такие записи не делают контрол dirty (`writeDerivedValue`), но `valueChanges` срабатывает.
- Ключи неизвестных узлов сохраняются, как и просит спека.
- ADR 0001 формулирует инвариант «значение — все отмеченные ключи»; этот шаг держит его и для
  значений извне.

## Варианты

1. **Оставить (рекомендую):** одно правило для любого источника значения; предзаполнение из URL
   или с сервера с ключами веток работает как ожидается.
2. Применять только при загрузке детей; записанное значение остаётся как есть, даже если нарушает
   инвариант.
