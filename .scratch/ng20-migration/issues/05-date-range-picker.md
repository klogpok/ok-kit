# 05: Date range picker keeps its parse errors without Signal Forms

**What to build:** the range picker still reports unreadable text in either end of the range, still
reports a range whose end precedes its start, and does so through its own messages rather than
through Signal Forms.

**Blocked by:** 04 (same entry point; sequencing them avoids conflicting edits)

**Status:** done

- [x] The control no longer imports anything from the Signal Forms package, including the validation error type
- [x] Raw typed text for both ends is held in signals derived from the value
- [x] A parse failure, and an end-before-start range, produce messages through the control's own error collection
- [x] Neither adds an error to a bound form control
- [x] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [x] Two-month calendar behaviour, hover preview of the range and keyboard navigation are unchanged

## Русский перевод

# 05: Выбор диапазона дат сохраняет ошибки разбора без Signal Forms

**Что сделать:** контрол диапазона по-прежнему сообщает о нечитаемом тексте в любом из концов
диапазона и о диапазоне, конец которого раньше начала, и делает это своими сообщениями, а не через
Signal Forms.

**Блокируется:** 04 (та же точка входа; последовательность избавляет от конфликтующих правок)

**Статус:** сделано

- [x] Контрол больше ничего не импортирует из пакета Signal Forms, включая тип ошибки валидации
- [x] Сырой текст обоих концов держится в сигналах, производных от значения
- [x] Неудачный разбор и диапазон с концом раньше начала дают сообщения через собственную коллекцию ошибок контрола
- [x] Ни то, ни другое не добавляет ошибку в связанный контрол формы
- [x] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [x] Поведение двухмесячного календаря, подсветка диапазона при наведении и навигация с клавиатуры не изменились

## Comments

**2026-10-05 - done, waiting for the user's review.**

- `date-range-picker.ts` no longer imports `@angular/forms` or `@angular/forms/signals`.
  `transformedValue`, `ValidationError`, the `parseValidator` it fed, `validatedControl`,
  `releaseParseValidator()`, the `registerOnChange` override, the `DestroyRef` hook, `errorsOf()`,
  `errorKinds()` and `syncText()` are all gone.
- The typed texts live in the `draft` linked signal alone, sourced from the value; `texts()` falls
  back to the formatted value, exactly as `ui-datepicker` does since ticket 04. `onInput` parses
  the two texts itself and goes through `setValue`, the same path a calendar pick, a preset and
  "Clear" take; each of those drops the draft first. `writeValue` drops the draft outright, which
  is what makes a `reset()` of `null` over `null` clear stale text.
- Both messages - text that is not an allowed date (`invalidDate`) and an end before the start
  (`invalidDateRange`) - now come out of `ownErrors()`, which the base class merges into
  `errorMessages()` and `showError()`. A bound control therefore only ever receives the days the
  picker could read, and gets no error of the picker's own. `invalidState(edge)` stayed, because
  it marks the single field whose text is wrong. Its own body did not change - its fallback was
  already the base's `showError()`. What did change is the host's `--invalid` class, which went
  from `showError() || !!parseMessage()` to plain `showError()`.
- Real guards (each fails if the fix is reverted):
  - "shows text that is not a date without failing the control" and "shows an end before the
    start without failing the control" assert `control.errors === null` and `control.valid` while
    the field shows the Hebrew message - they fail the moment an error reaches the control again.
  - "adds no validator of its own, and leaves none behind" (new `ConditionalHost`) asserts
    `validator === null` on the bound control, on a control the picker was moved away from, and
    after the picker is destroyed. It replaces the old "removes its validator when destroyed".
  - "drops typed text and its message when the control writes a value" covers both a `reset(value)`
    and a `reset()` of `null` over `null`.
  - "drops typed text and its message when a day is picked" covers the calendar path with a bound
    control.
- The spec's two Signal Forms hosts are gone. Their cases - value both ways, the required marker
  and the consumer's required message, touched on blur, disabled from the control, readonly - are
  asserted on a reactive forms host with two pickers, because `ui-form-field` hides its own
  `errorMessages()` as soon as a `<ui-error>` is projected: "Period" carries `Validators.required`
  and the projected message, "Window" is plain and carries the parse and order cases. The readonly
  host now uses plain `readonly` + `[value]` inputs.
- Green: `pnpm lint`, `pnpm test` (68 files, 695 tests), `pnpm test:playground` (2), `pnpm build`,
  `pnpm build:playground`, and `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit`. The
  date-range-picker spec itself is 25 tests. Coverage was not re-measured for this ticket. These
  are the numbers after the `draft` fix recorded below; an earlier pass noted 694 and 24 while the
  model-write case was still red.
- `README.md` lost the `uiDateParse` / `uiDateRangeOrder` paragraph; `.claude/rules/forms.md` lost
  the note about the picker adding a validator and now lists the picker among the fields that keep
  the message to themselves.

### Review findings, and what was done with them

