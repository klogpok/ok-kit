# 10: select and multi-select keep a shared base class

**Spec:** [../spec.md](../spec.md) → decision 6

**Status:** needs-info

**Facts:** decision 6 says "Fields stay on `UiFormControlBase`; the three-level hierarchy goes
away". Ticket 05 removed the option panel level (`UiOptionPanel`), but `ui-select` and
`ui-multi-select` still share an abstract directive, `UiSelectBase` (`select/select-base.ts`, 238
lines), between them and `UiFormControlBase`:

- before: `UiFormControlBase` → `UiOptionPanel` → `UiSelectBase` → `UiSelect` / `UiMultiSelect`;
- now: `UiFormControlBase` → `UiSelectBase` → `UiSelect` / `UiMultiSelect`.

`UiSelectBase` holds what both fields render through the one template `select.html`: the trigger,
the chips, the clear button, the search text and the common inputs (`size`, `id`, `aria-label`,
`placeholder`, `name`, `searchable`, `clearable`, `loading`, `filterOptions`, `compareWith`,
`displayWith`, `items`, `virtualThreshold`). It has no
keyboard or overlay code any more: each field creates its own listbox with
`injectListbox({ ...this.listboxConfig(), isSelected, select })`. `ui-autocomplete` and
`ui-time-input` extend `UiFormControlBase` directly. Not exported; no consumer sees it.

**Options:**

1. Keep the two levels (recommended): one shared template needs one set of inputs and signals;
   splitting it would copy about 150 lines into both fields or move them into a second injectable
   helper with the same content.
2. Remove `UiSelectBase`: each field extends `UiFormControlBase` and the shared parts move into a
   helper created with an `inject…()` function, like the listbox.

## Comments

## Русский перевод

# 10: select и multi-select сохраняют общий базовый класс

**Спека:** [../spec.md](../spec.md) → решение 6

**Статус:** needs-info

**Факты:** решение 6 гласит: «Поля остаются на `UiFormControlBase`; трёхуровневая иерархия
уходит». Тикет 05 убрал уровень панели опций (`UiOptionPanel`), но `ui-select` и
`ui-multi-select` по-прежнему делят абстрактную директиву `UiSelectBase` (`select/select-base.ts`,
238 строк) между собой и `UiFormControlBase`:

- было: `UiFormControlBase` → `UiOptionPanel` → `UiSelectBase` → `UiSelect` / `UiMultiSelect`;
- стало: `UiFormControlBase` → `UiSelectBase` → `UiSelect` / `UiMultiSelect`.

В `UiSelectBase` лежит то, что оба поля рендерят через один шаблон `select.html`: триггер, чипы,
кнопка очистки, текст поиска и общие inputs (`size`, `id`, `aria-label`, `placeholder`, `name`,
`searchable`, `clearable`, `loading`, `filterOptions`, `compareWith`, `displayWith`, `items`,
`virtualThreshold`). Кода клавиатуры и оверлея в нём больше
нет: каждое поле создаёт свой listbox через
`injectListbox({ ...this.listboxConfig(), isSelected, select })`. `ui-autocomplete` и
`ui-time-input` наследуют `UiFormControlBase` напрямую. Класс не экспортируется, потребитель его не
видит.

**Варианты:**

1. Оставить два уровня (рекомендую): общему шаблону нужен один набор inputs и сигналов; разделение
   скопирует около 150 строк в оба поля или перенесёт их во второй injectable-помощник с тем же
   содержимым.
2. Убрать `UiSelectBase`: каждое поле наследует `UiFormControlBase`, а общие части переходят в
   помощник, создаваемый функцией `inject…()`, как listbox.

## Комментарии
