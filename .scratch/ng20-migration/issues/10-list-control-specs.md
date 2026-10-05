# 10: Select, multi-select, autocomplete and chip input are verified through reactive forms

**What to build:** the same shift of proof for the four controls that pick from a list, including
the ones whose value is a collection.

**Blocked by:** 01

**Status:** ready-for-human

- [x] The Signal Forms host is removed from the select, multi-select, autocomplete and chip input specs
- [x] For each, the reactive forms host asserts: value in both directions, disabled from the control, readonly, required marker, touched when the overlay closes or focus leaves, error shown only when invalid and touched, and the validator's message
- [x] For the controls whose value is a collection, a minimum-length validator's message is asserted
- [x] Overlay behaviour, typeahead, option filtering and chip removal keep their existing coverage
- [x] Assertions go through the existing harnesses, and no new harness or test helper is introduced
- [x] One commit per control

## Русский перевод

# 10: Select, multi-select, автокомплит и поле чипов проверяются через реактивные формы

**Что сделать:** тот же перенос доказательства для четырёх контролов, выбирающих из списка, включая
те, у которых значение — коллекция.

**Блокируется:** 01

**Статус:** ready-for-human

- [x] Сигнальный хост удалён из спеков select, multi-select, автокомплита и поля чипов
- [x] Для каждого реактивный хост проверяет: значение в обе стороны, disabled от контрола, readonly, маркер обязательности, touched при закрытии оверлея или уходе фокуса, показ ошибки только при «невалиден и тронут» и сообщение валидатора
- [x] Для контролов, чьё значение — коллекция, проверяется сообщение валидатора минимальной длины
- [x] Поведение оверлея, поиск по набору, фильтрация опций и удаление чипов сохраняют существующее покрытие
- [x] Проверки идут через существующие харнессы, новых харнессов и тестовых помощников не появляется
- [x] По коммиту на контрол

## Comments

**2026-10-05 - done, waiting for the user's review.**

- No production code changed. The four specs no longer import `@angular/forms/signals`, and each
  has one reactive host that carries the whole contract, asserted through `UiSelectHarness`,
  `UiAutocompleteHarness` and `UiChipInputHarness`.
- The message is the same device the earlier tickets used: a `ValidatorFn` whose error value is a
  string, which `injectControlState()` already turns into `errorMessages()`. `Validators.required`
  carries no message, so it is kept only for the required marker, which the harness reads from
  `aria-required` (and the spec also checks the `*` of `ui-form-field`).
- `ui-form-field` drops the control's own messages as soon as a `<ui-error>` is projected, so the
  projected `<ui-error>Choose a city</ui-error>` of the select's old reactive host had to go: the
  message now comes from the validator, and the test still checks it is linked to the trigger
  through `aria-describedby`.
- For the two collection controls (`ui-multi-select`, `ui-chip-input`) the message comes from a
  minimum-length validator, which is what `required` cannot express for a collection - the same
  reason the Signal Forms hosts used `minLength(path, 1)`. Both tests also check the message goes
  once enough is picked.
- `UiSelect`'s readonly cases moved off the Signal Forms `readonly()` rule onto the plain
  `readonly` input, which is what that rule used to bind. The searchable and close-on-readonly
  cases are unchanged.
- The only non-spec change: `UiChipInputHarness.isRequired()`, the three-line twin of the one
  `UiSelectHarness` and `UiAutocompleteHarness` already have, so the required marker is read
  through the harness like everything else. `chip-harness.spec.ts` covers it. No new harness and
  no new helper were introduced.
- Real guards (each fails if the behaviour is reverted): the "only once invalid and touched" test
  of every control asserts `isInvalid()` is `false` and the message empty *before* the blur;
  "disables the trigger from the control" also tries to open the list; "stays focusable but does
  not open while readonly" checks the trigger is not `disabled`.
- Green: `npx ng test ui-kit --watch=false` (68 files, 706 tests, up from 696),
  `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit` and `eslint` over the touched folders.
  Coverage was not re-measured.

