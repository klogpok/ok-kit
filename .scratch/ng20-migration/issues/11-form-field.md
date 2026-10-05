# 11: The form field shows reactive forms errors in its spec and its stories

**What to build:** the form field's own proof that it renders a label, a hint, a required marker
and an error at the right moment is written against reactive forms, and the story that demonstrates
validation to a reader of the component library demonstrates it the way consumers will actually
write it.

**Blocked by:** 01

**Status:** ready-for-human

- [x] The Signal Forms host is removed from the form field spec
- [x] The reactive forms host asserts: the label association, the required marker, the hint, the error appearing only when the control is invalid and touched, the error text coming from the validator, and the accessible description linking the control to its hint and error
- [x] The form field stories no longer use Signal Forms and demonstrate validation with a reactive form instead
- [x] The stories still cover the same states, so that no visual baseline is removed by this ticket
- [x] Assertions go through the existing harnesses

## Русский перевод

# 11: Поле формы показывает ошибки реактивных форм в спеке и в сторис

**Что сделать:** собственное доказательство поля формы — что оно рисует метку, подсказку, маркер
обязательности и ошибку в нужный момент — написано на реактивных формах, а стори, демонстрирующая
валидацию читателю витрины, демонстрирует её так, как её реально будут писать потребители.

**Блокируется:** 01

**Статус:** ready-for-human

- [x] Сигнальный хост удалён из спека поля формы
- [x] Реактивный хост проверяет: связь метки с контролом, маркер обязательности, подсказку, появление ошибки только когда контрол невалиден и тронут, текст ошибки из валидатора и доступное описание, связывающее контрол с подсказкой и ошибкой
- [x] Стори поля формы больше не используют Signal Forms и демонстрируют валидацию на реактивной форме
- [x] Стори покрывают те же состояния, поэтому этот тикет не удаляет ни одного визуального бейслайна
- [x] Проверки идут через существующие харнессы

## Comments

**2026-10-05 - done, waiting for the user's review.**

- `ui-form-field` itself was not touched. It never imported Signal Forms: it reads the forms layer
  through `UI_FORM_FIELD_CONTROL`, so the whole ticket is the spec and the stories.
- The spec's `SignalHost` is gone. The reactive host is now a `FormGroup` of two fields, so that
  both ways of getting an error text are covered side by side:
  - **Email** has `Validators.required` and projects `<ui-error>Email is required</ui-error>`
    under an `@if`, the way a consumer writes it;
  - **Name** has `[Validators.required, enterYourName]` and projects nothing. `enterYourName`
    returns `{ nameRequired: 'Name is required' }`, the string-valued error convention
    `messagesFromErrors()` already reads, so the text comes from the validator.
    `Validators.required` stays in the list on purpose: the required marker reads
    `hasValidator(Validators.required)` by identity, so a message-carrying validator cannot replace
    it.
- The two cases of the removed Signal Forms host moved over: "binds the value both ways" is now
  "binds the value both ways and clears the error once valid" on Name, and "marks required and
  shows validator messages after touch" is "shows the message of the validator when no ui-error is
  projected".
- Assertions go through `UiInputHarness` (`getLabel`, `getId`, `isRequired`, `isInvalid`,
  `isDisabled`, `getValue`, `setValue`, `blur`). There is no harness for `ui-form-field` itself,
  so the hint, the error region and `aria-describedby` are read with `fieldOf(label)` helpers that
  scope the query to the one field, the same shape `time-input.spec.ts` uses for `errorOf()`.
- The error is asserted to appear **only** when invalid **and** touched from both sides: untouched
  and invalid shows the hint and `ui-form-field__error--empty`; touched and invalid shows the
  error, hides the hint and points `aria-describedby` at the error; typing a valid value points it
  back at the hint.
- The guard was verified by hand: changing the expected validator text to `'WRONG'` fails exactly
  that test and nothing else, so the assertion really reads the rendered message.
- Stories: `SignalFormStory` became `AccountFormStory`, a `FormGroup` bound with
  `formControlName`. `withMessage(validator, text)` wraps a validator so its error value is the
  message, which is how the three Signal Forms `message:` options were carried over.
  `Validators.requiredTrue` replaces `required(p.terms)`, and the JSON preview reads `form.value`,
  which prints the same keys in the same order as the old model signal.
- **The export name `SignalForms` was kept.** Storybook derives the story id from the export name,
  and `check-visual.mjs` fails with "baseline of a removed story" for a baseline whose story id no
  longer exists. Renaming the export would therefore delete
  `forms-form-field--signal-forms.{light-ltr,light-rtl,dark-rtl}.png`, which this ticket must not
  do. The story is displayed as **"Account form"** through the `name` field instead, so the
  workbench no longer advertises Signal Forms. **Decision for the user:** the export name and the
  baseline file names still read `signal-forms`; renaming them belongs with ticket 18, which owns
  the baselines, if it is wanted at all.
- No baseline changed. `pnpm test-visual --filter form-field` compared the 6 form-field stories in
  3 modes and reported "No visual changes", so the reactive account form renders pixel for pixel
  like the Signal Forms one. `pnpm test-storybook --filter form-field` reports no accessibility
  violations and no console errors.
- Green: `ng test ui-kit --watch=false` (68 files, 696 tests), `pnpm lint`, `pnpm build-storybook`,
  and `tsc -p projects/ui-kit/.storybook/tsconfig.json --noEmit`. The form-field spec itself is 18
  tests, the same count as before: 2 Signal Forms tests out, 2 reactive ones in.

