# 05: Date range picker keeps its parse errors without Signal Forms

**What to build:** the range picker still reports unreadable text in either end of the range, still
reports a range whose end precedes its start, and does so through its own messages rather than
through Signal Forms.

**Blocked by:** 04 (same entry point; sequencing them avoids conflicting edits)

**Status:** ready-for-human

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

**Статус:** ready-for-human

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
  it marks the single field whose text is wrong; its fallback is now the base's `showError()`
  instead of `parseMessage()`, and the host's `--invalid` class is plain `showError()`.
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
- Green: `pnpm lint`, `pnpm test` (68 files, 694 tests), `pnpm test:playground` (2), `pnpm build`,
  `pnpm build:playground`, and `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit`. The
  date-range-picker spec itself is 24 tests. Coverage was not re-measured for this ticket.
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
- **Re-checked after that fix.** `pnpm lint`, `pnpm test` (68 files, 695 tests),
  `pnpm test:playground` (2), `pnpm build`, `pnpm build:playground` and
  `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit` are green again; the picker spec is now
  25 tests.

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
  помечает ровно то поле, текст которого неверен; его запасной вариант теперь `showError()`
  базового класса вместо `parseMessage()`, а класс `--invalid` на хосте стал просто `showError()`.
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
- Зелёные: `pnpm lint`, `pnpm test` (68 файлов, 694 теста), `pnpm test:playground` (2),
  `pnpm build`, `pnpm build:playground` и `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit`. Сам
  спек пикера - 24 теста. Покрытие для этого тикета заново не измерялось.
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
- **Перепроверено после этой правки.** `pnpm lint`, `pnpm test` (68 файлов, 695 тестов),
  `pnpm test:playground` (2), `pnpm build`, `pnpm build:playground` и
  `tsc -p projects/ui-kit/tsconfig.spec.json --noEmit` снова зелёные; спек пикера теперь 25 тестов.
