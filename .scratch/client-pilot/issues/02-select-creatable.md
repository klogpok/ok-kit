# 02: creatable, maxLength and the closed-search cursor on select

**Status:** done
**Blocked by:** None

Upstream patches 5–7 of the client's vendored kit
(`client/src/app/pages/dashboard/apartment-changes-new/ok-kit/VENDORED.md`), so
`price-quotes-case` can move to `ui-select` (ticket 06). Its use:
`<ok-select searchable creatable clearable size="sm" [maxLength] [formControl]>` over a list of
strings. Read the vendored `select/select-base.ts`, `select.ts`, `multi-select.ts` and
`select.scss` as the reference behavior, but build on the current listbox controller
(`ɵinjectListbox`), not on the old option panel.

- [x] `creatable` on `ui-select` and `ui-multi-select` (shared through `UiSelectBase`): with search
  text that matches no option, the list shows an "Add «…»" option (new label in `UiLabels`, Hebrew
  default and English); choosing it sets or adds the typed string as the value. A string value that
  is not in the list shows as its own label. Requires `searchable`; document what happens without
  it.
- [x] `maxLength` on the search input (`[attr.maxlength]`), so a created value fits its column.
- [x] The search input of a closed searchable `ui-select` shows the trigger's `pointer` cursor;
  `text` returns once the list is open.
- [x] Keyboard and ARIA: the add option is a normal option for the key manager,
  `aria-activedescendant` and the live announcement; Enter on it creates. Virtual mode (`items`
  over `virtualThreshold`) works too.
- [x] Specs (Reactive, `formControlName`, `ngModel`), stories, harness support if the harness needs
  to see the add option, README and CHANGELOG.
- [x] Commit `feat(select): creatable options and maxLength`.

## Comments

**2026-10-15 - done.** Commits `feat(select): creatable options and maxLength`, the fix-up
`fix(select): creatable stories wait for the fonts before opening` and
`chore(visual): baselines of the creatable select stories`.

- **Where it lives.** `UiSelectBase` has the `creatable` and `maxLength` inputs, `createText`, the
  "Add «…»" option (a `ui-option` of the field's own template with a private `Symbol` value), and
  the hooks `selectedValues()`, `addCreated(text)` and `createBlocked()` that `ui-select` and
  `ui-multi-select` implement, as in the vendored patch 5. It is built on `ɵinjectListbox`: the
  option is a leading option (`viewChildren('createOption, selectAllOption')`) next to "select
  all", in one `ui-select__leading` row (was `ui-select__all-row`), which sticks over a virtual
  list. Two internal hooks were added to `UiListboxConfig`: `passedOver` (`activateFirst()`
  passes over "Add" while another option is shown, so a matching option stays active, as in the
  vendored kit) and `leadingShown` (no "no options" row while "Add" is shown). `alwaysShown`
  moved into the base (it covers "Add" and "select all").
- **Behavior, as in the vendored kit.** "Add" is offered while the trimmed search text equals no
  option label and no selected value's label, ignoring case; `ui-multi-select` hides it once
  `maxSelections` is reached. `ui-select` sets the text and closes; `ui-multi-select` adds it,
  clears the search (and writes `''` into the field itself, for an Enter before the next render)
  and stays open. Enter with no active option while "Add" is shown also adds (an Enter typed
  before "Add" rendered). Leaving the field drops typed text that was not added.
- **Decision: the "own label" rule follows `creatable` alone.** The vendored kit showed a string
  value outside the list as its own label only with `creatable` *and* `searchable`. Here it is
  `creatable` alone: without `searchable` there is no text to add, but a created value written
  by the app still shows instead of an empty trigger. It is done through the listbox's
  `displayWith`, so an app's `displayWith` still wins when it returns a label. Documented in the
  README and the JSDoc. The consumer of ticket 06 always uses `searchable`, so it sees no
  difference.
- **Decision: the Hebrew label isolates the text** (`הוספת «text»` with FSI…PDI around the text), like the file
  labels, so typed Latin text or digits do not reorder the Hebrew; English is `Add «text»`. The
  label key is `create`, the vendored name, so the client's `provideUiLabels` by `LOCALE_ID` keeps
  working.
- **"Live announcement".** There is no `LiveAnnouncer` in the select; a screen reader announces
  the option that `aria-activedescendant` names. "Add" is a real `role="option"` with an id, so it
  is announced like any option, and over `items` it opens the set (`aria-posinset` 1,
  `aria-setsize` counts it; "select all" follows at 2). No separate announcement of the added
  value was added: in `ui-select` the field then shows the value, in `ui-multi-select` the next
  active option is announced.
- **Fixed on the way:** a search that hides every option left the previously active option
  active although hidden, and Enter picked it (also without `creatable`). `activateFirst()` /
  `activateLast()` of the listbox controller now clear such an active option. Spec in
  `select.spec.ts`.
- **Cursor:** `.ui-select__input` inherits the trigger's cursor (`pointer`, `default` while
  readonly, `not-allowed` while disabled); `:host(.ui-select--open)` gives `text`. Measured in Edge:
  `pointer` closed, `text` open.
