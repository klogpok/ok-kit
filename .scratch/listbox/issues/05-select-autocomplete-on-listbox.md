# 05: select, multi-select and autocomplete on the listbox

**Status:** done
**Blocked by:** 04

`select`, `multi-select` and `autocomplete` extend `UiFormControlBase` directly and use the listbox
controller. `UiOptionPanel` and `select-base.ts` keyboard code go away; chips, select all and
clearable stay in `select`. `select/public-api.ts` drops `ɵUiOptionPanel`, `ɵUiOptionParent` and
`ɵUiItemOption`.

- [x] Existing specs of select, multi-select, autocomplete, `form-field/forms-interop.spec.ts` and
  the harness specs stay green; adapt only tests that reach into removed internals.
- [x] The decisions in `DECISIONS.md` hold: a click opens without an active option, a selected
  value stays inactive on a click, multi-select options keep the plain text color.
- [x] Visual baselines unchanged except the class rename, if it shows.
- [x] Commits per field: `refactor(select): ...`, `refactor(autocomplete): ...`.

## Comments

**2026-10-11 - done.** Commits `refactor(autocomplete): use the listbox controller`,
`refactor(select): use the listbox controller`, `refactor(select): remove the option parent bridge`.

- `ui-autocomplete` extends `UiFormControlBase` and calls `injectListbox()` with `mode: 'freeText'`,
  `activateOnOpen: false` and `showEmpty` (pick-only with typed text; replaces `panelShown`). Its
  `onKeydown` is `listbox.handleKeydown()`; when that returns false, Escape clears the field.
- `ui-select` / `ui-multi-select` keep one small shared base, `UiSelectBase` (an abstract directive
  on `UiFormControlBase`: the trigger, chips, clear button, search text and the common inputs), because
  both render `select.html`. Each field creates its listbox with
  `injectListbox({ ...this.listboxConfig(), isSelected, select })`; multi-select adds `multiple`,
  `isIndeterminate`, `isBlocked` and `alwaysShown` there. "Select all" is a `uiListboxLeading` row.
  The keyboard code of `select-base.ts` and `option-panel.ts` are gone.
- All three render `ui-listbox` inside `uiDropdownPanel` (no own `cdkConnectedOverlay`); the
  `panel.styles` include left their stylesheets. `.ui-select__panel--virtual .ui-select__all-row` is now
  `.ui-listbox--virtual .ui-select__all-row`.
- After ticket 06 merged, nothing used `UiOptionParent` or `select/_panel.scss`: both are removed, and
  `select/public-api.ts` exports only `UiOption`, `UiOptionGroup`, `UiOptionItem`, the selects. CHANGELOG
  has the class rename and the removed `ɵ` exports.
- Tests: the only adapted test is the loading-row class in `select.spec.ts`
  (`.ui-select__loading` → `.ui-listbox__loading`). Full suite 960 green, lint and format clean,
  `pnpm build` passes, visual 306 stories × 3 modes unchanged, `test-storybook` for select and
  autocomplete clean.

## Русский перевод

# 05: select, multi-select и autocomplete на listbox

**Статус:** сделано
**Зависит от:** 04

`select`, `multi-select` и `autocomplete` наследуют `UiFormControlBase` напрямую и используют
контроллер listbox. `UiOptionPanel` и код клавиатуры в `select-base.ts` уходят; чипсы, «выбрать
все» и clearable остаются в `select`. `select/public-api.ts` убирает `ɵUiOptionPanel`,
`ɵUiOptionParent` и `ɵUiItemOption`.

- [x] Существующие spec select, multi-select, autocomplete, `form-field/forms-interop.spec.ts` и
  spec harness'ов зелёные; правятся только тесты, которые лезут в удалённые внутренности.
- [x] Решения из `DECISIONS.md` сохраняются: клик открывает без active option, выбранное значение
  неактивно при клике, опции multi-select сохраняют обычный цвет текста.
- [x] Визуальные снимки не меняются, кроме переименования класса, если оно видно.
- [x] Коммиты по полю: `refactor(select): ...`, `refactor(autocomplete): ...`.

## Комментарии

**2026-10-11 - сделано.** Коммиты `refactor(autocomplete): use the listbox controller`,
`refactor(select): use the listbox controller`, `refactor(select): remove the option parent bridge`.

- `ui-autocomplete` наследует `UiFormControlBase` и вызывает `injectListbox()` с `mode: 'freeText'`,
  `activateOnOpen: false` и `showEmpty` (pick-only с набранным текстом; заменяет `panelShown`).
  `onKeydown` — это `listbox.handleKeydown()`; если он вернул false, Escape очищает поле.
- У `ui-select` / `ui-multi-select` осталась одна небольшая общая база `UiSelectBase` (абстрактная
  директива на `UiFormControlBase`: trigger, чипсы, кнопка очистки, текст поиска и общие inputs), потому
  что оба рендерят `select.html`. Каждое поле создаёт listbox через
  `injectListbox({ ...this.listboxConfig(), isSelected, select })`; multi-select добавляет там
  `multiple`, `isIndeterminate`, `isBlocked` и `alwaysShown`. «Выбрать все» — строка `uiListboxLeading`.
  Код клавиатуры из `select-base.ts` и `option-panel.ts` удалены.
- Все три рендерят `ui-listbox` внутри `uiDropdownPanel` (без своего `cdkConnectedOverlay`); include
  `panel.styles` ушёл из их стилей. `.ui-select__panel--virtual .ui-select__all-row` стал
  `.ui-listbox--virtual .ui-select__all-row`.
- После слияния тикета 06 `UiOptionParent` и `select/_panel.scss` никто не использует: оба удалены,
  `select/public-api.ts` экспортирует только `UiOption`, `UiOptionGroup`, `UiOptionItem` и селекты. В
  CHANGELOG — переименование класса и удалённые `ɵ`-экспорты.
- Тесты: поправлен только класс строки загрузки в `select.spec.ts` (`.ui-select__loading` →
  `.ui-listbox__loading`). Весь набор 960 зелёный, lint и format чистые, `pnpm build` проходит,
  visual 306 историй × 3 режима без изменений, `test-storybook` для select и autocomplete чистый.
