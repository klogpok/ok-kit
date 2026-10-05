# 12: The playground demonstrates the library with reactive forms

**What to build:** the showcase application that a maintainer opens to see the kit in use binds its
forms the way the consuming application does. Nothing in it reaches for Signal Forms any more.

**Blocked by:** 01

**Status:** done, waiting for the user's review

- [x] No page of the playground imports from the Signal Forms package
- [x] Each form on the demonstration pages is a reactive form, with the same fields, validators and submit behaviour as before
- [x] Validation messages shown on those pages are unchanged from the reader's point of view
- [x] The playground's own spec still renders every deferred section and passes
- [x] The playground builds

## Comments

**2026-10-05 - done, waiting for the user's review.**

- No file under `projects/playground/` imports `@angular/forms/signals`. The four forms are
  `FormGroup`s bound with `[formGroup]` and `formControlName`: the profile (`app.ts`), the meeting
  schedule (`phase-three.ts`), the work order (`phase-seven.ts`) and the unit filters
  (`phase-eight.ts`). The inspection wizard was already reactive after ticket 07.
- The fields and the messages are the ones that were there before. Where a Signal Forms rule
  carried a `message`, a plain validator is paired with the message:
  - a control with no message of its own projects a `<ui-error>` under its error key
    (name, email, terms, city, owner, trades, files, recipients, features);
  - a control that reads typed text carries the message in the error instead (see below).
- `required()` on a list became `uiAtLeastOne` in the new `src/app/validators.ts`, because
  `Validators.required` passes on an empty array, the same gap `minLength(path, 1)` filled.
- Limits that `[formField]` used to push onto a control from the `min()` / `max()` rules are now
  inputs on the control itself: `[min]="today"` on the meeting date, `min`/`max` on the units and
  on the rooms slider. This follows the choice ticket 07 made for the visit date: a day `[min]`
  already rules out never reaches the control, so a `minDate` message would be unreachable. The
  message "The meeting cannot be in the past" is therefore gone, and the hint on the rooms slider
  now says "From the min and max inputs".
- `submit(form, action)` became an `invalid` check plus `markAllAsTouched()`, so an empty submit
  still turns every message on at once. The JSON panels read the group through
  `toSignal(valueChanges)`.
- The three section headings that said "(Signal Forms)" now say "(Reactive Forms)".
- **The item ticket 07 left here is fixed.** A projected `<ui-error>` makes `ui-form-field` drop
  the control's own messages, which hid the range picker's "that is not a date" behind "Choose
  the permit period": the control is `null` for an empty field and for unreadable text alike. The
  five fields that read typed text - permit period, visit date, visit time, meeting date, units -
  now carry their required message in the error through `uiRequired()`, which the field merges
  with its own messages. `Validators.required` stays in each list, so the required marker is
  unchanged. `endOfRange` carries its message the same way.
- The spec grew from 2 cases to 7. The new ones assert, from the reader's side: the profile form
  refusing an empty submit, its email message, the work order refusing an empty submit, the
  meeting date asking for a value once the field is left, and both messages showing together on
  an unreadable permit period. That last one fails on the projected form, so it guards the fix.
- Green: `ng test playground --watch=false` (7), `ng build playground`, `ng lint`.

### Left for other tickets

- `.claude/rules/forms.md` still describes Signal Forms as the native contract. It is a library
  rule, not a playground one, so it was left to the documentation ticket.

## Русский перевод

# 12: Playground демонстрирует библиотеку на реактивных формах

**Что сделать:** витринное приложение, которое сопровождающий открывает, чтобы увидеть кит в деле,
связывает свои формы так же, как это делает потребляющее приложение. Ничто в нём больше не тянется
к Signal Forms.

**Блокируется:** 01

**Статус:** сделано, ждёт ревью пользователя

- [x] Ни одна страница playground не импортирует из пакета Signal Forms
- [x] Каждая форма на демонстрационных страницах — реактивная, с теми же полями, валидаторами и поведением отправки, что и раньше
- [x] Сообщения валидации на этих страницах с точки зрения читателя не изменились
- [x] Собственный спек playground по-прежнему рендерит все отложенные секции и проходит
- [x] Playground собирается

## Комментарии

**2026-10-05 — сделано, ждёт ревью пользователя.**

- Ни один файл в `projects/playground/` не импортирует `@angular/forms/signals`. Четыре формы —
  это `FormGroup`, связанные через `[formGroup]` и `formControlName`: профиль (`app.ts`),
  запись на встречу (`phase-three.ts`), наряд-заказ (`phase-seven.ts`) и фильтры квартир
  (`phase-eight.ts`). Визард осмотра стал реактивным ещё в тикете 07.
- Поля и сообщения — те же, что были. Там, где правило Signal Forms несло `message`, теперь
  обычный валидатор в паре с сообщением:
  - контрол без собственных сообщений проецирует `<ui-error>` под свой ключ ошибки
    (имя, email, условия, город, владелец, специальности, файлы, получатели, удобства);
  - контрол, который читает набранный текст, несёт сообщение внутри ошибки (см. ниже).
- `required()` на списке стал `uiAtLeastOne` в новом `src/app/validators.ts`: `Validators.required`
  проходит на пустом массиве — ровно тот пробел, который закрывал `minLength(path, 1)`.
- Границы, которые `[formField]` переносил на контрол из правил `min()` / `max()`, теперь входы
  самого контрола: `[min]="today"` на дате встречи, `min`/`max` на количестве квартир и на
  слайдере комнат. Это повторяет решение тикета 07 по дате визита: день, который `[min]` уже
  отсекает, до контрола не доходит, поэтому сообщение `minDate` было бы недостижимо. Сообщение
  «The meeting cannot be in the past» поэтому убрано, а подсказка у слайдера комнат теперь
  говорит «From the min and max inputs».
- `submit(form, action)` превратился в проверку `invalid` плюс `markAllAsTouched()`, так что
  пустая отправка по-прежнему зажигает все сообщения разом. JSON-панели читают группу через
  `toSignal(valueChanges)`.
- Три заголовка секций со словами «(Signal Forms)» теперь говорят «(Reactive Forms)».
- **Пункт, оставленный тикетом 07, исправлен.** Спроецированная `<ui-error>` заставляет
  `ui-form-field` выбрасывать собственные сообщения контрола, и это прятало «неверная дата»
  пикера диапазона за «Choose the permit period»: контрол равен `null` и для пустого поля, и для
  нечитаемого текста. Пять полей, читающих набранный текст, — период разрешения, дата и время
  визита, дата встречи, количество квартир — теперь несут своё required-сообщение внутри ошибки
  через `uiRequired()`, и поле сливает его со своими. `Validators.required` остаётся в каждом
  списке, поэтому маркер обязательности не изменился. `endOfRange` несёт сообщение так же.
- Спек вырос с 2 кейсов до 7. Новые проверяют со стороны читателя: профиль не отправляется
  пустым, сообщение про email, наряд-заказ не отправляется пустым, дата встречи просит значение,
  как только поле покинули, и оба сообщения вместе на нечитаемом периоде разрешения. Последний
  падает на спроецированном варианте, то есть сторожит исправление.
- Зелёные: `ng test playground --watch=false` (7), `ng build playground`, `ng lint`.

### Оставлено другим тикетам

- В `.claude/rules/forms.md` Signal Forms всё ещё описаны как родной контракт. Это правило
  библиотеки, а не playground, поэтому оставлено тикету документации.