- **Harness:** `UiSelectHarness.create(text)` searches and clicks the `.ui-select__create`
  option whatever the label language; `getOptions()` already sees the option.
- **Stories:** select `Creatable` (closed, sm, `maxLength` 40, a value outside the list),
  `CreatableAdd` (play: only "Add", active), `ManyOptionsCreatable` (play: 2,000 items, "12",
  ArrowUp to "Add"), multi-select `Creatable` (play: chips, a match stays active under "Add"). The
  play functions await `document.fonts.ready`: a panel opened before the font loaded kept the
  taller trigger of the fallback font and sat 17px low (gotcha added to
  `.claude/rules/storybook.md`). 12 new baselines; no existing baseline changed.
- **Checks (`/phase-check`).** 993 unit tests, coverage 98.68/83.54/94.49/98.68; playground 8;
  310 stories × 3 modes without axe violations or console errors; `test-visual` without changes;
  `test-host-css` 708 captures, the host changes no kit element (the 3 known `expandable-rows`
  captures); `ngc` of the stories clean; the only budget warning is the known
  `ui-kit-embed.scss`. The machine was loaded by other agents: some stories timed out on the
  first runs ("did not finish rendering in 15 s") and passed on a rerun, and
  `data-display-table--wide-with-sticky-columns.light-ltr` failed `test-host-css` twice in a row
  in the full run (the capture without host CSS was half drawn) and passed alone and on the next
  group run. Not in the select; noted as a flaky capture.
- **Browser (Storybook dev server, Edge, light/dark RTL and light LTR):** the closed search field
  has cursor `pointer`, `text` while open; `maxlength` 40; typing "Laundry" and Enter sets it and
  closes; Escape closes and keeps focus in the field; the list is dark in the dark theme; over
  2,000 items "Add" sticks at the top while the list scrolls; in the multi-select ArrowUp + Enter
  adds a chip and the list stays open with an empty search. The only console errors are the dev
  server's `favicon.ico` 404.

## Русский перевод

# 02: creatable, maxLength и курсор закрытого поиска у select

**Статус:** сделано
**Зависит от:** нет

Перенести в кит патчи 5–7 вендорной копии клиента
(`client/src/app/pages/dashboard/apartment-changes-new/ok-kit/VENDORED.md`), чтобы
`price-quotes-case` перешёл на `ui-select` (тикет 06). Как он используется:
`<ok-select searchable creatable clearable size="sm" [maxLength] [formControl]>` над списком
строк. Эталон поведения — вендорные `select/select-base.ts`, `select.ts`, `multi-select.ts` и
`select.scss`, но строить на текущем контроллере listbox (`ɵinjectListbox`), а не на старой панели
опций.

- [x] `creatable` у `ui-select` и `ui-multi-select` (общий код в `UiSelectBase`): если текст поиска
  не совпал ни с одной опцией, в списке есть опция «Добавить «…»» (новый label в `UiLabels`,
  иврит по умолчанию и английский); выбор ставит или добавляет набранную строку в значение.
  Строковое значение вне списка показывается своим текстом. Требует `searchable`; описать, что
  происходит без него.
- [x] `maxLength` у поля поиска (`[attr.maxlength]`), чтобы созданное значение влезало в колонку.
- [x] Поле поиска закрытого `ui-select` с поиском показывает курсор `pointer`, как у триггера;
  `text` возвращается при открытом списке.
- [x] Клавиатура и ARIA: опция добавления — обычная опция для key manager,
  `aria-activedescendant` и live-объявления; Enter на ней создаёт значение. Виртуальный режим
  (`items` больше `virtualThreshold`) тоже работает.
- [x] Спеки (Reactive, `formControlName`, `ngModel`), stories, поддержка в harness, если ему нужно
  видеть опцию добавления, README и CHANGELOG.
- [x] Коммит `feat(select): creatable options and maxLength`.

## Комментарии

**2026-10-15 - сделано.** Коммиты `feat(select): creatable options and maxLength`, исправление
`fix(select): creatable stories wait for the fonts before opening` и
`chore(visual): baselines of the creatable select stories`.

- **Где живёт.** В `UiSelectBase` — inputs `creatable` и `maxLength`, `createText`, опция
  «Добавить «…»» (`ui-option` собственного шаблона поля с приватным значением-`Symbol`) и хуки
  `selectedValues()`, `addCreated(text)` и `createBlocked()`, которые реализуют `ui-select` и
  `ui-multi-select`, как в вендорном патче 5. Построено на `ɵinjectListbox`: опция — ведущая
  (`viewChildren('createOption, selectAllOption')`) рядом с «выбрать все», в одной строке
  `ui-select__leading` (было `ui-select__all-row`), которая прилипает над виртуальным списком. В
  `UiListboxConfig` добавлены два внутренних хука: `passedOver` (`activateFirst()` пропускает
  «Добавить», пока видна другая опция, — совпавшая опция остаётся активной, как в вендорном ките) и
  `leadingShown` (нет строки «нет вариантов», пока видна «Добавить»). `alwaysShown` переехал в
  базовый класс (покрывает «Добавить» и «выбрать все»).
