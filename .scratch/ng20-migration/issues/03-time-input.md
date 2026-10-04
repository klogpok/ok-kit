# 03: Time input keeps its parse errors without Signal Forms

**What to build:** typing an impossible time still tells the user so, and the message clears when
the text becomes valid. The message is the control's own, not one carried by Signal Forms, and it
does not make a bound form control invalid by itself.

**Blocked by:** 01

**Status:** ready-for-human

- [x] The control no longer imports anything from the Signal Forms package
- [x] Raw typed text is held in a signal derived from the value, and formatting on blur behaves as before
- [x] A parse failure produces a message through the control's own error collection
- [x] A parse failure does not add an error to a bound form control
- [x] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [x] Step, minimum and maximum time behaviour is unchanged

## Русский перевод

# 03: Поле времени сохраняет ошибки разбора без Signal Forms

**Что сделать:** ввод невозможного времени по-прежнему сообщает об этом пользователю, а при
исправлении текста сообщение уходит. Сообщение принадлежит самому контролу, а не приносится Signal
Forms, и само по себе не делает связанный контрол формы невалидным.

**Блокируется:** 01

**Статус:** ready-for-human

- [x] Контрол больше ничего не импортирует из пакета Signal Forms
- [x] Сырой текст держится в сигнале, производном от значения, форматирование по уходу фокуса как раньше
- [x] Неудачный разбор даёт сообщение через собственную коллекцию ошибок контрола
- [x] Неудачный разбор не добавляет ошибку в связанный контрол формы
- [x] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [x] Поведение шага, минимального и максимального времени не изменилось

## Comments

**2026-10-04 - done, waiting for the user's review.**

- `time-input.ts` no longer imports `@angular/forms/signals` or `@angular/forms`.
  `transformedValue`, the `parseValidator` it fed, the `validatedControl` it was attached to and
  `releaseParseValidator` are gone; `registerOnChange` is no longer overridden.
- The typed text now lives in the `draft` linked signal alone, whose source is the shown time:
  the text survives until the value changes elsewhere, and `writeValue` drops it outright. Blur
  and Enter still commit it - a valid time is reformatted in the locale format, an invalid one is
  kept for the user to fix.
- The parse message goes through `ownErrors()`, which the base class merges into
  `errorMessages()` and into `showError()`. It is returned whether or not a forms directive is
  bound, so `invalidState` collapsed into the base's `showError()`, as it did for
  `ui-number-input`.
- A parse failure therefore writes `null` to the bound control and nothing else: its `errors`
  stay whatever its own validators produce, and the form stays valid. Typing "19:00" under
  `maxTime="18:00"` is now a field-level message, not a form error, so an application that must
  reject a missing time needs its own `required` validator. That is the contract this ticket
  asked for, and it is what the README now says.
- The Signal Forms host of the spec is gone, and the readonly host with it. Their cases live on a
  reactive forms host built from a `FormGroup` of two controls and asserted through
  `UiTimeInputHarness`: value both ways, the required marker, readonly, disabled from the
  control, touched on blur, the validator message shown only when invalid and touched, and the
  parse message.
- Two further cases guard what the removed code used to cover: a parse failure adds no error key
  to a control that has none of its own, and a value written from the control - including a
  `reset()` that writes `null` over `null` - clears the text and the message. Removing
  `draft.set(null)` from `writeValue` makes the second one fail, so it is a real guard.
- The removed Signal Forms host also covered the `isDisabled()` early return in `onFieldClick()`
  by clicking the field. A standalone case covers it again, but only for the behaviour: deleting
  that line still passes, because `open()` guards on `isDisabled()` too and `focus()` on a
  disabled input does nothing. The line is kept as the mirror of the same guard in `pick()`.
- Step (`interval`), `minTime` and `maxTime` are untouched: the list is still built by
  `timeSlots()`, and a typed time outside the limits still parses to `null`.
- The README paragraph on `ui-time-input` described the removed `uiTimeParse` error and why the
  limits are named `minTime`/`maxTime` under Signal Forms; both are corrected, and the date+time
  example next to it now binds with `formControlName`. The rest of the forms documentation
  belongs to ticket 20.
- Green: `ng lint`, the full library suite (691 tests, 68 files), the playground suite,
  `ng build ui-kit`, `ng build playground` and `prettier --check`. Coverage
  96.09 / 93.28 / 93.38 / 97.99, unchanged from the start of the migration. The template and the
  stylesheet are untouched, so the visual baselines cannot move.
