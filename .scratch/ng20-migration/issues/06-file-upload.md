# 06: File upload keeps its rejection messages without Signal Forms

**What to build:** picking or dropping a file that the control rejects still tells the user why,
and the message is the control's own rather than one carried by Signal Forms.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The control no longer imports anything from the Signal Forms package
- [ ] A rejected file produces a message through the control's own error collection
- [ ] A rejection does not add an error to a bound form control; a validator supplied by the consumer still does
- [ ] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [ ] Drag and drop, multiple selection, removal of a selected file and the file list rendering are unchanged

## Русский перевод

# 06: Загрузка файлов сохраняет сообщения об отказе без Signal Forms

**Что сделать:** выбор или перетаскивание файла, который контрол отвергает, по-прежнему объясняет
пользователю причину, и это сообщение принадлежит самому контролу, а не приносится Signal Forms.

**Блокируется:** 01

**Статус:** ready-for-agent

- [ ] Контрол больше ничего не импортирует из пакета Signal Forms
- [ ] Отвергнутый файл даёт сообщение через собственную коллекцию ошибок контрола
- [ ] Отказ не добавляет ошибку в связанный контрол формы; валидатор от потребителя — по-прежнему добавляет
- [ ] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [ ] Перетаскивание, множественный выбор, удаление выбранного файла и отрисовка списка не изменились
