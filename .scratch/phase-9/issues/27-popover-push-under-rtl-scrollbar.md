# 27: A pushed popover can sit under the left scrollbar in an RTL iframe

**Spec:** [../spec.md](../spec.md) → 9.1, user story 8

**Status:** done

**Facts:** found during ticket 03, and it predates it. When CDK has to push a popover back on screen, it ignores `viewport.left`: in the Storybook manager (an RTL document inside an iframe, where Chrome and Edge draw the scrollbar on the left) the popover overlaps the scrollbar by 7 of its 15 px. In LTR the same CDK code leaves a 0 px edge gap instead of 8 px. In a top-level RTL page the scrollbar is on the right and everything fits, so the VPlans app (not in an iframe) is not affected. The cause is CDK's `_pushOverlayOnScreen`, not the width change. Popover width itself now fits the container (303 px instead of 319–320 px at 340 px).

**Options:**

1. Accept: only an RTL iframe is affected; note it in `.claude/rules/overlays.md` (recommended).
2. File a fix ticket: correct the push in the kit (e.g. a viewport margin on the popover's position strategy) and add a play story at the edge.

## Answer

Fix it in the kit: ticket [28](28-popover-push-viewport-margin.md). Recorded in docs/DECISIONS.md (2026-10-10).

## Русский перевод

# 27: Сдвинутый popover может заходить под левую полосу прокрутки в RTL-iframe

**Спека:** [../spec.md](../spec.md) → 9.1, пользовательская история 8

**Статус:** сделано

**Факты:** найдено при работе над тикетом 03, но баг был и раньше. Когда CDK приходится сдвигать popover обратно на экран, он не учитывает `viewport.left`. В менеджере Storybook (RTL-документ внутри iframe, где Chrome и Edge рисуют полосу прокрутки слева) popover заходит под полосу на 7 px из 15. В LTR тот же код CDK оставляет отступ от края 0 px вместо 8. На RTL-странице верхнего уровня полоса справа, и всё помещается, поэтому приложение VPlans (оно не в iframe) это не затрагивает. Причина в `_pushOverlayOnScreen` у CDK, а не в изменении ширины. Сама ширина popover теперь укладывается в контейнер (303 px вместо 319–320 px при 340 px).

**Варианты:**

1. Принять: затронут только RTL-iframe; записать это в `.claude/rules/overlays.md` (рекомендую).
2. Завести тикет на исправление: поправить сдвиг в ките (например, отступ от края viewport в стратегии позиционирования popover) и добавить play story у края.

## Ответ

Исправить в ките: тикет [28](28-popover-push-viewport-margin.md). Записано в docs/DECISIONS.md (2026-10-10).