### Left for other tickets

- **Ticket 13 (remove Signal Forms from core).** The class comment of `UiFormField`
  (`form-field.ts:63`) and `projects/ui-kit/README.md:160` still describe the Signal Forms path
  ("messages from validators are shown automatically"). Both are still true: `injectControlState()`
  keeps the `FORM_FIELD` branch until ticket 13 removes it. Editing them here would have made the
  docs describe a library that does not exist yet.
- **Ticket 18 (visual baselines).** The `signal-forms` story id and its three baseline files, as
  above.

## Комментарии

**2026-10-05 - сделано, ждёт ревью пользователя.**

- Сам `ui-form-field` не трогали. Он никогда не импортировал Signal Forms: он читает слой форм
  через `UI_FORM_FIELD_CONTROL`, поэтому весь тикет - это спек и стори.
- `SignalHost` в спеке удалён. Реактивный хост теперь `FormGroup` из двух полей, чтобы оба способа
  получить текст ошибки были видны рядом:
  - **Email** - `Validators.required` и спроецированный `<ui-error>Email is required</ui-error>`
    под `@if`, ровно так, как это пишет потребитель;
  - **Name** - `[Validators.required, enterYourName]` и ничего спроецированного. `enterYourName`
    возвращает `{ nameRequired: 'Name is required' }` - то самое соглашение про строковое значение
    ошибки, которое уже читает `messagesFromErrors()`, так что текст приходит из валидатора.
    `Validators.required` оставлен в списке намеренно: маркер обязательности читает
    `hasValidator(Validators.required)` по идентичности, поэтому валидатор с сообщением его не
    заменяет.
- Два кейса удалённого сигнального хоста переехали: «binds the value both ways» стал «binds the
  value both ways and clears the error once valid» на поле Name, а «marks required and shows
  validator messages after touch» - «shows the message of the validator when no ui-error is
  projected».
- Проверки идут через `UiInputHarness` (`getLabel`, `getId`, `isRequired`, `isInvalid`,
  `isDisabled`, `getValue`, `setValue`, `blur`). Харнесса у самого `ui-form-field` нет, поэтому
  подсказка, область ошибки и `aria-describedby` читаются хелперами `fieldOf(label)`, которые
  сужают запрос до одного поля, - той же формы, что `errorOf()` в `time-input.spec.ts`.
- Появление ошибки **только** при «невалиден **и** тронут» проверяется с обеих сторон: нетронутый
  и невалидный показывает подсказку и `ui-form-field__error--empty`; тронутый и невалидный
  показывает ошибку, прячет подсказку и переводит `aria-describedby` на ошибку; ввод валидного
  значения возвращает его на подсказку.
- Сторож проверен руками: замена ожидаемого текста валидатора на `'WRONG'` роняет ровно этот тест
  и ничего больше, значит проверка действительно читает отрисованное сообщение.
- Стори: `SignalFormStory` стал `AccountFormStory` - `FormGroup`, связанный через
  `formControlName`. `withMessage(validator, text)` оборачивает валидатор так, что значением
  ошибки становится сообщение; этим перенесены три опции `message:` из Signal Forms.
  `Validators.requiredTrue` заменил `required(p.terms)`, а превью JSON читает `form.value` и
  печатает те же ключи в том же порядке, что и прежний сигнал модели.
- **Имя экспорта `SignalForms` оставлено.** Storybook выводит id стори из имени экспорта, а
  `check-visual.mjs` падает с «baseline of a removed story» для бейслайна, у которого больше нет
  стори. Переименование экспорта удалило бы
  `forms-form-field--signal-forms.{light-ltr,light-rtl,dark-rtl}.png`, чего этот тикет делать не
  должен. Вместо этого стори отображается как **«Account form»** через поле `name`, так что
  витрина больше не рекламирует Signal Forms. **Решение пользователю:** имя экспорта и имена
  файлов бейслайнов по-прежнему содержат `signal-forms`; их переименование - дело тикета 18,
  который владеет бейслайнами, если оно вообще нужно.
- Ни один бейслайн не изменился. `pnpm test-visual --filter form-field` сравнил 6 стори поля формы
  в 3 режимах и сказал «No visual changes» - реактивная форма аккаунта отрисовывается пиксель в
  пиксель как сигнальная. `pnpm test-storybook --filter form-field` не нашёл ни нарушений
  доступности, ни ошибок в консоли.
- Зелёное: `ng test ui-kit --watch=false` (68 файлов, 696 тестов), `pnpm lint`,
  `pnpm build-storybook` и `tsc -p projects/ui-kit/.storybook/tsconfig.json --noEmit`. Сам спек
  поля формы - 18 тестов, столько же, сколько было: 2 сигнальных ушли, 2 реактивных пришли.

### Оставлено другим тикетам

- **Тикет 13 (убрать Signal Forms из core).** Комментарий к классу `UiFormField`
  (`form-field.ts:63`) и `projects/ui-kit/README.md:160` всё ещё описывают сигнальный путь
  («сообщения валидаторов показываются автоматически»). Оба пока верны: `injectControlState()`
  сохраняет ветку `FORM_FIELD`, пока её не уберёт тикет 13. Правка здесь заставила бы документацию
  описывать библиотеку, которой ещё нет.
- **Тикет 18 (визуальные бейслайны).** Id стори `signal-forms` и три его файла бейслайнов, см.
  выше.
