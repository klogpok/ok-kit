# 33: Playground sections share one card style; JSON reads left to right

**Spec:** [../spec.md](../spec.md) → 9.3; answer to ticket [32](32-playground-phase-eight-sections.md)

**What to build:** every section of the playground, including those inside the phase components (`<app-phase-eight>` and the others), has the same card frame, and every `<pre>` that shows a JSON value reads left to right in RTL. Today the `section` style lives in the `App` component styles and does not reach the phase components, and the JSON `<pre>` blocks have no `dir="ltr"`. Playground only; the kit does not change.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Every playground section has the card frame, checked in the browser in light, dark and RTL
- [ ] Every JSON `<pre>` has `dir="ltr"` and reads in order in RTL
- [ ] Sections that already had the frame look the same; the playground builds within its budgets and its tests pass

## Русский перевод

# 33: Секции playground с общим стилем карточки; JSON читается слева направо

**Спека:** [../spec.md](../spec.md) → 9.3; ответ на тикет [32](32-playground-phase-eight-sections.md)

**Что сделать:** каждая секция playground, в том числе внутри компонентов фаз (`<app-phase-eight>` и других), получает одинаковую рамку карточки, а каждый `<pre>` со значением JSON в RTL читается слева направо. Сейчас стиль `section` лежит в стилях компонента `App` и не доходит до компонентов фаз, а у блоков `<pre>` с JSON нет `dir="ltr"`. Только playground; кит не меняется.

**Заблокировано:** нет (можно начинать сразу)

**Статус:** ready-for-agent

- [ ] У каждой секции playground есть рамка карточки; проверено в браузере в light, dark и RTL
- [ ] У каждого `<pre>` с JSON есть `dir="ltr"`, и в RTL он читается по порядку
- [ ] Секции, у которых рамка уже была, выглядят так же; playground собирается в рамках бюджетов, его тесты проходят
