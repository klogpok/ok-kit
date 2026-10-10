# 03: Overlays fit the viewport without the scrollbar

**Spec:** [../spec.md](../spec.md)

**What to build:** on a page with a vertical scrollbar, a wide dialog, a drawer, a toast and a popover never slide under the scrollbar, in LTR and in RTL, where the scrollbar is on the left. Their maximum width is measured against the overlay container instead of `100vw`. Dialog height keeps `100dvh`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] No `100vw` remains in the dialog, drawer, toast and popover styles
- [ ] Checked in the browser with a visible scrollbar, in LTR and RTL, for a full-width dialog, an end drawer, a toast and a popover at the edge
- [ ] Visual baselines do not change

## Русский перевод

# 03: Оверлеи помещаются во viewport без полосы прокрутки

**Спека:** [../spec.md](../spec.md)

**Что сделать:** на странице с вертикальной полосой прокрутки широкий диалог, drawer, toast и popover никогда не заезжают под неё — ни в LTR, ни в RTL, где полоса слева. Их максимальная ширина считается от контейнера оверлея вместо `100vw`. Высота диалога остаётся `100dvh`.

**Заблокировано:** Нет (можно начинать сразу)

**Статус:** ready-for-agent

- [ ] В стилях dialog, drawer, toast и popover не осталось `100vw`
- [ ] Проверено в браузере с видимой полосой прокрутки, в LTR и RTL: диалог на всю ширину, drawer с конца, toast и popover у края
- [ ] Визуальные снимки не меняются
