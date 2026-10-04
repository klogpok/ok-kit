# 10: Select, multi-select, autocomplete and chip input are verified through reactive forms

**What to build:** the same shift of proof for the four controls that pick from a list, including
the ones whose value is a collection.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The Signal Forms host is removed from the select, multi-select, autocomplete and chip input specs
- [ ] For each, the reactive forms host asserts: value in both directions, disabled from the control, readonly, required marker, touched when the overlay closes or focus leaves, error shown only when invalid and touched, and the validator's message
- [ ] For the controls whose value is a collection, a minimum-length validator's message is asserted
- [ ] Overlay behaviour, typeahead, option filtering and chip removal keep their existing coverage
- [ ] Assertions go through the existing harnesses, and no new harness or test helper is introduced
- [ ] One commit per control

## Русский перевод

# 10: Select, multi-select, автокомплит и поле чипов проверяются через реактивные формы

**Что сделать:** тот же перенос доказательства для четырёх контролов, выбирающих из списка, включая
те, у которых значение — коллекция.

**Блокируется:** 01

**Статус:** ready-for-agent

- [ ] Сигнальный хост удалён из спеков select, multi-select, автокомплита и поля чипов
- [ ] Для каждого реактивный хост проверяет: значение в обе стороны, disabled от контрола, readonly, маркер обязательности, touched при закрытии оверлея или уходе фокуса, показ ошибки только при «невалиден и тронут» и сообщение валидатора
- [ ] Для контролов, чьё значение — коллекция, проверяется сообщение валидатора минимальной длины
- [ ] Поведение оверлея, поиск по набору, фильтрация опций и удаление чипов сохраняют существующее покрытие
- [ ] Проверки идут через существующие харнессы, новых харнессов и тестовых помощников не появляется
- [ ] По коммиту на контрол
