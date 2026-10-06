# 04: Date picker keeps its parse errors without Signal Forms

**What to build:** typing a date the control cannot read still shows a message, picking a date from
the calendar still clears it, and the message is the control's own rather than one routed through
Signal Forms.

**Blocked by:** 01

**Status:** done

- [x] The control no longer imports anything from the Signal Forms package
- [x] Raw typed text is held in a signal derived from the value, and reformatting on blur behaves as before
- [x] A parse failure produces a message through the control's own error collection
- [x] A parse failure does not add an error to a bound form control; a minimum or maximum date validator supplied by the consumer still does
- [x] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [x] Calendar opening, keyboard navigation and locale formatting are unchanged

## Русский перевод

# 04: Выбор даты сохраняет ошибки разбора без Signal Forms

**Что сделать:** ввод даты, которую контрол не может прочитать, по-прежнему показывает сообщение,
выбор даты в календаре по-прежнему его убирает, и сообщение принадлежит самому контролу, а не
маршрутизируется через Signal Forms.

**Блокируется:** 01

**Статус:** сделано

- [x] Контрол больше ничего не импортирует из пакета Signal Forms
- [x] Сырой текст держится в сигнале, производном от значения, переформатирование по уходу фокуса как раньше
- [x] Неудачный разбор даёт сообщение через собственную коллекцию ошибок контрола
- [x] Неудачный разбор не добавляет ошибку в связанный контрол формы; валидатор минимальной или максимальной даты от потребителя — по-прежнему добавляет
- [x] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [x] Открытие календаря, навигация с клавиатуры и локальное форматирование не изменились
