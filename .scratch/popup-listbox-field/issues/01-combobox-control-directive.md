# 01: `[uiComboboxControl]` sets the combobox ARIA of every popup listbox field

**Status:** ready-for-agent
**Blocked by:** None (can start immediately)

Spec: `../spec.md` → "Implementation Decisions": placement, field token, directive.

**What to build:** the dynamic combobox ARIA of the four popup listbox fields comes from one
directive instead of four hand-written copies. A screen-reader user hears the same expanded state,
active option, required / invalid state and descriptions in `ui-select` (search input and trigger
button), `ui-multi-select`, `ui-autocomplete` and `ui-time-input`; a maintainer changes that
contract in one place.

- A new internal field token in the `listbox` entry point. Each of the four fields provides it
  next to its existing providers (the provider helper comes in ticket 02).
- The internal directive `[uiComboboxControl]` (`ɵUiComboboxControl`) reads the field through the
  token and the listbox controller, and binds on its host: `id`, `aria-label` (`null` when
  empty), `aria-expanded`, `aria-controls` and `aria-activedescendant` (only while the listbox is
  shown), `aria-required` and `aria-invalid` (`'true'` or `null`), `aria-describedby`.
- The four templates apply the directive and drop those bindings. `role`, `aria-haspopup`,
  `aria-autocomplete`, `autocomplete` and `aria-readonly` stay in the templates.

- [ ] The directive and the field token exist in the `listbox` entry point as internal exports.
- [ ] All four fields (both controls of the select) use the directive; none of the eight bindings
      is left in a template.
- [ ] The rendered attributes and values on the host and on the inner control are unchanged
      (order may differ).
- [ ] A new contract spec in `listbox` drives a minimal test field (prior art: `TestField` in the
      listbox spec) and covers the ARIA while closed and while open, required / invalid /
      described-by from a bound form control, and `id` / `aria-label` on the inner control.
- [ ] The existing specs and harnesses of select, multi-select, autocomplete and time input pass
      without edits.
- [ ] `/phase-check` passes, visual baselines unchanged; `pnpm sync:client --verify` passes.
- [ ] One commit, `refactor(listbox): ...`.

## Русский перевод

# 01: `[uiComboboxControl]` ставит ARIA combobox каждого popup listbox field

**Статус:** ready-for-agent
**Заблокирован:** нет (можно начинать сразу)

Spec: `../spec.md` → «Решения по реализации»: размещение, токен поля, директива.

**Что сделать:** динамическая ARIA combobox четырёх popup listbox field берётся из одной директивы
вместо четырёх рукописных копий. Пользователь скринридера слышит одинаковое раскрытое состояние,
активную option, состояние required / invalid и описания в `ui-select` (поле поиска и
кнопка-триггер), `ui-multi-select`, `ui-autocomplete` и `ui-time-input`; мейнтейнер меняет этот
контракт в одном месте.

- Новый внутренний токен поля в entry point `listbox`. Каждое из четырёх полей предоставляет его
  рядом со своими нынешними providers (provider-helper появится в тикете 02).
- Внутренняя директива `[uiComboboxControl]` (`ɵUiComboboxControl`) читает поле через токен и
  контроллер listbox и ставит на свой хост: `id`, `aria-label` (`null`, если пусто),
  `aria-expanded`, `aria-controls` и `aria-activedescendant` (только пока listbox показан),
  `aria-required` и `aria-invalid` (`'true'` или `null`), `aria-describedby`.
- Четыре шаблона применяют директиву и убирают эти привязки. `role`, `aria-haspopup`,
  `aria-autocomplete`, `autocomplete` и `aria-readonly` остаются в шаблонах.

- [ ] Директива и токен поля есть в entry point `listbox` как внутренние экспорты.
- [ ] Все четыре поля (оба элемента управления select) используют директиву; ни одна из восьми
      привязок не осталась в шаблоне.
- [ ] Отрисованные атрибуты и значения на хосте и на внутреннем элементе управления не изменились
      (порядок может отличаться).
- [ ] Новый контрактный спек в `listbox` управляет минимальным тестовым полем (образец: `TestField`
      в спеке listbox) и покрывает ARIA в закрытом и открытом состоянии, required / invalid /
      described-by от привязанного form control и `id` / `aria-label` на внутреннем элементе
      управления.
- [ ] Существующие спеки и harnesses select, multi-select, autocomplete и time input проходят без
      правок.
- [ ] `/phase-check` проходит, визуальные baselines не меняются; `pnpm sync:client --verify`
      проходит.
- [ ] Один коммит, `refactor(listbox): ...`.
