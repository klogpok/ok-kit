# 13: Playground uses the kit layout classes

**Spec:** [../spec.md](../spec.md)

**What to build:** the playground lays out its sections with the kit's layout classes instead of its own `.row`, `.toolbar`, `.stack` and `.grid`, and looks the same. One-off grids such as `3fr 2fr` stay local.

**Blocked by:** 12 (Layout utilities)

**Status:** ready-for-agent

- [ ] The playground defines no local `.row`, `.toolbar`, `.stack` or `.grid`
- [ ] The playground builds within its budgets and looks the same in the browser in light, dark and RTL

## Русский перевод

# 13: Playground использует layout-классы кита

**Спека:** [../spec.md](../spec.md)

**Что сделать:** playground раскладывает свои разделы layout-классами кита вместо своих `.row`, `.toolbar`, `.stack` и `.grid` и выглядит так же. Разовые сетки вроде `3fr 2fr` остаются локальными.

**Заблокировано:** 12 (Layout-утилиты)

**Статус:** ready-for-agent

- [ ] Playground не определяет локальных `.row`, `.toolbar`, `.stack` или `.grid`
- [ ] Playground собирается в рамках бюджетов и выглядит так же в браузере в light, dark и RTL
