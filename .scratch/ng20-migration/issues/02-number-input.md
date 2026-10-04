# 02: Number input keeps its parse errors without Signal Forms

**What to build:** typing something that is not a number into the number input still shows the user
a message saying so, and clearing or correcting the text still makes the message go away. The
message no longer travels through Signal Forms, and it never makes the consumer's form control
invalid on its own.

**Blocked by:** 01

**Status:** ready-for-human

- [x] The control no longer imports anything from the Signal Forms package
- [x] Raw typed text is held in a signal derived from the value, and formatting on blur behaves as before
- [x] A parse failure produces a message through the control's own error collection, which the base class already merges into what is displayed
- [x] A parse failure does not add an error to a bound form control and does not make the form invalid
- [x] The spec's Signal Forms host is gone and the cases it owned - value in both directions, disabled, required marker, touched on blur, error only when invalid and touched, validator message - are asserted on the reactive forms host through the existing harness
- [x] Min, max, step and locale formatting behaviour is unchanged

## Русский перевод

# 02: Числовое поле сохраняет ошибки разбора без Signal Forms

**Что сделать:** ввод не-числа в числовое поле по-прежнему показывает пользователю сообщение об
этом, а очистка или исправление текста по-прежнему это сообщение убирает. Сообщение больше не идёт
через Signal Forms и само по себе никогда не делает контрол формы потребителя невалидным.

**Блокируется:** 01

**Статус:** ready-for-human

- [x] Контрол больше ничего не импортирует из пакета Signal Forms
- [x] Сырой введённый текст держится в сигнале, производном от значения, форматирование по уходу фокуса ведёт себя как раньше
- [x] Неудачный разбор даёт сообщение через собственную коллекцию ошибок контрола, которую базовый класс уже сливает в отображаемое
- [x] Неудачный разбор не добавляет ошибку в связанный контрол формы и не делает форму невалидной
- [x] Сигнальный хост в спеке удалён, а его кейсы — значение в обе стороны, disabled, маркер обязательности, touched по уходу фокуса, ошибка только при «невалиден и тронут», сообщение из валидатора — проверяются на реактивном хосте через существующий харнесс
- [x] Поведение min, max, шага и локального форматирования не изменилось

## Comments

**2026-10-04 - done, waiting for the user's review.**

- `number-input.ts` no longer imports `@angular/forms/signals`. `transformedValue`, the
  `parseValidator` it fed, the `validatedControl` it was attached to and `releaseParseValidator`
  are gone; `registerOnChange` is no longer overridden.
- The raw text now lives in the `draft` linked signal alone, whose source is the value: the typed
  text survives until the value changes elsewhere, and `writeValue` drops it outright. Blur still
  formats, rounds to `maxFractionDigits` and clamps to `min`/`max`.
- The parse message goes through `ownErrors()`, which the base class merges into
  `errorMessages()` and into `showError()`. It is returned whether or not a forms directive is
  bound, so `invalidState` collapsed into the base's `showError()`.
- A parse failure therefore writes `null` to the bound control and nothing else: the control's
  `errors` stay whatever its own validators produce, and the form stays valid.
- The Signal Forms host of the spec is gone. Its cases live on a reactive forms host built from a
  `FormGroup` of two controls and asserted through `UiNumberInputHarness`: value both ways,
  limits from `min`/`max`, the required marker, disabled from the control, touched on blur, the
  validator message shown only when invalid and touched, and the parse message.
- Two further cases guard what the removed code used to cover: a parse failure adds no error key
  to a control that has validators of its own, and a value written from the control - including a
  `reset()` that writes `null` over `null` - clears the text and the message. Removing
  `draft.set(null)` from `writeValue` makes the second one fail, so it is a real guard.
- The README paragraph on `ui-number-input` described the removed `uiNumberParse` error and a
  Signal Forms example; both are corrected. The rest of the forms documentation belongs to
  ticket 20.
- Green: `ng lint`, `tsc --noEmit` over the spec project, the full library suite (690 tests, 68
  files), the playground suite, `ng build ui-kit` and `ng build playground`. Coverage
  96.09 / 93.22 / 93.4 / 98.00, unchanged from the start of the migration.
- Not done here, by scope: `CHANGELOG.md` and `docs/ROADMAP.md` still record `uiNumberParse` as
  what phase 7.5 delivered (historical), `.claude/rules/forms.md` still describes the
  `transformedValue` pattern the datepicker and time input still use (tickets 03, 04), and the
  playground still binds this control with `[formField]` (ticket 12). All of them still build.

## Комментарии

**2026-10-04 - сделано, ждёт ревью пользователя.**

- `number-input.ts` больше не импортирует `@angular/forms/signals`. Удалены `transformedValue`,
  питавшийся им `parseValidator`, `validatedControl`, к которому тот цеплялся, и
  `releaseParseValidator`; `registerOnChange` больше не переопределяется.
- Сырой текст теперь живёт только в линкованном сигнале `draft`, источник которого - значение:
  введённый текст держится, пока значение не поменяют снаружи, а `writeValue` сбрасывает его
  явно. По уходу фокуса по-прежнему форматируется, округляется до `maxFractionDigits` и
  обрезается по `min`/`max`.
- Сообщение о разборе идёт через `ownErrors()`, которое базовый класс сливает в
  `errorMessages()` и в `showError()`. Оно возвращается независимо от того, привязана ли
  директива формы, поэтому `invalidState` схлопнулся в базовый `showError()`.
- Неудачный разбор пишет в связанный контрол только `null` и ничего больше: `errors` контрола
  остаются такими, какими их сделали его собственные валидаторы, и форма остаётся валидной.
- Сигнальный хост в спеке удалён. Его кейсы живут на реактивном хосте из `FormGroup` с двумя
  контролами и проверяются через `UiNumberInputHarness`: значение в обе стороны, пределы из
  `min`/`max`, маркер обязательности, disabled из контрола, touched по уходу фокуса, сообщение
  валидатора только при «невалиден и тронут», а также сообщение о разборе.
- Ещё два кейса закрывают то, что раньше страховал удалённый код: неудачный разбор не добавляет
  ключ ошибки в контрол с собственными валидаторами, а значение, записанное из контрола - включая
  `reset()`, пишущий `null` поверх `null`, - убирает текст и сообщение. Если убрать
  `draft.set(null)` из `writeValue`, второй кейс падает, то есть страховка настоящая.
- Абзац README про `ui-number-input` описывал удалённую ошибку `uiNumberParse` и пример на
  Signal Forms - оба исправлены. Остальная документация по формам - тикет 20.
- Зелёное: `ng lint`, `tsc --noEmit` по спек-проекту, полный набор библиотеки (690 тестов, 68
  файлов), тесты playground, `ng build ui-kit` и `ng build playground`. Покрытие
  96.09 / 93.22 / 93.4 / 98.00 - как в начале миграции.
- Сознательно вне объёма: `CHANGELOG.md` и `docs/ROADMAP.md` по-прежнему фиксируют
  `uiNumberParse` как результат фазы 7.5 (это история), `.claude/rules/forms.md` описывает
  паттерн `transformedValue`, которым ещё пользуются датапикер и поле времени (тикеты 03, 04), а
  playground всё ещё связывает контрол через `[formField]` (тикет 12). Всё это собирается.
