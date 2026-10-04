# 06: File upload keeps its rejection messages without Signal Forms

**What to build:** picking or dropping a file that the control rejects still tells the user why,
and the message is the control's own rather than one carried by Signal Forms.

**Blocked by:** 01

**Status:** ready-for-human

- [x] The control no longer imports anything from the Signal Forms package
- [x] A rejected file produces a message through the control's own error collection
- [x] A rejection does not add an error to a bound form control; a validator supplied by the consumer still does
- [x] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [x] Drag and drop, multiple selection, removal of a selected file and the file list rendering are unchanged

## Русский перевод

# 06: Загрузка файлов сохраняет сообщения об отказе без Signal Forms

**Что сделать:** выбор или перетаскивание файла, который контрол отвергает, по-прежнему объясняет
пользователю причину, и это сообщение принадлежит самому контролу, а не приносится Signal Forms.

**Блокируется:** 01

**Статус:** ready-for-human

- [x] Контрол больше ничего не импортирует из пакета Signal Forms
- [x] Отвергнутый файл даёт сообщение через собственную коллекцию ошибок контрола
- [x] Отказ не добавляет ошибку в связанный контрол формы; валидатор от потребителя — по-прежнему добавляет
- [x] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [x] Перетаскивание, множественный выбор, удаление выбранного файла и отрисовка списка не изменились

## Comments

**2026-10-04 - done, waiting for the user's review.**

- `file-upload.ts` no longer imports `@angular/forms` or `@angular/forms/signals`.
  `transformedValue` (`picked`), the `fileValidator` it fed, the `validatedControl` it was
  attached to, `releaseValidator` and the `registerOnChange` override are gone, and with them
  the `uiFileType` / `uiFileSize` / `uiFileCount` error kinds.
- The messages now come from `fileErrors()`, a `computed` over the `problems()` map and
  `maxFiles`, returned from `ownErrors()`. The base class merges that into `errorMessages()`
  and `showError()`, so `invalidState` collapsed into `showError()`.
- A rejected file therefore writes only the files to a bound control: its `errors` stay whatever
  its own validators produce, and the form stays valid. `setValue` sets the model directly.
- Nothing else moved: `addFiles`, the drop handlers, the `multiple` replacement, `remove` with
  its announcement and focus move, and the list with sizes and progress are untouched.
- The Signal Forms host of the spec is gone. Its cases live on a reactive forms host built from a
  `FormGroup` of two controls and asserted through `UiFileUploadHarness`: value both ways, the
  compact button variant, disabled from the control, touched on blur, and the validator message
  shown only when invalid and touched, plus the rejection messages for type, size and count.
- Three further cases guard what the removed code used to cover: a rejection adds no error key to
  a control that has a validator of its own (and that validator still fires once the file is
  removed), removing the rejected file drops the message, and files written from the control drop
  it too.
- The README paragraph on `ui-file-upload` described the removed error kinds and a Signal Forms
  example; both are corrected.
- Green: `ng lint`, `prettier --check`, `tsc --noEmit` over the spec project, the full library
  suite (693 tests, 68 files), the playground suite and `ng build ui-kit`.
- Two consequences of the pattern, the same for `ui-number-input`, `ui-time-input` and
  `ui-datepicker`, left as they are so the four controls stay consistent - they are the user's
  call, not this ticket's:
  - a projected `<ui-error>` hides the messages, because `UiFormField.autoErrors` returns `[]`
    whenever the field projects an error of its own, and the consumer can no longer read the
    reason from the control (`fileErrors` is private);
  - a disabled or readonly field still shows the message of a file the user can no longer remove.
    Unbound it did so before this change too; bound it is new, because Angular does not run
    validators on a disabled control.
- Not done here, by scope: `CHANGELOG.md` and `docs/ROADMAP.md` still record the error kinds as
  what phase 8 delivered (historical), and `.claude/rules/forms.md` lists the `ownErrors()`
  pattern without naming this control.

## Комментарии

**2026-10-04 - сделано, ждёт ревью пользователя.**

- `file-upload.ts` больше не импортирует `@angular/forms` и `@angular/forms/signals`. Удалены
  `transformedValue` (`picked`), питавшийся им `fileValidator`, `validatedControl`, к которому
  тот цеплялся, `releaseValidator` и переопределение `registerOnChange`, а вместе с ними виды
  ошибок `uiFileType` / `uiFileSize` / `uiFileCount`.
- Сообщения теперь даёт `fileErrors()` - `computed` поверх карты `problems()` и `maxFiles`, -
  возвращаемый из `ownErrors()`. Базовый класс сливает это в `errorMessages()` и `showError()`,
  поэтому `invalidState` схлопнулся в `showError()`.
- Отвергнутый файл пишет в связанный контрол только сами файлы: его `errors` остаются такими,
  какими их сделали собственные валидаторы, форма остаётся валидной. `setValue` пишет в модель
  напрямую.
- Остальное не тронуто: `addFiles`, обработчики перетаскивания, замена файла без `multiple`,
  `remove` с объявлением и переводом фокуса, список с размерами и прогрессом.
- Сигнальный хост в спеке удалён. Его кейсы живут на реактивном хосте из `FormGroup` с двумя
  контролами и проверяются через `UiFileUploadHarness`: значение в обе стороны, компактный
  вариант-кнопка, disabled из контрола, touched по уходу фокуса, сообщение валидатора только при
  «невалиден и тронут», а также сообщения об отказе по типу, размеру и количеству.
- Ещё три кейса закрывают то, что раньше страховал удалённый код: отказ не добавляет ключ ошибки
  в контрол с собственным валидатором (а тот по-прежнему срабатывает после удаления файла),
  удаление отвергнутого файла убирает сообщение, и запись файлов из контрола - тоже.
- Абзац README про `ui-file-upload` описывал удалённые виды ошибок и пример на Signal Forms -
  оба исправлены.
- Зелёное: `ng lint`, `prettier --check`, `tsc --noEmit` по спек-проекту, полный набор
  библиотеки (693 теста, 68 файлов), тесты playground и `ng build ui-kit`.
- Два следствия паттерна, общих с `ui-number-input`, `ui-time-input` и `ui-datepicker`,
  оставлены как есть, чтобы четыре контрола вели себя одинаково, - это решение пользователя, а не
  этого тикета:
  - спроецированный `<ui-error>` скрывает сообщения, потому что `UiFormField.autoErrors` даёт
    `[]`, если поле проецирует собственную ошибку, а потребитель больше не может прочитать
    причину из контрола (`fileErrors` приватный);
  - поле в disabled или readonly всё ещё показывает сообщение о файле, который уже нельзя
    удалить. Без привязки к форме так было и раньше; со связанным контролом это новое, потому
    что Angular не запускает валидаторы на disabled-контроле.
- Сознательно вне объёма: `CHANGELOG.md` и `docs/ROADMAP.md` по-прежнему фиксируют прежние виды
  ошибок как результат фазы 8 (это история), а `.claude/rules/forms.md` описывает паттерн
  `ownErrors()`, не называя этот контрол.
