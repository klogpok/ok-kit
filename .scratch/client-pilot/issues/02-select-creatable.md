# 02: creatable, maxLength and the closed-search cursor on select

**Status:** ready-for-agent
**Blocked by:** None

Upstream patches 5–7 of the client's vendored kit
(`client/src/app/pages/dashboard/apartment-changes-new/ok-kit/VENDORED.md`), so
`price-quotes-case` can move to `ui-select` (ticket 06). Its use:
`<ok-select searchable creatable clearable size="sm" [maxLength] [formControl]>` over a list of
strings. Read the vendored `select/select-base.ts`, `select.ts`, `multi-select.ts` and
`select.scss` as the reference behavior, but build on the current listbox controller
(`ɵinjectListbox`), not on the old option panel.

- [ ] `creatable` on `ui-select` and `ui-multi-select` (shared through `UiSelectBase`): with search
  text that matches no option, the list shows an "Add «…»" option (new label in `UiLabels`, Hebrew
  default and English); choosing it sets or adds the typed string as the value. A string value that
  is not in the list shows as its own label. Requires `searchable`; document what happens without
  it.
- [ ] `maxLength` on the search input (`[attr.maxlength]`), so a created value fits its column.
- [ ] The search input of a closed searchable `ui-select` shows the trigger's `pointer` cursor;
  `text` returns once the list is open.
- [ ] Keyboard and ARIA: the add option is a normal option for the key manager,
  `aria-activedescendant` and the live announcement; Enter on it creates. Virtual mode (`items`
  over `virtualThreshold`) works too.
- [ ] Specs (Reactive, `formControlName`, `ngModel`), stories, harness support if the harness needs
  to see the add option, README and CHANGELOG.
- [ ] Commit `feat(select): creatable options and maxLength`.

## Русский перевод

# 02: creatable, maxLength и курсор закрытого поиска у select

**Статус:** ready-for-agent
**Зависит от:** нет

Перенести в кит патчи 5–7 вендорной копии клиента
(`client/src/app/pages/dashboard/apartment-changes-new/ok-kit/VENDORED.md`), чтобы
`price-quotes-case` перешёл на `ui-select` (тикет 06). Как он используется:
`<ok-select searchable creatable clearable size="sm" [maxLength] [formControl]>` над списком
строк. Эталон поведения — вендорные `select/select-base.ts`, `select.ts`, `multi-select.ts` и
`select.scss`, но строить на текущем контроллере listbox (`ɵinjectListbox`), а не на старой панели
опций.

- [ ] `creatable` у `ui-select` и `ui-multi-select` (общий код в `UiSelectBase`): если текст поиска
  не совпал ни с одной опцией, в списке есть опция «Добавить «…»» (новый label в `UiLabels`,
  иврит по умолчанию и английский); выбор ставит или добавляет набранную строку в значение.
  Строковое значение вне списка показывается своим текстом. Требует `searchable`; описать, что
  происходит без него.
- [ ] `maxLength` у поля поиска (`[attr.maxlength]`), чтобы созданное значение влезало в колонку.
- [ ] Поле поиска закрытого `ui-select` с поиском показывает курсор `pointer`, как у триггера;
  `text` возвращается при открытом списке.
- [ ] Клавиатура и ARIA: опция добавления — обычная опция для key manager,
  `aria-activedescendant` и live-объявления; Enter на ней создаёт значение. Виртуальный режим
  (`items` больше `virtualThreshold`) тоже работает.
- [ ] Спеки (Reactive, `formControlName`, `ngModel`), stories, поддержка в harness, если ему нужно
  видеть опцию добавления, README и CHANGELOG.
- [ ] Коммит `feat(select): creatable options and maxLength`.
