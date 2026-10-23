# 05: `ui-date-range-picker` uses the typed text module

**Status:** ready-for-agent
**Blocked by:** 01, 04

Spec: `../spec.md` → "Implementation Decisions": generic typed text, error codes.

**What to build:** the range picker loses its `Draft`, `linkedSignal`, `parseMessage`,
`fieldErrors` source, `commitDraft()` and `setValue()`, and passes its range rules to
`ɵinjectTypedText()` with the two texts as the typed text. It is blocked by 04 only because both
tickets edit the `datepicker` entry point.

- Typed text `T`: `{ start: string; end: string; edited?: 'start' | 'end' }`, as today's
  `RangeText`.
- `parse`: today's `parse()`; an invalid field gives `{ kind: 'invalid', fields }`, an end before
  the start gives `{ kind: 'order', fields }` with the edited field marked, as today. Two blank
  fields give no value and no error.
- `format`: today's `format()`; `valid`: `validRange`; `equals`: `sameRange`.
- `onInput(edge)` builds the texts from `text()` and calls `input()`. Calendar picks, presets and
  Clear call `set()`; `writeValue` calls `write()`; Enter and each field's blur call `commit()`.
- `ownErrors()` maps `kind` to `labels().invalidDate` / `labels().invalidDateRange`; each field's
  `aria-invalid` comes from `error()?.fields`.

- [ ] No `Draft` interface, draft `linkedSignal`, `commitDraft()` or `setValue()` is left in
      `date-range-picker.ts`.
- [ ] The existing range-picker spec and harness pass; any test that asserted blank commit changes
      in the same commit with a note in the commit body.
- [ ] Public inputs, outputs, methods and the rendered DOM are unchanged.
- [ ] `/phase-check` passes, visual baselines unchanged; `pnpm sync:client --verify` passes.
- [ ] One commit, `refactor(datepicker): typed text module in the range picker`.

## Русский перевод

# 05: `ui-date-range-picker` использует module typed text

**Статус:** ready-for-agent
**Заблокирован:** 01, 04

Spec: `../spec.md` → «Решения по реализации»: generic typed text, коды ошибок.

**Что сделать:** range picker теряет свои `Draft`, `linkedSignal`, `parseMessage`, источник
`fieldErrors`, `commitDraft()` и `setValue()` и передаёт свои правила диапазона в
`ɵinjectTypedText()`, где typed text — два текста. Он заблокирован тикетом 04 только потому, что
оба тикета правят entry point `datepicker`.

- Typed text `T`: `{ start: string; end: string; edited?: 'start' | 'end' }`, как нынешний
  `RangeText`.
- `parse`: нынешний `parse()`; неверное поле даёт `{ kind: 'invalid', fields }`, конец раньше
  начала — `{ kind: 'order', fields }` с отмеченным редактированным полем, как сейчас. Два пустых
  поля дают ни значения, ни ошибки.
- `format`: нынешний `format()`; `valid`: `validRange`; `equals`: `sameRange`.
- `onInput(edge)` строит тексты из `text()` и вызывает `input()`. Выбор в календаре, presets и Clear
  вызывают `set()`; `writeValue` вызывает `write()`; Enter и blur каждого поля вызывают `commit()`.
- `ownErrors()` отображает `kind` в `labels().invalidDate` / `labels().invalidDateRange`;
  `aria-invalid` каждого поля берётся из `error()?.fields`.

- [ ] В `date-range-picker.ts` не осталось interface `Draft`, draft `linkedSignal`, `commitDraft()`
      и `setValue()`.
- [ ] Существующие spec и harness range picker проходят; тест, проверявший commit пустого текста,
      меняется в том же коммите с пояснением в теле коммита.
- [ ] Публичные inputs, outputs, методы и отрисованный DOM не изменились.
- [ ] `/phase-check` проходит, visual baselines не изменились; `pnpm sync:client --verify`
      проходит.
- [ ] Один коммит, `refactor(datepicker): typed text module in the range picker`.
