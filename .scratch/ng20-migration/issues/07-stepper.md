# 07: Stepper tracks step completion through reactive forms only

**What to build:** a stepper whose steps each carry a reactive form group still marks a step done
when that group becomes valid, still blocks forward movement when the step requires validity, and
no longer accepts a Signal Forms field as a step's control.

**Blocked by:** 01

**Status:** ready-for-human

- [x] The stepper no longer imports anything from the Signal Forms package
- [x] The public type of a step's control is a reactive control, with the union and the field branch removed
- [x] Step validity is read from the reactive control and updates as the control's own events fire
- [x] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [x] Linear and non-linear modes, completed state set by hand, orientation and keyboard navigation are unchanged

## Русский перевод

# 07: Степпер отслеживает завершённость шага только через реактивные формы

**Что сделать:** степпер, у которого на каждом шаге реактивная группа, по-прежнему помечает шаг
выполненным, когда группа становится валидной, по-прежнему блокирует движение вперёд там, где шаг
требует валидности, и больше не принимает сигнальное поле в качестве контрола шага.

**Блокируется:** 01

**Статус:** ready-for-human

- [x] Степпер больше ничего не импортирует из пакета Signal Forms
- [x] Публичный тип контрола шага — реактивный контрол, объединение типов и ветка поля удалены
- [x] Валидность шага читается из реактивного контрола и обновляется по его собственным событиям
- [x] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [x] Линейный и нелинейный режимы, завершённость, выставленная вручную, ориентация и навигация с клавиатуры не изменились

## Comments

**2026-10-05 - done, waiting for the user's review.**

- `stepper.ts` no longer imports `@angular/forms/signals`. `UiStepControl` is `AbstractControl`
  alone, and the `isFieldTree` branches in `valid`, in the subscription effect and in
  `markTouched()` are gone; `markTouched()` is now a single `markAllAsTouched()`. The reactive
  path itself is unchanged: `valid` still reads `control.valid || control.disabled` and still
  ticks on `control.events`.
- The spec's `SignalHost` became `ControlHost`, a `FormControl` with `Validators.required` bound
  through `[formControl]`, and its case (validity blocks Next, a blocked Next marks the control
  touched, a valid control unblocks the step) is asserted there. The host's control is a signal,
  so it can be swapped.
- Real guards (each fails if the fix is reverted):
  - "follows a control that is disabled or swapped for another" covers both the disabled branch
    (a disabled control counts as valid, so it cannot block) and the resubscription in the
    `effect()`. Verified by hand: pinning the effect to the first control with `untracked()`
    makes exactly this test fail, and nothing else.
  - "uses the validity of the control and marks it touched when blocked" is the old Signal Forms
    case, now on the reactive control; it fails if `markTouched()` or the events subscription
    goes.
- The playground had to move with the public type: `phase-eight.ts` builds the wizard as a
  `FormGroup` of `FormGroup`s instead of `form()`, and the summary step reads it through
  `toSignal(valueChanges)`. `phase-eight.html` binds `[formControl]` and projects `<ui-error>`.
- Green: `pnpm lint`, `pnpm test` (68 files, 696 tests), `pnpm test:playground` (2), `pnpm build`,
  `pnpm build:playground`, and `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit`. The stepper
  spec itself is 14 tests. Coverage was not re-measured for this ticket.

### Review findings, and what was done with them

- **Fixed.** The projected `<ui-error>` for the visit date and the visit time were rendered
  unconditionally, and `ui-form-field` drops the control's own `errorMessages()` as soon as any
  `<ui-error>` is projected. That hid the parse messages of `ui-datepicker` and `ui-time-input`
  for good. Both are now projected only for the error they name.
- **Fixed.** The `minDate` branch of the visit date was unreachable: `[min]="today"` makes
  `ui-datepicker` write `null` for a day outside the range, so a custom `notBefore(today)`
  validator could never fire. The validator was removed and `[min]` kept, which also disables the
  earlier days in the calendar.
- **Fixed.** "follows a control that is disabled or swapped for another" did not swap anything.
  The host's control is now a signal and the test moves the step from one control to the other.
