# 03: Time input keeps its parse errors without Signal Forms

**What to build:** typing an impossible time still tells the user so, and the message clears when
the text becomes valid. The message is the control's own, not one carried by Signal Forms, and it
does not make a bound form control invalid by itself.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The control no longer imports anything from the Signal Forms package
- [ ] Raw typed text is held in a signal derived from the value, and formatting on blur behaves as before
- [ ] A parse failure produces a message through the control's own error collection
- [ ] A parse failure does not add an error to a bound form control
- [ ] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [ ] Step, minimum and maximum time behaviour is unchanged

## Русский перевод

# 03: Поле времени сохраняет ошибки разбора без Signal Forms

**Что сделать:** ввод невозможного времени по-прежнему сообщает об этом пользователю, а при
исправлении текста сообщение уходит. Сообщение принадлежит самому контролу, а не приносится Signal
Forms, и само по себе не делает связанный контрол формы невалидным.

**Блокируется:** 01

**Статус:** ready-for-agent

- [ ] Контрол больше ничего не импортирует из пакета Signal Forms
- [ ] Сырой текст держится в сигнале, производном от значения, форматирование по уходу фокуса как раньше
- [ ] Неудачный разбор даёт сообщение через собственную коллекцию ошибок контрола
- [ ] Неудачный разбор не добавляет ошибку в связанный контрол формы
- [ ] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [ ] Поведение шага, минимального и максимального времени не изменилось