- **Поведение — как в вендорном ките.** «Добавить» предлагается, пока обрезанный текст поиска не
  равен (без учёта регистра) ни подписи опции, ни подписи выбранного значения; `ui-multi-select`
  прячет её при достигнутом `maxSelections`. `ui-select` ставит текст и закрывается;
  `ui-multi-select` добавляет его, очищает поиск (и сам пишет `''` в поле — на случай Enter до
  следующего рендера) и остаётся открытым. Enter без активной опции при видимой «Добавить» тоже
  добавляет (Enter, набранный до рендера опции). Уход из поля отбрасывает недобавленный текст.
- **Решение: правило «свой текст» зависит только от `creatable`.** Вендорный кит показывал
  строковое значение вне списка своим текстом только при `creatable` *и* `searchable`. Здесь —
  при одном `creatable`: без `searchable` добавлять нечего, но созданное значение, записанное
  приложением, видно вместо пустого триггера. Сделано через `displayWith` listbox, так что
  `displayWith` приложения побеждает, если возвращает подпись. Описано в README и JSDoc.
  Потребитель тикета 06 всегда с `searchable`, для него разницы нет.
- **Решение: ивритская метка изолирует текст** (FSI…PDI), как метки файлов, чтобы набранная
  латиница или цифры не переставляли иврит; английская — `Add «text»`. Ключ метки — `create`, как
  у вендорной копии, так что `provideUiLabels` по `LOCALE_ID` в клиенте продолжит работать.
- **«Live-объявление».** `LiveAnnouncer` в select нет; скринридер объявляет опцию, на которую
  указывает `aria-activedescendant`. «Добавить» — настоящий `role="option"` с id, она объявляется
  как любая опция, а над `items` открывает набор (`aria-posinset` 1, `aria-setsize` её учитывает;
  «выбрать все» идёт второй). Отдельного объявления добавленного значения нет: в `ui-select` поле
  показывает значение, в `ui-multi-select` объявляется следующая активная опция.
- **Попутно исправлено:** поиск, скрывший все опции, оставлял прежнюю опцию активной, хотя она
  скрыта, и Enter её выбирал (и без `creatable`). `activateFirst()` / `activateLast()`
  контроллера listbox теперь снимают такую активность. Спек в `select.spec.ts`.
- **Курсор:** `.ui-select__input` наследует курсор триггера (`pointer`, `default` при readonly,
  `not-allowed` при disabled); `:host(.ui-select--open)` даёт `text`. Замер в Edge: закрыт —
  `pointer`, открыт — `text`.
- **Harness:** `UiSelectHarness.create(text)` ищет и кликает опцию `.ui-select__create` на любом
  языке метки; `getOptions()` опцию и так видит.
- **Stories:** у select — `Creatable` (закрыт, sm, `maxLength` 40, значение вне списка),
  `CreatableAdd` (play: только «Добавить», активна), `ManyOptionsCreatable` (play: 2000 items,
  «12», ArrowUp на «Добавить»); у multi-select — `Creatable` (play: чипы, совпадение активно под
  «Добавить»). Play-функции ждут `document.fonts.ready`: панель, открытая до загрузки шрифта,
  запоминала более высокий триггер на запасном шрифте и стояла на 17px ниже (gotcha добавлен в
  `.claude/rules/storybook.md`). 12 новых снимков; существующие не изменились.
- **Проверки (`/phase-check`).** 993 unit-теста, coverage 98.68/83.54/94.49/98.68; playground 8;
  310 stories × 3 режима без нарушений axe и ошибок консоли; `test-visual` без изменений;
  `test-host-css` — 708 снимков, хост не меняет ни одного элемента кита (3 известных снимка
  `expandable-rows`); `ngc` stories чистый; единственное предупреждение бюджета — известное
  `ui-kit-embed.scss`. Машину нагружали другие агенты: часть stories на первых прогонах упала по
  таймауту («did not finish rendering in 15 s») и прошла при повторе, а
  `data-display-table--wide-with-sticky-columns.light-ltr` в полном прогоне дважды подряд упал в
  `test-host-css` (снимок без CSS хоста был дорисован наполовину) и прошёл отдельно и при
  следующем прогоне группы. Это не select; отмечено как нестабильный снимок.
- **Браузер (dev-сервер Storybook, Edge, light/dark RTL и light LTR):** у закрытого поля поиска
  курсор `pointer`, у открытого — `text`; `maxlength` 40; «Laundry» + Enter ставит значение и
  закрывает список; Escape закрывает и оставляет фокус в поле; в тёмной теме список тёмный; над
  2000 items «Добавить» прилипает к верху при прокрутке; в multi-select ArrowUp + Enter добавляет
  чип, список остаётся открытым с пустым поиском. В консоли только 404 `favicon.ico` dev-сервера.
