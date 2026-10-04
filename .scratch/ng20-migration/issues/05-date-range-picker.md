# 05: Date range picker keeps its parse errors without Signal Forms

**What to build:** the range picker still reports unreadable text in either end of the range, still
reports a range whose end precedes its start, and does so through its own messages rather than
through Signal Forms.

**Blocked by:** 04 (same entry point; sequencing them avoids conflicting edits)

**Status:** ready-for-agent

- [ ] The control no longer imports anything from the Signal Forms package, including the validation error type
- [ ] Raw typed text for both ends is held in signals derived from the value
- [ ] A parse failure, and an end-before-start range, produce messages through the control's own error collection
- [ ] Neither adds an error to a bound form control
- [ ] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [ ] Two-month calendar behaviour, hover preview of the range and keyboard navigation are unchanged

## Русский перевод

# 05: Выбор диапазона дат сохраняет ошибки разбора без Signal Forms

**Что сделать:** контрол диапазона по-прежнему сообщает о нечитаемом тексте в любом из концов
диапазона и о диапазоне, конец которого раньше начала, и делает это своими сообщениями, а не через
Signal Forms.

**Блокируется:** 04 (та же точка входа; последовательность избавляет от конфликтующих правок)

**Статус:** ready-for-agent

- [ ] Контрол больше ничего не импортирует из пакета Signal Forms, включая тип ошибки валидации
- [ ] Сырой текст обоих концов держится в сигналах, производных от значения
- [ ] Неудачный разбор и диапазон с концом раньше начала дают сообщения через собственную коллекцию ошибок контрола
- [ ] Ни то, ни другое не добавляет ошибку в связанный контрол формы
- [ ] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [ ] Поведение двухмесячного календаря, подсветка диапазона при наведении и навигация с клавиатуры не изменились
