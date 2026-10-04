# 08: Checkbox, switch and radio are verified through reactive forms

**What to build:** nothing changes for a user of these three controls; what changes is that their
forms behaviour is proven against reactive forms instead of Signal Forms, so the proof survives the
removal of Signal Forms from the library.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The Signal Forms host is removed from the checkbox, switch and radio specs
- [ ] For each, the reactive forms host asserts: checked or selected value in both directions, disabled from the control, readonly, required marker, touched on blur, error shown only when invalid and touched, and the validator's message
- [ ] Indeterminate state for the checkbox and group navigation for the radio keep their existing coverage
- [ ] Assertions go through the existing harnesses, and no new harness or test helper is introduced
- [ ] One commit per control

## Русский перевод

# 08: Чекбокс, переключатель и радио проверяются через реактивные формы

**Что сделать:** для пользователя этих трёх контролов не меняется ничего; меняется то, что их
поведение в формах доказывается на реактивных формах, а не на Signal Forms, — и это доказательство
переживёт удаление Signal Forms из библиотеки.

**Блокируется:** 01

**Статус:** ready-for-agent

- [ ] Сигнальный хост удалён из спеков чекбокса, переключателя и радио
- [ ] Для каждого реактивный хост проверяет: значение или отмеченность в обе стороны, disabled от контрола, readonly, маркер обязательности, touched по уходу фокуса, показ ошибки только при «невалиден и тронут» и сообщение валидатора
- [ ] Неопределённое состояние чекбокса и навигация по группе радио сохраняют существующее покрытие
- [ ] Проверки идут через существующие харнессы, новых харнессов и тестовых помощников не появляется
- [ ] По коммиту на контрол
