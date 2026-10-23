# 03: `ui-time-input` sets `aria-readonly`; `[uiComboboxControl]` owns it

**Status:** ready-for-agent
**Blocked by:** 02

Spec: `../spec.md` → "Further Notes". Found while comparing the four popup listbox fields; the
refactor of tickets 01–02 keeps today's DOM, so this ticket closes the gap after them.

**Answer (2026-10-23):** option 1 — add `aria-readonly` to `ui-time-input` like the other fields,
and let the directive of ticket 01 own it for all four fields.

**Facts:**

- `ui-select` (both controls) and `ui-autocomplete` set `aria-readonly="true"` on the inner
  combobox while `readonly` is on.
- `ui-time-input` has a `readonly` input and sets the native `readOnly` on its input, but sets no
  `aria-readonly`. The listbox stays locked while readonly, as in the other fields.
- The native `readonly` attribute on an `<input>` already exposes the read-only state; on the
  select's `<button>` trigger there is no native readonly, so `aria-readonly` is needed there.
  The user chose consistency: every popup listbox field sets it.

**What to build:**

- `[uiComboboxControl]` binds `aria-readonly` (`'true'` or `null`) from the field's readonly state.
- The templates of select (both controls), multi-select and autocomplete drop their own
  `aria-readonly` binding; the time input gains it through the directive. The native `readOnly` on
  the time input stays.

- [ ] The directive sets `aria-readonly`; no template binds it any more.
- [ ] `ui-time-input` renders `aria-readonly="true"` on its input while readonly and no attribute
      otherwise; a time-input spec covers it.
- [ ] The contract spec in `listbox` covers `aria-readonly` on the test field.
- [ ] The other fields render the same `aria-readonly` as before; their existing specs pass
      without edits.
- [ ] The answer and its reason are recorded in `docs/DECISIONS.md`; `CHANGELOG.md` notes the
      time input change.
- [ ] `/phase-check` passes, visual baselines unchanged; `pnpm sync:client --verify` passes.
- [ ] One commit, `fix(time): ...`.

## Русский перевод

# 03: `ui-time-input` ставит `aria-readonly`; им владеет `[uiComboboxControl]`

**Статус:** ready-for-agent
**Заблокирован:** 02

Spec: `../spec.md` → «Дополнительные заметки». Обнаружено при сравнении четырёх popup listbox
field; рефакторинг тикетов 01–02 сохраняет нынешний DOM, поэтому этот тикет закрывает пробел после
них.

**Ответ (2026-10-23):** вариант 1 — добавить `aria-readonly` в `ui-time-input`, как в других
полях, и отдать владение им директиве из тикета 01 для всех четырёх полей.

**Факты:**

- `ui-select` (оба элемента управления) и `ui-autocomplete` ставят `aria-readonly="true"` на
  внутренний combobox, пока включён `readonly`.
- У `ui-time-input` есть input `readonly`, и он ставит нативный `readOnly` на свой input, но
  `aria-readonly` не ставит. Listbox, пока поле readonly, заблокирован, как и в других полях.
- Нативный атрибут `readonly` на `<input>` уже сообщает состояние «только чтение»; у
  кнопки-триггера select нативного readonly нет, поэтому там `aria-readonly` нужен. Пользователь
  выбрал единообразие: его ставит каждое popup listbox field.

**Что сделать:**

- `[uiComboboxControl]` ставит `aria-readonly` (`'true'` или `null`) из состояния readonly поля.
- Шаблоны select (оба элемента управления), multi-select и autocomplete убирают свою привязку
  `aria-readonly`; time input получает его через директиву. Нативный `readOnly` у time input
  остаётся.

- [ ] Директива ставит `aria-readonly`; ни один шаблон его больше не привязывает.
- [ ] `ui-time-input` отрисовывает `aria-readonly="true"` на своём input, пока поле readonly, и не
      ставит атрибут в остальных случаях; это покрыто спеком time input.
- [ ] Контрактный спек в `listbox` покрывает `aria-readonly` на тестовом поле.
- [ ] Остальные поля отрисовывают тот же `aria-readonly`, что и раньше; их существующие спеки
      проходят без правок.
- [ ] Ответ и его причина записаны в `docs/DECISIONS.md`; в `CHANGELOG.md` отмечено изменение
      time input.
- [ ] `/phase-check` проходит, визуальные baselines не меняются; `pnpm sync:client --verify`
      проходит.
- [ ] Один коммит, `fix(time): ...`.
