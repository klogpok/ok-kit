# 09: Segmented, button toggle and slider are verified through reactive forms

**What to build:** the same shift of proof for the three selection controls: their forms behaviour
is asserted against reactive forms so that it still holds once Signal Forms is gone.

**Blocked by:** 01

**Status:** ready-for-human

- [x] The Signal Forms host is removed from the segmented, button toggle and slider specs
- [x] For each, the reactive forms host asserts: value in both directions, disabled from the control, readonly, required marker, touched on blur, error shown only when invalid and touched, and the validator's message
- [x] Vertical orientation, Home and End handling, and the slider's keyboard stepping keep their existing coverage
- [x] Assertions go through the existing harnesses, and no new harness or test helper is introduced
- [x] One commit per control

## Comments

**2026-10-05 - done, waiting for the user's review.**

- No component source changed: all three controls already read their forms state through
  `injectControlState()`, so this ticket is three spec files only.
- `segmented.spec.ts`: `SignalHost` is gone. The reactive host now sits in a `ui-form-field`
  (which is what renders the message) and binds `[readonly]="locked()"`, and its cases are
  asserted through `UiSegmentedHarness`: value both ways (click and `setValue()`), arrow-key
  selection, `aria-required` plus the label marker, `disable()`, a readonly control that keeps its
  selection, touch on focus leave, and the validator message shown only once invalid **and**
  touched, then cleared again.
- `button-toggle.spec.ts`: the same, through `UiButtonToggleGroupHarness`. `role="group"` does not
  allow `aria-required`, so the test asserts the attribute is absent and the required marker is in
  the field label instead. Readonly is proved by behaviour - the group harness exposes no
  `isReadonly()`, and no helper was added for it.
- `slider.spec.ts`: `SignalHost` is gone. The three-way binding test (reactive single, reactive
  range, `ngModel`) stays as it was; a second describe puts the single slider in a `ui-form-field`
  and asserts through `UiSliderHarness`: the limits from the `min`/`max` inputs, keyboard stepping
  up and down, `setValue()` back, the required marker, `disable()`, a readonly control that keeps
  its value, touch on focus leave, and the validator message gated on invalid and touched.
- The validator in each host is a plain `ValidatorFn` returning `{ kind: { message } }`, which is
  the reactive-forms convention `injectControlState()` already reads. That is how the Signal Forms
  rule messages are replaced.
- Kept untouched: the segmented standalone host (arrows, RTL mirroring, Home/End, orientation,
  full width, focus), the button toggle standalone host (orientation, full width, focus) and the
  range slider describes (limits, thumbs, marks, pointer, focusout).
- Green: `npx ng test ui-kit --watch=false` before each of the three commits; the suite ends at
  68 files, 706 tests (699 before). `prettier --check` and `eslint` pass on the three files.
- Checked that the new assertions bite: with the segmented message assertion deliberately changed,
  exactly that one test failed with the real message in the diff, so the message really travels
  from the validator to `ui-form-field`.

## Русский перевод

# 09: Segmented, button toggle и слайдер проверяются через реактивные формы

**Что сделать:** тот же перенос доказательства для трёх контролов выбора: их поведение в формах
утверждается на реактивных формах, чтобы оно сохранилось после ухода Signal Forms.

**Блокируется:** 01

**Статус:** ready-for-human

- [x] Сигнальный хост удалён из спеков segmented, button toggle и слайдера
- [x] Для каждого реактивный хост проверяет: значение в обе стороны, disabled от контрола, readonly, маркер обязательности, touched по уходу фокуса, показ ошибки только при «невалиден и тронут» и сообщение валидатора
- [x] Вертикальная ориентация, обработка Home и End и шаг слайдера с клавиатуры сохраняют существующее покрытие
- [x] Проверки идут через существующие харнессы, новых харнессов и тестовых помощников не появляется
- [x] По коммиту на контрол

## Комментарии

**2026-10-05 - сделано, ждёт ревью пользователя.**

- Исходники компонентов не менялись: все три контрола уже читают состояние формы через
  `injectControlState()`, поэтому тикет - это только три файла спеков.
- `segmented.spec.ts`: `SignalHost` удалён. Реактивный хост теперь лежит внутри `ui-form-field`
  (именно он выводит сообщение) и связывает `[readonly]="locked()"`, а его кейсы проверяются через
  `UiSegmentedHarness`: значение в обе стороны (клик и `setValue()`), выбор стрелками,
  `aria-required` плюс маркер в подписи, `disable()`, readonly-контрол, сохраняющий выбор, touched
  по уходу фокуса и сообщение валидатора, показанное только когда контрол невалиден **и** тронут,
  а затем снова скрытое.
- `button-toggle.spec.ts`: то же самое через `UiButtonToggleGroupHarness`. На `role="group"`
  нельзя `aria-required`, поэтому тест проверяет отсутствие атрибута и наличие маркера
  обязательности в подписи поля. Readonly доказывается поведением: у харнесса группы нет
  `isReadonly()`, и помощник для этого не добавлялся.
- `slider.spec.ts`: `SignalHost` удалён. Тест тройной связки (реактивный одиночный, реактивный
  диапазон, `ngModel`) остался как был; второй describe кладёт одиночный слайдер в `ui-form-field`
  и проверяет через `UiSliderHarness`: границы из входов `min`/`max`, шаг с клавиатуры вверх и
  вниз, `setValue()` обратно, маркер обязательности, `disable()`, readonly-контрол, сохраняющий
  значение, touched по уходу фокуса и сообщение валидатора при «невалиден и тронут».
- Валидатор в каждом хосте - обычный `ValidatorFn`, возвращающий `{ kind: { message } }`: это та
  самая конвенция реактивных форм, которую `injectControlState()` уже читает. Так заменяются
  сообщения правил Signal Forms.
- Не тронуты: standalone-хост segmented (стрелки, зеркалирование в RTL, Home/End, ориентация,
  полная ширина, фокус), standalone-хост button toggle (ориентация, полная ширина, фокус) и
  describe-блоки range-слайдера (границы, ползунки, метки, указатель, focusout).
- Зелёные: `npx ng test ui-kit --watch=false` перед каждым из трёх коммитов; суммарно 68 файлов,
  706 тестов (было 699). `prettier --check` и `eslint` на трёх файлах проходят.
- Проверено, что новые проверки действительно кусаются: при намеренно изменённом ожидании
  сообщения в segmented падал ровно этот тест, и в диффе было настоящее сообщение, - значит оно
  реально доходит от валидатора до `ui-form-field`.
