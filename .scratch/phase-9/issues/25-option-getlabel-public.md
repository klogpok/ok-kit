# 25: Keep `UiOption.getLabel` public?

**Spec:** [../spec.md](../spec.md) → 9.1, "`UiOption` internals"

**Status:** needs-info

**Facts:** the spec asks for `id`, `getLabel` and the `disabled` getter to get the `ɵ` prefix. `id` and `disabled` became `ɵid` and `ɵdisabled` (ticket 05). `getLabel` kept its name: the CDK `ListKeyManager` typeahead calls `getLabel()` on every item by that exact name, and select and multi-select use typeahead. Renaming it throws on the first typed letter. The exception is explained in a comment on the method and in the CHANGELOG.

**Options:**

1. Accept the exception: `getLabel` stays public, documented as required by CDK (recommended; no code change).
2. Refactor: the key manager works on wrapper entries that implement `getLabel`, and `UiOption` renames it to `ɵgetLabel`. A larger change in select, multi-select, autocomplete and time input.

## Русский перевод

# 25: Оставить `UiOption.getLabel` публичным?

**Спека:** [../spec.md](../spec.md) → 9.1, «Внутренности `UiOption`»

**Статус:** needs-info

**Факты:** спека требует префикс `ɵ` у `id`, `getLabel` и геттера `disabled`. `id` и `disabled` стали `ɵid` и `ɵdisabled` (тикет 05). `getLabel` сохранил имя: typeahead в CDK `ListKeyManager` вызывает `getLabel()` у каждого элемента именно под этим именем, а select и multi-select используют typeahead. После переименования он падает на первой же набранной букве. Исключение объяснено в комментарии к методу и в CHANGELOG.

**Варианты:**

1. Принять исключение: `getLabel` остаётся публичным, задокументирован как требование CDK (рекомендую; код не меняется).
2. Рефакторинг: key manager работает с обёртками, у которых есть `getLabel`, а в `UiOption` метод переименовывается в `ɵgetLabel`. Изменение крупнее: select, multi-select, autocomplete и time input.
