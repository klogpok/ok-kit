# Enter and Space expand a branch in a tree without selection

Status: needs-info

## Question

In `selection="none"`, should Enter and Space expand and collapse a branch?

## Facts

- The spec says: "With `selection="none"`, clicking a branch expands it" and, for the other modes,
  "only the chevron and the arrow keys expand".
- The implementation treats Enter and Space like a click in every mode (CDK's `activation`
  event). In `none` mode they therefore toggle the branch. In `single` and `multiple` they select
  or check, as the spec asks.
- The APG tree view lets Enter perform the node's default action, which for a tree without
  selection is expanding.

## Options

1. **Keep it (recommended):** the keyboard matches the mouse; in `none` the click is the expand.
2. Enter and Space do nothing in `none`; only the arrows expand.

## Русский перевод

# Enter и Space раскрывают ветку в дереве без выбора

Статус: needs-info

## Вопрос

Должны ли Enter и Space раскрывать и сворачивать ветку при `selection="none"`?

## Факты

- В спеке сказано: «При `selection="none"` клик по ветке её раскрывает», а для остальных режимов —
  «раскрывают только шеврон и стрелки».
- Реализация во всех режимах обрабатывает Enter и Space как клик (событие `activation` у CDK).
  Поэтому в режиме `none` они переключают ветку. В `single` и `multiple` они выбирают или
  отмечают узел, как и просит спека.
- APG для tree view разрешает Enter выполнять действие узла по умолчанию; для дерева без выбора
  это раскрытие.

## Варианты

1. **Оставить (рекомендую):** клавиатура ведёт себя как мышь; в `none` клик и есть раскрытие.
2. В `none` Enter и Space ничего не делают; раскрывают только стрелки.
