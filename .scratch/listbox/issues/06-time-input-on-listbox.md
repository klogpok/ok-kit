# 06: time-input on the listbox

**Status:** ready-for-agent
**Blocked by:** 04

`time-input.ts` drops its own `ActiveDescendantKeyManager`, `activeId`, open/close, `onAttach`,
`onOutsideClick`, the hand-written `UiOptionOwner` and its `onKeydown` branches for the list, and
uses the listbox controller in free text mode with its slots as `items`. Its draft and typed-text
parsing stay.

- [ ] Existing time-input and harness specs green; skipping unavailable slots still works.
- [ ] Visual baselines unchanged.
- [ ] Commit `refactor(time): use the popup listbox`.

## Русский перевод

# 06: time-input на listbox

**Статус:** ready-for-agent
**Зависит от:** 04

`time-input.ts` убирает свой `ActiveDescendantKeyManager`, `activeId`, open/close, `onAttach`,
`onOutsideClick`, рукописный `UiOptionOwner` и ветки `onKeydown` для списка и использует контроллер
listbox в режиме free text, отдавая слоты как `items`. Черновик и разбор введённого текста остаются.

- [ ] Существующие spec time-input и harness'а зелёные; пропуск недоступных слотов работает.
- [ ] Визуальные снимки не меняются.
- [ ] Коммит `refactor(time): use the popup listbox`.
