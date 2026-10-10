# 28: A pushed popover stays clear of the scrollbar

**Spec:** [../spec.md](../spec.md) → 9.1, user story 8; answer to ticket [27](27-popover-push-under-rtl-scrollbar.md)

**What to build:** when a popover near the edge of the viewport has to be pushed back on screen, it keeps the same edge gap as an unpushed popover and never sits under the scrollbar: in LTR, in a top-level RTL page, and in an RTL document inside an iframe, where Chrome and Edge draw the scrollbar on the left (the Storybook manager). Today CDK's push ignores `viewport.left`, so the popover overlaps a left scrollbar by 7 of 15 px, and in LTR the gap is 0 px instead of 8. Fix it in the kit's popover positioning (for example a viewport margin on its position strategy), without changing where unpushed popovers open.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A pushed popover keeps its edge gap and stays clear of the scrollbar in LTR, RTL and an RTL iframe, checked in the browser with a visible scrollbar
- [x] A play story opens a popover at the edge; it has baselines in three modes and passes axe
- [x] Existing popover baselines do not change, and the popover spec passes
- [x] The CHANGELOG lists the fix

## Русский перевод

# 28: Сдвинутый popover не заходит под полосу прокрутки

**Спека:** [../spec.md](../spec.md) → 9.1, пользовательская история 8; ответ на тикет [27](27-popover-push-under-rtl-scrollbar.md)

**Что сделать:** когда popover у края viewport приходится сдвигать обратно на экран, он сохраняет тот же отступ от края, что и несдвинутый, и никогда не заходит под полосу прокрутки: в LTR, на RTL-странице верхнего уровня и в RTL-документе внутри iframe, где Chrome и Edge рисуют полосу слева (менеджер Storybook). Сейчас сдвиг CDK не учитывает `viewport.left`, поэтому popover заходит под левую полосу на 7 px из 15, а в LTR отступ 0 px вместо 8. Исправить в позиционировании popover в ките (например, отступом от края viewport в стратегии позиционирования), не меняя того, где открываются несдвинутые popover.

**Заблокировано:** нет (можно начинать сразу)

**Статус:** сделано

- [x] Сдвинутый popover сохраняет отступ от края и не заходит под полосу прокрутки в LTR, RTL и RTL-iframe; проверено в браузере с видимой полосой
- [x] Play story открывает popover у края; у неё есть снимки в трёх режимах, и она проходит axe
- [x] Существующие снимки popover не меняются, spec popover проходит
- [x] CHANGELOG описывает исправление
