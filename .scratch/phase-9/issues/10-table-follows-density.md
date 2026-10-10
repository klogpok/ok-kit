# 10: Table follows the density of its region

**Spec:** [../spec.md](../spec.md)

**What to build:** a table without a `density` input follows its region: inside `data-density="compact"` its cells use the compact padding. An explicit `density` of `default` or `compact` overrides the region in both directions. The Density story shows the table too.

**Blocked by:** 09 (Compact density for controls)

**Status:** ready-for-agent

- [ ] `density` accepts `undefined` and defaults to it
- [ ] A spec covers: no input follows the region, explicit default inside a compact region, explicit compact inside a default region
- [ ] "Foundations/Density" includes a table; existing table baselines do not change
- [ ] The CHANGELOG lists the new default as a breaking change

## Русский перевод

# 10: Таблица следует плотности своего участка

**Спека:** [../spec.md](../spec.md)

**Что сделать:** таблица без входа `density` следует своему участку: внутри `data-density="compact"` её ячейки используют компактный отступ. Явный `density` со значением `default` или `compact` перекрывает участок в обе стороны. Story Density показывает и таблицу.

**Заблокировано:** 09 (Компактная плотность контролов)

**Статус:** ready-for-agent

- [ ] `density` принимает `undefined` и по умолчанию равен ему
- [ ] Спек покрывает: без входа — следует участку, явный default внутри компактного участка, явный compact внутри обычного
- [ ] «Foundations/Density» включает таблицу; существующие снимки таблицы не меняются
- [ ] CHANGELOG указывает новое умолчание как ломающее изменение