- **Left for ticket 12 (playground).** One projected message still swallows a control's own one:
  "Choose the permit period" for a `required` range hides the picker's "invalid date" message,
  because the control is `null` both when the field is empty and when the typed text cannot be
  read, so the host cannot tell them apart. Merging them is not an option - the user decided that
  `ui-form-field` keeps dropping its own messages when a `<ui-error>` is projected. How the
  playground should word a message that covers both is a playground question.
- **Left for ticket 20 (documentation).** `docs/ROADMAP.md:175` still says a step's `control`
  takes `AbstractControl` or `FieldTree`. It sits inside the quoted phase 8 brief, which is a
  historical record, so it was not edited here.

## Комментарии

**2026-10-05 - сделано, ждёт ревью пользователя.**

- `stepper.ts` больше не импортирует `@angular/forms/signals`. `UiStepControl` - это только
  `AbstractControl`, ветки `isFieldTree` в `valid`, в эффекте с подпиской и в `markTouched()`
  убраны; `markTouched()` теперь один вызов `markAllAsTouched()`. Сам реактивный путь не менялся:
  `valid` по-прежнему читает `control.valid || control.disabled` и обновляется по
  `control.events`.
- `SignalHost` в спеке стал `ControlHost` - `FormControl` с `Validators.required`, связанный через
  `[formControl]`; его кейс (валидность блокирует «Далее», заблокированный «Далее» помечает
  контрол touched, валидный контрол разблокирует шаг) проверяется там же. Контрол хоста - сигнал,
  поэтому его можно подменить.
- Настоящие сторожа (каждый падает, если откатить правку):
  - «follows a control that is disabled or swapped for another» покрывает и ветку disabled
    (выключенный контрол считается валидным, значит блокировать не может), и переподписку в
    `effect()`. Проверено руками: если прибить эффект к первому контролу через `untracked()`,
    падает ровно этот тест и больше ничего.
  - «uses the validity of the control and marks it touched when blocked» - прежний кейс Signal
    Forms, теперь на реактивном контроле; падает, если убрать `markTouched()` или подписку на
    события.
- Playground пришлось двигать вместе с публичным типом: `phase-eight.ts` строит визард как
  `FormGroup` из `FormGroup`-ов вместо `form()`, а шаг «Summary» читает его через
  `toSignal(valueChanges)`. `phase-eight.html` связывается через `[formControl]` и проецирует
  `<ui-error>`.
- Зелёные: `pnpm lint`, `pnpm test` (68 файлов, 696 тестов), `pnpm test:playground` (2),
  `pnpm build`, `pnpm build:playground` и `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit`.
  Сам спек степпера - 14 тестов. Покрытие для этого тикета заново не измерялось.

### Находки ревью и что с ними сделано

- **Исправлено.** Проецируемые `<ui-error>` для даты и времени визита выводились безусловно, а
  `ui-form-field` выбрасывает собственные `errorMessages()` контрола, как только спроецирована
  хоть одна `<ui-error>`. Это навсегда скрывало парс-сообщения `ui-datepicker` и `ui-time-input`.
  Теперь каждая проецируется только под свою ошибку.
- **Исправлено.** Ветка `minDate` для даты визита была недостижима: с `[min]="today"`
  `ui-datepicker` пишет `null` для дня вне диапазона, поэтому собственный валидатор
  `notBefore(today)` сработать не мог. Валидатор убран, `[min]` оставлен - он заодно выключает
  ранние дни в календаре.
- **Исправлено.** Тест «follows a control that is disabled or swapped for another» ничего не
  подменял. Контрол хоста стал сигналом, и тест переводит шаг с одного контрола на другой.
- **Оставлено тикету 12 (playground).** Одно проецируемое сообщение всё ещё перебивает
  собственное: «Choose the permit period» для `required` диапазона скрывает сообщение пикера о
  неверной дате, потому что контрол равен `null` и когда поле пустое, и когда набранный текст
  не читается, - хост их не различает. Сливать сообщения нельзя: пользователь решил, что
  `ui-form-field` продолжает выбрасывать собственные сообщения при спроецированной `<ui-error>`.
  Как playground должен сформулировать сообщение, покрывающее оба случая, - вопрос playground.
- **Оставлено тикету 20 (документация).** В `docs/ROADMAP.md:175` всё ещё написано, что `control`
  шага принимает `AbstractControl` или `FieldTree`. Строка лежит внутри процитированного брифа
  фазы 8, то есть в историческом документе, поэтому здесь не правилась.
