# 01: leading actions in the listbox controller and `ui-listbox`

**Status:** ready-for-agent

Spec: `../spec.md`, decisions 1–5 and 7.

The listbox controller gains the two leading actions as data, next to the existing hooks, so
`select` keeps working until ticket 02 switches it.

- An optional config part for "create": whether the field can create now, the selected values,
  and the `create(text)` handler. The controller derives the text from `filterText` and the rule
  of decision 4.
- An optional config part for "select all": whether it is on, and the `selectAll(values, on)`
  handler. The controller derives the options it acts on, the checked and partially checked state
  and whether it is shown (decision 5).
- Each shown action is an entry in the keyboard order before the options, with an id derived from
  `panelId()`, never disabled or blocked, never hidden by the search. "Add «…»" is passed over by
  `activateFirst()` while another option follows, and keeps `noResults()` false.
- When the search text changes and "Add «…»" appears, the active option follows the same rule as
  today without any render wait: Enter right after typing adds the text.
- `ui-listbox` renders the shown actions in `.ui-listbox__actions` (`.ui-listbox__create`,
  `.ui-listbox__select-all`) with labels from `UI_LABELS`; the row sticks over a virtual list as
  `.ui-select__leading` does today. One `aria-setsize`/`aria-posinset` computation covers actions
  and items.
- `listbox.spec.ts`: tests through its test field for every rule above, written first.

- [ ] Tests for both actions in `listbox.spec.ts`, red before the implementation.
- [ ] The existing specs of select, multi-select, autocomplete and time stay green.
- [ ] Lint, format and `pnpm build` pass.
- [ ] Commit `feat(listbox): leading actions`.

## Comments

## Русский перевод

# 01: leading actions в контроллере listbox и `ui-listbox`

**Статус:** ready-for-agent

Спека: `../spec.md`, решения 1–5 и 7.

Контроллер listbox получает два leading action как данные, рядом с существующими хуками, чтобы
`select` работал, пока тикет 02 его не переключит.

- Необязательная часть конфига для «создать»: может ли поле создавать сейчас, выбранные значения и
  обработчик `create(text)`. Контроллер выводит текст из `filterText` по правилу решения 4.
- Необязательная часть конфига для «выбрать все»: включено ли оно и обработчик
  `selectAll(values, on)`. Контроллер выводит опции, на которые оно действует, состояние «отмечено»
  и «частично отмечено» и показано ли оно (решение 5).
- Каждое показанное действие — запись в порядке клавиатуры перед опциями, с id, производным от
  `panelId()`; оно никогда не disabled и не blocked и не скрывается поиском. `activateFirst()`
  пропускает «Добавить «…»», пока за ним есть другая опция, и при нём `noResults()` равно false.
- Когда текст поиска меняется и появляется «Добавить «…»», active option следует тому же правилу,
  что и сейчас, без ожидания рендера: Enter сразу после ввода добавляет текст.
- `ui-listbox` рендерит показанные действия в `.ui-listbox__actions` (`.ui-listbox__create`,
  `.ui-listbox__select-all`) с подписями из `UI_LABELS`; строка прилипает над виртуальным списком,
  как сейчас `.ui-select__leading`. Один расчёт `aria-setsize`/`aria-posinset` покрывает действия и
  items.
- `listbox.spec.ts`: тесты через его тестовое поле на каждое правило выше, написанные первыми.

- [ ] Тесты обоих действий в `listbox.spec.ts`, красные до реализации.
- [ ] Существующие spec select, multi-select, autocomplete и time остаются зелёными.
- [ ] Lint, format и `pnpm build` проходят.
- [ ] Коммит `feat(listbox): leading actions`.
