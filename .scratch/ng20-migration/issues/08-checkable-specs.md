# 08: Checkbox, switch and radio are verified through reactive forms

**What to build:** nothing changes for a user of these three controls; what changes is that their
forms behaviour is proven against reactive forms instead of Signal Forms, so the proof survives the
removal of Signal Forms from the library.

**Blocked by:** 01

**Status:** done

- [x] The Signal Forms host is removed from the checkbox, switch and radio specs
- [x] For each, the reactive forms host asserts: checked or selected value in both directions, disabled from the control, readonly, required marker, touched on blur, error shown only when invalid and touched, and the validator's message
- [x] Indeterminate state for the checkbox and group navigation for the radio keep their existing coverage
- [x] Assertions go through the existing harnesses, and no new harness or test helper is introduced
- [x] One commit per control

## Русский перевод

# 08: Чекбокс, переключатель и радио проверяются через реактивные формы

**Что сделать:** для пользователя этих трёх контролов не меняется ничего; меняется то, что их
поведение в формах доказывается на реактивных формах, а не на Signal Forms, — и это доказательство
переживёт удаление Signal Forms из библиотеки.

**Блокируется:** 01

**Статус:** сделано

- [x] Сигнальный хост удалён из спеков чекбокса, переключателя и радио
- [x] Для каждого реактивный хост проверяет: значение или отмеченность в обе стороны, disabled от контрола, readonly, маркер обязательности, touched по уходу фокуса, показ ошибки только при «невалиден и тронут» и сообщение валидатора
- [x] Неопределённое состояние чекбокса и навигация по группе радио сохраняют существующее покрытие
- [x] Проверки идут через существующие харнессы, новых харнессов и тестовых помощников не появляется
- [x] По коммиту на контрол

## Comments

**2026-10-05 - done, waiting for the user's review.**

- All three specs are free of `@angular/forms/signals`: the `SignalHost` of the checkbox and the
  radio, the `[formField]` switch inside the shared host, and the three `readonly()` rule hosts
  are gone.
- Each reactive host now sits in a `ui-form-field` with a label and carries a required validator
  (`Validators.requiredTrue` for the checkbox and the switch, `Validators.required` for the radio
  group) plus a validator with a message of its own, the way `ui-number-input` does since ticket 02. The checkbox lost its projected `<ui-error>`: `ui-form-field` drops the control's own
  `errorMessages()` as soon as any `<ui-error>` is projected, and the message is what the case is
  about.
- The seven cases the ticket lists are asserted per control: value or checked in both directions,
  disabled from the control, readonly, the required marker in the form-field label, touched on
  blur (for the radio, only once focus leaves the whole group), the error state shown only when
  the control is invalid _and_ touched, and the validator's message under the field.
- Readonly no longer comes from a Signal Forms rule but from the `readonly` input on a
  `[formControl]`-bound control, which is the only way left to reach that state. Each readonly
  test also asserts that the control is not disabled, so the two states stay distinct.
- Harnesses: the checkbox cases go through `UiCheckboxHarness` (including `isReadonly()`, which
  had no caller before). There is no harness for `ui-switch` or `ui-radio-group`, and none was
  added, so those two specs keep the DOM queries they already used. No test helper was added
  either; the only new locals are two one-line arrow functions per spec that name an element.
- Indeterminate state (checkbox) and group navigation (radio) keep their coverage untouched: the
  standalone indeterminate test, the static-attribute hosts, the shared generated name, the single
  tab stop, `focus()` on the checked or first enabled radio, the form-field label click, and the
  focusout pair that tells a move inside the group from a move out of it.
- Real guards, verified by mutation: dropping `&& this.controlState.touched()` from `showError()`
  in `UiFormControlBase` fails exactly the three new "shows the validator message only once the
  control is invalid and touched" tests (and the pre-existing ones elsewhere), and nothing else.
- One genuine red along the way: the switch test for "checked both ways" failed until a
  `settle()` was added after the user's click. Without it the last rendered value of
  `[checked]` still matches the one the control writes back, so Angular skips the DOM write and
  the input keeps the state the click gave it. The checkbox did not hit this because the CDK
  harness stabilises after every click.
- Green on the merge with `ng20-migration`: `ng test ui-kit --watch=false` (68 files, 709 tests)
  and `ng lint`. The three specs themselves are 15 (checkbox), 11 (switch) and 16 (radio) tests.

## Комментарии

**2026-10-05 - сделано, ждёт ревью пользователя.**

- Все три спека свободны от `@angular/forms/signals`: `SignalHost` чекбокса и радио,
  переключатель с `[formField]` в общем хосте и три хоста с правилом `readonly()` удалены.
- Каждый реактивный хост теперь лежит в `ui-form-field` с подписью и несёт валидатор
  обязательности (`Validators.requiredTrue` для чекбокса и переключателя, `Validators.required`
  для группы радио) плюс валидатор с собственным сообщением - так же, как `ui-number-input` с
  тикета 02. У чекбокса убрана спроецированная `<ui-error>`: `ui-form-field` выбрасывает
  собственные `errorMessages()` контрола, как только спроецирована хоть одна `<ui-error>`, а
  кейс именно про сообщение.
- Семь кейсов из тикета проверяются для каждого контрола: значение или отмеченность в обе
  стороны, disabled от контрола, readonly, маркер обязательности в подписи form-field, touched по
  уходу фокуса (для радио - только когда фокус покидает всю группу), показ ошибки только при
  «невалиден _и_ тронут» и сообщение валидатора под полем.
- Readonly теперь приходит не из правила Signal Forms, а из инпута `readonly` на контроле,
  связанном через `[formControl]`, - другого пути в это состояние не осталось. Каждый
  readonly-тест заодно проверяет, что контрол не disabled, чтобы состояния не слиплись.
- Харнессы: кейсы чекбокса идут через `UiCheckboxHarness` (включая `isReadonly()`, у которого
  раньше не было вызовов). Для `ui-switch` и `ui-radio-group` харнессов нет, и они не заводились,
  поэтому эти два спека сохраняют прежние запросы к DOM. Тестовых помощников тоже не добавлено:
  новые локальные имена - это по паре однострочных стрелок на спек, называющих элемент.
- Неопределённое состояние (чекбокс) и навигация по группе (радио) сохраняют покрытие без правок:
  standalone-тест на indeterminate, хосты со статическими атрибутами, общее сгенерированное
  `name`, одна точка табуляции, `focus()` на выбранной или первой доступной радиокнопке, клик по
  подписи form-field и пара focusout, отличающая перемещение внутри группы от выхода из неё.
- Настоящие сторожа, проверено мутацией: если убрать `&& this.controlState.touched()` из
  `showError()` в `UiFormControlBase`, падают ровно три новых теста «shows the validator message
  only once the control is invalid and touched» (и прежние такие же в других спеках) и больше
  ничего.
- Один честный «красный» по дороге: тест переключателя «checked both ways» падал, пока после
  клика пользователя не появился `settle()`. Без него последнее отрисованное значение
  `[checked]` совпадает с тем, что контрол пишет обратно, Angular пропускает запись в DOM, и
  инпут остаётся в состоянии, которое ему дал клик. У чекбокса этого не случилось, потому что
  харнесс CDK стабилизирует фикстуру после каждого клика.
- Зелёные после слияния с `ng20-migration`: `ng test ui-kit --watch=false` (68 файлов, 709
  тестов) и `ng lint`. Сами спеки - 15 (чекбокс), 11 (переключатель) и 16 (радио) тестов.
