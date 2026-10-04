# 09: Segmented, button toggle and slider are verified through reactive forms

**What to build:** the same shift of proof for the three selection controls: their forms behaviour
is asserted against reactive forms so that it still holds once Signal Forms is gone.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The Signal Forms host is removed from the segmented, button toggle and slider specs
- [ ] For each, the reactive forms host asserts: value in both directions, disabled from the control, readonly, required marker, touched on blur, error shown only when invalid and touched, and the validator's message
- [ ] Vertical orientation, Home and End handling, and the slider's keyboard stepping keep their existing coverage
- [ ] Assertions go through the existing harnesses, and no new harness or test helper is introduced
- [ ] One commit per control

## Русский перевод

# 09: Segmented, button toggle и слайдер проверяются через реактивные формы

**Что сделать:** тот же перенос доказательства для трёх контролов выбора: их поведение в формах
утверждается на реактивных формах, чтобы оно сохранилось после ухода Signal Forms.

**Блокируется:** 01

**Статус:** ready-for-agent

- [ ] Сигнальный хост удалён из спеков segmented, button toggle и слайдера
- [ ] Для каждого реактивный хост проверяет: значение в обе стороны, disabled от контрола, readonly, маркер обязательности, touched по уходу фокуса, показ ошибки только при «невалиден и тронут» и сообщение валидатора
- [ ] Вертикальная ориентация, обработка Home и End и шаг слайдера с клавиатуры сохраняют существующее покрытие
- [ ] Проверки идут через существующие харнессы, новых харнессов и тестовых помощников не появляется
- [ ] По коммиту на контрол
