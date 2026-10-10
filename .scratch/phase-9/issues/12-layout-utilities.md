# 12: Layout utilities

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer lays out screens with `.ui-stack`, `.ui-cluster`, `.ui-grid` and `.ui-container`, changes the gap with `.ui-gap-3xs` … `.ui-gap-3xl` (md by default), sets the grid's minimum column width with a custom property (20rem by default), and uses mixins of the same names inside component styles. All of them use logical properties. A "Foundations/Layout" story shows each utility and gap.

**Blocked by:** 11 (Phase 9.2 report)

**Status:** ready-for-agent

- [ ] The four classes and the gap modifiers are in the kit stylesheet
- [ ] `stack`, `cluster`, `grid` and `container` mixins are in the kit's SCSS API and produce the same rules
- [ ] "Foundations/Layout" has baselines in all three modes and passes axe
- [ ] README and CHANGELOG document the utilities

## Русский перевод

# 12: Layout-утилиты

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения раскладывает экраны через `.ui-stack`, `.ui-cluster`, `.ui-grid` и `.ui-container`, меняет промежуток через `.ui-gap-3xs` … `.ui-gap-3xl` (по умолчанию md), задаёт минимальную ширину колонки сетки custom property (по умолчанию 20rem) и использует одноимённые миксины в стилях компонентов. Всё на логических свойствах. Story «Foundations/Layout» показывает каждую утилиту и промежуток.

**Заблокировано:** 11 (Отчёт подфазы 9.2)

**Статус:** ready-for-agent

- [ ] Четыре класса и модификаторы промежутка есть в стилях кита
- [ ] Миксины `stack`, `cluster`, `grid` и `container` есть в SCSS API кита и выдают те же правила
- [ ] «Foundations/Layout» имеет снимки во всех трёх режимах и проходит axe
- [ ] README и CHANGELOG описывают утилиты