- Not done here, by scope: `CHANGELOG.md` still records `uiTimeParse` as what phase 8.2 delivered
  (that is history), `.claude/rules/forms.md` still describes the `transformedValue` pattern the
  datepicker still uses (ticket 04), and the playground still binds this control with
  `[formField]` (ticket 12). One consequence to know until ticket 13 removes Signal Forms from
  the core: `[formField]` still binds the value through the base class, but a Signal Forms
  `reset()` no longer clears invalid typed text, because only `writeValue` drops the draft and
  `[formField]` never calls it.

## Комментарии

**2026-10-04 - сделано, ждёт ревью пользователя.**

- `time-input.ts` больше не импортирует ни `@angular/forms/signals`, ни `@angular/forms`.
  Удалены `transformedValue`, питавшийся им `parseValidator`, `validatedControl`, к которому тот
  цеплялся, и `releaseParseValidator`; `registerOnChange` больше не переопределяется.
- Введённый текст теперь живёт только в линкованном сигнале `draft`, источник которого -
  показываемое время: текст держится, пока значение не поменяют снаружи, а `writeValue`
  сбрасывает его явно. По уходу фокуса и по Enter он по-прежнему фиксируется: корректное время
  переформатируется под локаль, некорректное остаётся на экране, чтобы пользователь его починил.
- Сообщение о разборе идёт через `ownErrors()`, которое базовый класс сливает в
  `errorMessages()` и в `showError()`. Оно возвращается независимо от того, привязана ли
  директива формы, поэтому `invalidState` схлопнулся в базовый `showError()` - как и у
  `ui-number-input`.
- Неудачный разбор пишет в связанный контрол только `null` и ничего больше: его `errors`
  остаются такими, какими их сделали его собственные валидаторы, и форма остаётся валидной.
  Ввод «19:00» при `maxTime="18:00"` - теперь сообщение поля, а не ошибка формы, поэтому
  приложению, которому время обязательно, нужен свой `required`. Это и есть контракт, который
  просил тикет, и именно так теперь написано в README.
- Сигнальный хост в спеке удалён, вместе с ним и readonly-хост. Их кейсы живут на реактивном
  хосте из `FormGroup` с двумя контролами и проверяются через `UiTimeInputHarness`: значение в
  обе стороны, маркер обязательности, readonly, disabled из контрола, touched по уходу фокуса,
  сообщение валидатора только при «невалиден и тронут» и сообщение о разборе.
- Ещё два кейса закрывают то, что раньше страховал удалённый код: неудачный разбор не добавляет
  ключ ошибки в контрол без собственных валидаторов, а значение, записанное из контрола -
  включая `reset()`, пишущий `null` поверх `null`, - убирает текст и сообщение. Если убрать
  `draft.set(null)` из `writeValue`, второй кейс падает, то есть страховка настоящая.
- Удалённый сигнальный хост также покрывал ранний выход по `isDisabled()` в `onFieldClick()` -
  он кликал по полю. Отдельный кейс покрывает это снова, но только по поведению: если эту строку
  удалить, тесты всё равно проходят, потому что `open()` тоже проверяет `isDisabled()`, а
  `focus()` на disabled-инпуте ничего не делает. Строка оставлена как зеркало такой же проверки
  в `pick()`.
- Шаг (`interval`), `minTime` и `maxTime` не тронуты: список по-прежнему строит `timeSlots()`, а
  введённое время вне пределов по-прежнему разбирается в `null`.
- Абзац README про `ui-time-input` описывал удалённую ошибку `uiTimeParse` и объяснял, почему
  пределы называются `minTime`/`maxTime` при Signal Forms - и то и другое исправлено, а пример с
  датой и временем рядом теперь связывается через `formControlName`. Остальная документация по
  формам - тикет 20.
- Зелёное: `ng lint`, полный набор библиотеки (691 тест, 68 файлов), тесты playground,
  `ng build ui-kit`, `ng build playground` и `prettier --check`. Покрытие
  96.09 / 93.28 / 93.38 / 97.99 - как в начале миграции. Шаблон и стили не тронуты, так что
  визуальные бейслайны сдвинуться не могут.
- Сознательно вне объёма: `CHANGELOG.md` по-прежнему фиксирует `uiTimeParse` как результат фазы
  8.2 (это история), `.claude/rules/forms.md` описывает паттерн `transformedValue`, которым ещё
  пользуется датапикер (тикет 04), а playground всё ещё связывает контрол через `[formField]`
  (тикет 12). Одно следствие, о котором надо знать, пока тикет 13 не вынес Signal Forms из
  ядра: `[formField]` всё ещё привязывает значение через базовый класс, но `reset()` в Signal
  Forms больше не очищает некорректный введённый текст, потому что драфт сбрасывает только
  `writeValue`, а `[formField]` его не вызывает.
