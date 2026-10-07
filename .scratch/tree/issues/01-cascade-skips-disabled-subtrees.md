# Cascade skips disabled branches together with their subtrees

Status: done

## Question

When a click on a branch checks or unchecks everything under it, what happens to the enabled
nodes that sit under a **disabled branch**?

## Facts

- The spec says: "Clicking an unchecked or partially checked branch checks every enabled
  descendant" and "A disabled unchecked descendant keeps the branch partially checked".
- It does not say what happens below a disabled branch. The implementation
  (`projects/ui-kit/tree/tree-checks.ts`, `enabledSubtree`) skips the disabled node **and
  everything under it**, so its enabled children keep their state too.
- Example: "North" → "Haifa" (disabled) → "Carmel", "Hadar". A click on "North" checks "Akko"
  but leaves "Carmel" and "Hadar" alone; "North" stays partially checked.
- A disabled leaf is not affected by this choice, only a disabled branch.

## Options

1. **Keep it (recommended):** a disabled branch locks its whole subtree, as a locked section.
2. Skip only the disabled node itself; its enabled descendants follow the cascade.

## Answer

Keep it: a disabled branch locks its whole subtree. Recorded in docs/DECISIONS.md (2026-10-07).

## Русский перевод

# Каскад пропускает выключенные ветки вместе с их поддеревьями

Статус: сделано

## Вопрос

Клик по ветке отмечает или снимает всё, что под ней. Что при этом происходит с включёнными
узлами, которые лежат под **выключенной веткой**?

## Факты

- В спеке сказано: «Клик по неотмеченной или partially checked ветке отмечает всех доступных
  потомков» и «Отключённый неотмеченный потомок оставляет ветку partially checked».
- Что происходит ниже выключенной ветки, спека не говорит. Реализация
  (`projects/ui-kit/tree/tree-checks.ts`, `enabledSubtree`) пропускает выключенный узел **вместе
  со всем, что под ним**, поэтому его включённые дети тоже сохраняют своё состояние.
- Пример: «Север» → «Хайфа» (выключена) → «Кармель», «Адар». Клик по «Северу» отмечает «Акко»,
  но не трогает «Кармель» и «Адар»; «Север» остаётся partially checked.
- На выключенный лист этот выбор не влияет, только на выключенную ветку.

## Варианты

1. **Оставить (рекомендую):** выключенная ветка блокирует всё своё поддерево, как закрытый раздел.
2. Пропускать только сам выключенный узел; его включённые потомки следуют каскаду.

## Ответ

Оставить: выключенная ветка блокирует всё своё поддерево. Записано в docs/DECISIONS.md (2026-10-07).
