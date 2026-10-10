# 09: Compact density for controls

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer marks any region `data-density="compact"` and its controls get shorter (sm 1.75rem, md 2rem, lg 2.5rem) with smaller inline padding and gaps; options, menu items and tree nodes shrink with them; fonts and page spacing do not change. On the root element it also reaches overlays. A reviewer switches density from the Storybook toolbar, and a "Foundations/Density" story shows the controls in both densities.

**Blocked by:** 07 (Phase 9.1 report)

**Status:** ready-for-agent

- [ ] The compact values of the semantic control tokens are generated for `[data-density="compact"]`, also on the root element
- [ ] The Storybook toolbar has a Density switch next to theme and direction
- [ ] "Foundations/Density" shows input, select, button, checkbox, segmented and an open select list in both densities, has baselines and passes axe
- [ ] Existing baselines do not change
- [ ] README and CHANGELOG document density

## Русский перевод

# 09: Компактная плотность контролов

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения помечает любой участок `data-density="compact"`, и его контролы становятся ниже (sm 1.75rem, md 2rem, lg 2.5rem), с меньшими внутренними отступами и промежутками; опции, пункты меню и узлы дерева уменьшаются вместе с ними; шрифты и отступы страницы не меняются. На корневом элементе плотность доходит и до оверлеев. Ревьюер переключает плотность в тулбаре Storybook, а story «Foundations/Density» показывает контролы в обеих плотностях.

**Заблокировано:** 07 (Отчёт подфазы 9.1)

**Статус:** ready-for-agent

- [ ] Компактные значения семантических токенов контролов генерируются для `[data-density="compact"]`, в том числе на корневом элементе
- [ ] В тулбаре Storybook есть переключатель Density рядом с темой и направлением
- [ ] «Foundations/Density» показывает input, select, button, checkbox, segmented и открытый список select в обеих плотностях, имеет снимки и проходит axe
- [ ] Существующие снимки не меняются
- [ ] README и CHANGELOG описывают плотность