- **Fixed.** `draft` is now sourced from `value()` instead of `range()`, and keeps the text only
  for the very object the draft produced, or for a written value that reads back as the same days.
  A non-null but unreadable value written through the `[value]` model (e.g.
  `{ start: new Date('oops'), end: null }`) therefore drops the stale text and its message, the
  way `ui-datepicker` already did. Real guard: "drops typed text and its message when the model
  writes a value it cannot read" - it fails against the old `range()` source.
- **Left for ticket 20 (documentation).** The README example for the picker still shows
  `[formField]`, and the control table still lists it as `FormValueControl (value)`;
  `CHANGELOG.md` still promises the `uiDateParse` / `uiDateRangeOrder` errors. Those are part of
  the documentation sweep, not of this entry point.
- **Interpretation.** "through the existing harness" was read as the spec's own existing helpers
  (`fieldOf` / `inputs(label)` / `type` / `blur`), the way ticket 04 did it;
  `UiDateRangePickerHarness` was not introduced into this spec, which never used it.
- **Re-checked after that fix.** All six checks above are green again, at the numbers listed
  above.

Second review pass (2026-10-05), after the fix above:

- **Decided by the user: leave as is.** `ui-form-field` drops the control's own
  `errorMessages()` entirely as soon as a `<ui-error>` is projected
  (`hasProjectedErrors() ? [] : ...`, form-field.ts:124, and the behaviour its own doc comment
  describes). Since the parse and order messages now live only in `errorMessages()`, a consumer
  who follows the README pattern and projects a `<ui-error>` never sees `invalidDate` or
  `invalidDateRange`. This is not specific to the range picker: it is the shape of tickets 02-06
  together. The user was asked and chose to keep the current `ui-form-field` behaviour, so no
  merge of own and projected messages is to be added.
- **Lost coverage, left for ticket 14 (value accessor provider).** The deleted test "removes its
  validator when destroyed" also asserted that a consumer's `Validators.required` survives the
  picker's destruction. The new `ConditionalHost` only asserts `validator === null` on controls
  that carry no validator of their own, so that guard is gone. 14 touches the accessor wiring for
  every control and is the right place to assert it once.
- **Dead input in the spec, not fixed.** The "Window" field in `ReactiveHost` still takes
  `[minDate]="min"`, but no reactive-host case exercises it; the out-of-range case
  (`1.1.2027` past `maxDate`) lives only in the `[(value)]` host. The coverage exists, so the
  input was left rather than duplicating the case.
- **Judgement calls, not acted on.** The draft-keeping condition is spelled differently in
  `datepicker.ts` (`sameDay`) and here (`sameRange`), which invites a shared helper in
  `date-utils.ts`; `this.draft.set(null)` repeats before three `setValue(...)` calls; and
  `hasErrors()`, `fieldErrors()` and `parseMessage()` each parse the same
  `draft.parsed` shape. All three mirror `ui-datepicker`, so consistency won over extraction.

## Комментарии

**2026-10-05 - сделано, ждёт ревью пользователя.**

- `date-range-picker.ts` больше не импортирует ни `@angular/forms`, ни `@angular/forms/signals`.
  Исчезли `transformedValue`, `ValidationError`, кормивший их `parseValidator`, `validatedControl`,
  `releaseParseValidator()`, переопределённый `registerOnChange`, хук `DestroyRef`, `errorsOf()`,
  `errorKinds()` и `syncText()`.
- Набранный текст теперь живёт только в linked-сигнале `draft`, производном от значения; `texts()`
  откатывается к отформатированному значению - ровно как в `ui-datepicker` после тикета 04.
  `onInput` сам разбирает оба текста и идёт через `setValue`, тем же путём, что выбор в календаре,
  пресет и «Очистить»; каждый из них сначала сбрасывает черновик. `writeValue` сбрасывает черновик
  безусловно - именно это очищает устаревший текст при `reset()`, когда `null` пишется поверх
  `null`.
- Оба сообщения - текст, который не является допустимой датой (`invalidDate`), и конец раньше
  начала (`invalidDateRange`), - теперь выдаёт `ownErrors()`, а базовый класс вливает их в
  `errorMessages()` и `showError()`. Связанный контрол получает только те дни, которые контрол смог
  прочитать, и ни одной собственной ошибки контрола. `invalidState(edge)` остался, потому что
  помечает ровно то поле, текст которого неверен. Его тело не менялось - запасным вариантом и
  раньше был `showError()` базового класса. Изменился класс `--invalid` на хосте: из
  `showError() || !!parseMessage()` он стал просто `showError()`.
- Настоящие сторожа (каждый падает, если откатить правку):
  - «shows text that is not a date without failing the control» и «shows an end before the start
    without failing the control» проверяют `control.errors === null` и `control.valid` в тот
    момент, когда поле показывает сообщение на иврите, - падают, как только ошибка снова доходит
    до контрола.
  - «adds no validator of its own, and leaves none behind» (новый `ConditionalHost`) проверяет
    `validator === null` на связанном контроле, на контроле, с которого контрол переключили, и
    после уничтожения компонента. Он заменил прежний «removes its validator when destroyed».
  - «drops typed text and its message when the control writes a value» покрывает и `reset(value)`,
    и `reset()` с `null` поверх `null`.
  - «drops typed text and its message when a day is picked» покрывает путь через календарь со
    связанным контролом.
