# 04: Date picker keeps its parse errors without Signal Forms

**What to build:** typing a date the control cannot read still shows a message, picking a date from
the calendar still clears it, and the message is the control's own rather than one routed through
Signal Forms.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The control no longer imports anything from the Signal Forms package
- [ ] Raw typed text is held in a signal derived from the value, and reformatting on blur behaves as before
- [ ] A parse failure produces a message through the control's own error collection
- [ ] A parse failure does not add an error to a bound form control; a minimum or maximum date validator supplied by the consumer still does
- [ ] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [ ] Calendar opening, keyboard navigation and locale formatting are unchanged

## Русский перевод

# 04: Выбор даты сохраняет ошибки разбора без Signal Forms

**Что сделать:** ввод даты, которую контрол не может прочитать, по-прежнему показывает сообщение,
выбор даты в календаре по-прежнему его убирает, и сообщение принадлежит самому контролу, а не
маршрутизируется через Signal Forms.

**Блокируется:** 01

**Статус:** ready-for-agent

- [ ] Контрол больше ничего не импортирует из пакета Signal Forms
- [ ] Сырой текст держится в сигнале, производном от значения, переформатирование по уходу фокуса как раньше
- [ ] Неудачный разбор даёт сообщение через собственную коллекцию ошибок контрола
- [ ] Неудачный разбор не добавляет ошибку в связанный контрол формы; валидатор минимальной или максимальной даты от потребителя — по-прежнему добавляет
- [ ] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [ ] Открытие календаря, навигация с клавиатуры и локальное форматирование не изменились