### Findings left for someone else

- **Not fixed, out of scope.** `UiChipInput.onKeydown` commits the typed text on Enter (and on a
  separator) without checking `editable()`, unlike `onPaste` and the Backspace branch, which both
  guard it. A real browser hides this: a `readonly` input cannot be typed into, so the text is
  empty. It is reachable only if the field becomes `readonly` while text is already typed - and in
  jsdom, where the harness writes the value directly. The spec now asserts the readonly chips are
  unremovable instead of asserting that nothing can be added. Worth a one-line guard in a ticket
  that is allowed to touch `chip-input.ts`.

## Комментарии

**2026-10-05 - сделано, ждёт ревью пользователя.**

- Продакшен-код не менялся. Четыре спека больше не импортируют `@angular/forms/signals`, и у
  каждого один реактивный хост, несущий весь контракт; проверки идут через `UiSelectHarness`,
  `UiAutocompleteHarness` и `UiChipInputHarness`.
- Сообщение берётся тем же приёмом, что и в предыдущих тикетах: `ValidatorFn`, у которого значение
  ошибки — строка, а `injectControlState()` уже превращает такое в `errorMessages()`.
  У `Validators.required` сообщения нет, поэтому он оставлен только ради маркера обязательности,
  который харнесс читает из `aria-required` (а спек дополнительно проверяет `*` у `ui-form-field`).
- `ui-form-field` выбрасывает собственные сообщения контрола, как только спроецирована `<ui-error>`,
  поэтому спроецированная `<ui-error>Choose a city</ui-error>` из старого реактивного хоста select
  убрана: сообщение теперь даёт валидатор, а тест по-прежнему проверяет, что оно связано с триггером
  через `aria-describedby`.
- Для двух коллекционных контролов (`ui-multi-select`, `ui-chip-input`) сообщение даёт валидатор
  минимальной длины — это то, чего `required` для коллекции выразить не может, ровно по той же
  причине сигнальные хосты использовали `minLength(path, 1)`. Оба теста проверяют и то, что
  сообщение уходит, когда выбрано достаточно.
- Кейсы readonly у `UiSelect` переехали с сигнального правила `readonly()` на обычный инпут
  `readonly`, который это правило и связывало. Кейсы с поиском и закрытием списка при readonly не
  изменились.
- Единственная правка вне спеков: `UiChipInputHarness.isRequired()` — трёхстрочный близнец того,
  что уже есть у `UiSelectHarness` и `UiAutocompleteHarness`, чтобы маркер обязательности читался
  через харнесс, как и всё остальное. Он покрыт в `chip-harness.spec.ts`. Новых харнессов и новых
  помощников не появилось.
- Настоящие сторожа (каждый падает, если откатить поведение): тест «только при невалиден и тронут»
  у каждого контрола проверяет, что `isInvalid()` равен `false`, а сообщение пустое *до* blur;
  «disables the trigger from the control» ещё и пытается открыть список; «stays focusable but does
  not open while readonly» проверяет, что триггер не `disabled`.
- Зелёные: `npx ng test ui-kit --watch=false` (68 файлов, 706 тестов против 696),
  `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit` и `eslint` по затронутым папкам. Покрытие
  заново не измерялось.

### Находки, оставленные другим

- **Не исправлено, вне объёма.** `UiChipInput.onKeydown` фиксирует набранный текст по Enter (и по
  разделителю), не проверяя `editable()`, в отличие от `onPaste` и ветки Backspace, где проверка
  есть. В настоящем браузере это не видно: в `readonly`-инпут нельзя набрать текст, поэтому текст
  пуст. Достижимо только если поле стало `readonly`, когда текст уже набран, — и в jsdom, где
  харнесс пишет значение напрямую. Спек теперь проверяет, что чипы в readonly нельзя удалить,
  вместо проверки, что ничего нельзя добавить. Стоит однострочной защиты в тикете, которому
  разрешено трогать `chip-input.ts`.
