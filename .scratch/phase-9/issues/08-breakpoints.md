# 08: Named breakpoints in SCSS and TypeScript

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer switches layouts at the kit's breakpoints sm 40rem, md 52rem, lg 64rem and xl 80rem: with the `up()` and `down()` SCSS mixins, with the `$breakpoints` map, or with a TypeScript constant for the CDK breakpoint observer. All three come from the token source through the generator. The date-range-picker decides between one and two months with the md constant.

**Blocked by:** 07 (Phase 9.1 report)

**Status:** ready-for-agent

- [ ] The breakpoints live in the token source; the generator emits the SCSS map, the mixins and the TypeScript constant; no CSS custom properties
- [ ] `up(md)` and `down(md)` do not overlap at the boundary
- [ ] The mixins are available through the kit's SCSS API, and the constant is exported from core
- [ ] The date-range-picker uses the md constant; its spec covers one and two months
- [ ] README and CHANGELOG document the breakpoints

## Русский перевод

# 08: Именованные брейкпоинты в SCSS и TypeScript

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения переключает раскладку на брейкпоинтах кита sm 40rem, md 52rem, lg 64rem и xl 80rem: SCSS-миксинами `up()` и `down()`, map `$breakpoints` или TypeScript-константой для CDK breakpoint observer. Все три берутся из источника токенов через генератор. Date-range-picker выбирает между одним и двумя месяцами по константе md.

**Заблокировано:** 07 (Отчёт подфазы 9.1)

**Статус:** ready-for-agent

- [ ] Брейкпоинты лежат в источнике токенов; генератор выдаёт SCSS-map, миксины и TypeScript-константу; без CSS custom properties
- [ ] `up(md)` и `down(md)` не пересекаются на границе
- [ ] Миксины доступны через SCSS API кита, константа экспортируется из core
- [ ] Date-range-picker использует константу md; его спек покрывает один и два месяца
- [ ] README и CHANGELOG описывают брейкпоинты
