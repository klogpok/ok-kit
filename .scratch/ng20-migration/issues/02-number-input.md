# 02: Number input keeps its parse errors without Signal Forms

**What to build:** typing something that is not a number into the number input still shows the user
a message saying so, and clearing or correcting the text still makes the message go away. The
message no longer travels through Signal Forms, and it never makes the consumer's form control
invalid on its own.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The control no longer imports anything from the Signal Forms package
- [ ] Raw typed text is held in a signal derived from the value, and formatting on blur behaves as before
- [ ] A parse failure produces a message through the control's own error collection, which the base class already merges into what is displayed
- [ ] A parse failure does not add an error to a bound form control and does not make the form invalid
- [ ] The spec's Signal Forms host is gone and the cases it owned - value in both directions, disabled, required marker, touched on blur, error only when invalid and touched, validator message - are asserted on the reactive forms host through the existing harness
- [ ] Min, max, step and locale formatting behaviour is unchanged

## Русский перевод

# 02: Числовое поле сохраняет ошибки разбора без Signal Forms

**Что сделать:** ввод не-числа в числовое поле по-прежнему показывает пользователю сообщение об
этом, а очистка или исправление текста по-прежнему это сообщение убирает. Сообщение больше не идёт
через Signal Forms и само по себе никогда не делает контрол формы потребителя невалидным.

**Блокируется:** 01

**Статус:** ready-for-agent

- [ ] Контрол больше ничего не импортирует из пакета Signal Forms
- [ ] Сырой введённый текст держится в сигнале, производном от значения, форматирование по уходу фокуса ведёт себя как раньше
- [ ] Неудачный разбор даёт сообщение через собственную коллекцию ошибок контрола, которую базовый класс уже сливает в отображаемое
- [ ] Неудачный разбор не добавляет ошибку в связанный контрол формы и не делает форму невалидной
- [ ] Сигнальный хост в спеке удалён, а его кейсы — значение в обе стороны, disabled, маркер обязательности, touched по уходу фокуса, ошибка только при «невалиден и тронут», сообщение из валидатора — проверяются на реактивном хосте через существующий харнесс
- [ ] Поведение min, max, шага и локального форматирования не изменилось