- Оба Signal-Forms-хоста в спеке удалены. Их кейсы - значение в обе стороны, маркер required и
  required-сообщение потребителя, touched по уходу фокуса, disabled от контрола, readonly -
  проверяются на реактивном хосте с двумя пикерами: `ui-form-field` скрывает собственные
  `errorMessages()`, как только в него спроецирован `<ui-error>`, поэтому «Period» несёт
  `Validators.required` и спроецированное сообщение, а «Window» - обычное поле с кейсами разбора и
  порядка. Readonly-хост теперь использует обычные входы `readonly` и `[value]`.
- Зелёные: `pnpm lint`, `pnpm test` (68 файлов, 695 тестов), `pnpm test:playground` (2),
  `pnpm build`, `pnpm build:playground` и `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit`. Сам
  спек пикера - 25 тестов. Покрытие для этого тикета заново не измерялось. Это числа уже после
  правки `draft`, записанной ниже; более ранний проход отметил 694 и 24, когда кейс записи через
  модель был ещё красным.
- Из `README.md` ушёл абзац про `uiDateParse` / `uiDateRangeOrder`; из `.claude/rules/forms.md` -
  заметка о том, что пикер добавляет валидатор, и пикер добавлен в список контролов, которые
  оставляют сообщение себе.

### Находки ревью и что с ними сделано

- **Исправлено.** Источником `draft` теперь служит `value()`, а не `range()`, и текст сохраняется
  только для того самого объекта, который черновик и породил, либо для записанного значения,
  читающегося теми же днями. Не-null, но нечитаемое значение, записанное через модель `[value]`
  (например `{ start: new Date('oops'), end: null }`), теперь сбрасывает устаревший текст и его
  сообщение - так же, как это давно делает `ui-datepicker`. Настоящий страж: «drops typed text and
  its message when the model writes a value it cannot read» - он падает на старом источнике
  `range()`.
- **Оставлено тикету 20 (документация).** Пример в README для пикера всё ещё показывает
  `[formField]`, а таблица контролов всё ещё числит его как `FormValueControl (value)`;
  `CHANGELOG.md` всё ещё обещает ошибки `uiDateParse` / `uiDateRangeOrder`. Это часть
  документационного прохода, а не этой точки входа.
- **Трактовка.** «через существующий харнесс» прочитано как существующие хелперы самого спека
  (`fieldOf` / `inputs(label)` / `type` / `blur`), так же как в тикете 04;
  `UiDateRangePickerHarness` в этот спек не вводился - его там никогда не было.
- **Перепроверено после этой правки.** Все шесть проверок выше снова зелёные, с числами,
  указанными выше.

Второй проход ревью (2026-10-05), уже после правки выше:

- **Решение пользователя: оставить как есть.** `ui-form-field` полностью отбрасывает собственные
  `errorMessages()` контрола, как только спроецирован `<ui-error>`
  (`hasProjectedErrors() ? [] : ...`, form-field.ts:124 - ровно то поведение, которое описано в
  его же doc-комментарии). Поскольку сообщения разбора и порядка теперь живут только в
  `errorMessages()`, потребитель, который следует примеру из README и проецирует `<ui-error>`,
  не увидит ни `invalidDate`, ни `invalidDateRange`. Это не особенность пикера диапазона: так
  устроены тикеты 02-06 вместе. Пользователю задали вопрос, и он выбрал сохранить нынешнее
  поведение `ui-form-field` - слияние собственных и проецируемых сообщений не добавляем.
- **Потерянное покрытие, передано в тикет 14 (value accessor provider).** Удалённый тест
  «removes its validator when destroyed» проверял заодно, что `Validators.required` потребителя
  переживает уничтожение пикера. Новый `ConditionalHost` проверяет только `validator === null`
  на контролах без собственных валидаторов, так что этот сторож пропал. Тикет 14 трогает обвязку
  аксессора у всех контролов и подходит, чтобы проверить это один раз.
- **Мёртвый вход в спеке, не исправлено.** Поле «Window» в `ReactiveHost` по-прежнему принимает
  `[minDate]="min"`, но ни один кейс реактивного хоста его не задействует; кейс выхода за границу
  (`1.1.2027` за `maxDate`) живёт только в хосте с `[(value)]`. Покрытие есть, поэтому вход
  оставили, а кейс не дублировали.
- **Суждения, по которым ничего не делали.** Условие удержания черновика записано по-разному в
  `datepicker.ts` (`sameDay`) и здесь (`sameRange`) - просится общий хелпер в
  `date-utils.ts`; `this.draft.set(null)` повторяется перед тремя вызовами `setValue(...)`;
  `hasErrors()`, `fieldErrors()` и `parseMessage()` разбирают одну и ту же форму
  `draft.parsed`. Все три зеркалят `ui-datepicker`, поэтому консистентность перевесила
  вынесение.
