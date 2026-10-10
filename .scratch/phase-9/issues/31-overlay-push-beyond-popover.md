# 31: The kit's own push for popover only, or for tooltip too?

**Spec:** [../spec.md](../spec.md) → 9.1, user story 8; ticket [28](28-popover-push-viewport-margin.md)

**Status:** done

**Facts:** ticket 28 turned CDK push off for the popover and pushes it in the kit: `UiPopoverPositionStrategy` wraps the strategy CDK builds and corrects the pane after each `apply()`, with the geometry in `core/overlay.ts` (`ɵpushOnScreen`). It keeps the 8 px edge gap in LTR, RTL and an RTL iframe, and in RTL a popover wider than the viewport keeps its start edge visible. Two points:

- The "does the position fit" test copies the check of CDK 20.2 so unpushed popovers open exactly where they did. A CDK update can change that check, and the copy would drift; the popover unit tests and the `AtTheEdge` / `AtTheEndEdge` play stories would catch a changed position.
- Tooltip still uses CDK push, so a pushed tooltip can get an uneven edge gap and, in an RTL iframe, sit under the left scrollbar (measured for the popover before the fix; not measured for the tooltip). Tooltips are small, so it rarely shows.

**Options:**

1. Keep it to the popover; re-check the copied fit test on every CDK update (recommended).
2. Apply the same wrapper to the tooltip too, with its own play stories at the edges.

## Answer

Popover only; re-check the copied fit test on every CDK update. Recorded in docs/DECISIONS.md (2026-10-10).

## Русский перевод

# 31: Собственный сдвиг кита только для popover или и для tooltip?

**Спека:** [../spec.md](../spec.md) → 9.1, пользовательская история 8; тикет [28](28-popover-push-viewport-margin.md)

**Статус:** сделано

**Факты:** тикет 28 отключил сдвиг CDK у popover и сдвигает его средствами кита: `UiPopoverPositionStrategy` оборачивает стратегию, которую строит CDK, и поправляет pane после каждого `apply()`; геометрия лежит в `core/overlay.ts` (`ɵpushOnScreen`). Отступ 8 px от края держится в LTR, RTL и RTL-iframe, а в RTL popover шире viewport оставляет видимым начальный край. Два момента:

- Проверка «помещается ли позиция» повторяет проверку CDK 20.2, чтобы несдвинутые popover открывались точно там же, где раньше. Обновление CDK может изменить эту проверку, и копия разойдётся с ней; изменённую позицию поймают unit-тесты popover и play stories `AtTheEdge` / `AtTheEndEdge`.
- Tooltip по-прежнему сдвигается средствами CDK, поэтому у сдвинутого tooltip отступ от края может быть неровным, а в RTL-iframe он может заходить под левую полосу прокрутки (измерено у popover до исправления; у tooltip не измерялось). Tooltip маленький, поэтому это редко заметно.

**Варианты:**

1. Оставить только у popover; перепроверять скопированную проверку при каждом обновлении CDK (рекомендую).
2. Применить ту же обёртку и к tooltip, с его собственными play stories у краёв.

## Ответ

Только popover; перепроверять скопированную проверку при каждом обновлении CDK. Записано в docs/DECISIONS.md (2026-10-10).
