# 05: UiOption exposes only its inputs

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer sees only `value`, `disabled` and `label` as the public API of an option, plus the two methods CDK `Highlightable` requires. States read only by the option's template become protected; members the option panel needs get the `ɵ` prefix. Select, multi-select and autocomplete behave exactly as before.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `active`, `selected`, `indeterminate`, `filteredOut` and `unavailable` are protected
- [ ] `id`, `getLabel` and the `disabled` getter carry the `ɵ` prefix, and every caller in the kit, its harnesses and specs is updated
- [ ] Select, multi-select and autocomplete specs pass unchanged in behavior
- [ ] The CHANGELOG lists the rename as a breaking change

## Русский перевод

# 05: UiOption открывает наружу только свои входы

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения видит в публичном API опции только `value`, `disabled` и `label` плюс два метода, которых требует CDK `Highlightable`. Состояния, которые читает только шаблон опции, становятся protected; члены, нужные панели опций, получают префикс `ɵ`. Select, multi-select и autocomplete ведут себя ровно как раньше.

**Заблокировано:** Нет (можно начинать сразу)

**Статус:** ready-for-agent

- [ ] `active`, `selected`, `indeterminate`, `filteredOut` и `unavailable` — protected
- [ ] `id`, `getLabel` и геттер `disabled` носят префикс `ɵ`, все вызовы в ките, harnesses и спеках обновлены
- [ ] Спеки select, multi-select и autocomplete проходят без изменения поведения
- [ ] CHANGELOG указывает переименование как ломающее изменение
