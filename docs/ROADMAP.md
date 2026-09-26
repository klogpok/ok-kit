# План фаз 6–9 @vplans/ui-kit

## Контекст

Фазы 1–5 закрыты. В фазе 5 прошли второй аудит, исправления и тулинг; ответы на ревью применены.

В ките есть:
- базовые контролы, оверлеи, таблица, datepicker;
- токены, тема и RTL;
- проверки: coverage-пороги, `pnpm test-storybook` (axe по всем stories в 3 режимах), ESLint strictTypeChecked.

Приложению VPlans всё ещё не хватает частых блоков: алерты, пустые состояния, drawer, popover, breadcrumbs, выбор строк в таблице, числовой ввод, chips, диапазон дат и т.д. Без них команды пишут одноразовые решения, а SPEC ставит цель это прекратить.

Решения пользователя:
- **Порядок: 6.0 → 6 → 7 → 8 → 9.** В 6.0 сначала визуальная регрессия и каркас `@vplans/ui-kit/testing`, чтобы каждый новый компонент сразу был под защитой. *Фактически фаза 6 сделана раньше 6.0 (2026-09-26, по просьбе пользователя); 6.0 остаётся до фазы 7 и должна покрыть и компоненты фазы 6.*
- **Layout-утилиты** — CSS-классы и SCSS-миксины, не компоненты.
- **Drawer** — часть `@vplans/ui-kit/dialog`.

Каждая фаза идёт по workflow из `CLAUDE.md`:
- один entry point и один коммит на компонент, со спеками и stories;
- полный чеклист проверок;
- браузер в light/dark/RTL;
- отчёт и ожидание одобрения перед следующей фазой.

## Общие правила для всех новых компонентов

Опираются на gotchas из фазы 5.

- Entry point `projects/ui-kit/<name>/` по README → «Adding a component».
- Строка в README exports table, запись в CHANGELOG.
- Токены — только в слое `component.<name>` в `tokens/tokens.json` со ссылками на семантику; затем `pnpm tokens`, контраст проверяется генератором.
- Тексты — новые ключи в `UiLabels` (`core/labels.ts`): иврит по умолчанию, английский в `UI_LABELS_EN`.
- Статические `aria-*` снимать с host-элемента (`'[attr.aria-label]': 'null'`), если роль у внутреннего элемента.
- Оверлеи:
  - направление через `resolveDirection()` при открытии;
  - Escape со `stopPropagation`, чтобы не закрывать окружающий диалог;
  - порядок в top layer задаётся порядком открытия.
- Формконтролы:
  - кастомные — наследовать `UiFormControlBase` (`core/form-control-base.ts`), а для checkbox-подобных — `UiCheckableBase`, это даёт readonly, describedby и required;
  - нативные — `injectControlState()`;
  - Signal Forms напрямую, CVA через `ngControl.valueAccessor`.
- Stories: по одной на состояние, args только там, где шаблон их использует; `pnpm test-storybook` и визуальные снимки должны проходить.

---

## Фаза 6.0 — инфраструктура для следующих фаз

> **Статус (2026-09-26): сделано и одобрено** (решения по умолчанию приняты). Коммиты: `chore(visual)`, `feat(testing)`, `docs` (CLAUDE.md).
>
> - Визуальная регрессия: `scripts/check-visual.mjs` + общий `scripts/storybook-pages.mjs` (сервер, список stories, режимы; `check-stories.mjs` переведён на него). 186 stories × 3 режима = 558 PNG, ~3.7 МБ в `visual/`; полный прогон ~1 м 40 с (4 страницы параллельно). Стабильность: три прогона подряд без различий; подмена снимка ловится, diff пишется в `dist/visual-diff/`.
> - Детерминизм: Edge 1024×768, `reducedMotion: 'reduce'`, `animations: 'disabled'`, `document.fonts.ready`, `he-IL` / Asia/Jerusalem, фиксированная дата 2026-09-25 (`context.clock.setFixedTime`, иначе «сегодня» в календаре меняется каждый день). Снимок охватывает `#storybook-root` и открытые `.cdk-overlay-pane`. При расхождении — один повтор через 500 мс. `--update` пишет только новые/изменённые снимки и удаляет снимки удалённых stories.
> - `@vplans/ui-kit/testing`: `UiHarness` (на базе `ContentContainerComponentHarness`: focus/blur/isFocused на реальном фокусируемом элементе, `getHarness()` внутри), `UiButtonHarness`, `UiInputHarness`, `UiCheckboxHarness`, `UiSelectHarness` + `UiOptionHarness`, `UiDialogHarness` (диалоги и drawer). 25 спеков, coverage testing 99.4/95.1/100/100. `testing/**` убран из exclude в `tsconfig.lib.json`, entry point собирается ng-packagr.
> - README: раздел Testing, строка в таблице exports, правила «harness для нового компонента» и «базовые снимки»; CHANGELOG; чеклист в CLAUDE.md дополнен `pnpm test-visual`.
> - Решения для подтверждения: снимки в git (3.7 МБ); порог 0.1% пикселей (pixelmatch threshold 0.1); viewport 1024×768; фильтр `label` у harnesses сопоставляет `aria-label` или `label[for]` без маркера обязательности; `UiDialogHarness` один на диалоги и drawer (фильтр `drawer`); `UiButtonHarness` находит и icon-button.

1. **Визуальная регрессия** — `scripts/check-visual.mjs` + `pnpm test-visual` / `pnpm test-visual:update`.
   - Переиспользовать сервер и цикл по `index.json` из `scripts/check-stories.mjs`: вынести общий модуль `scripts/storybook-pages.mjs`.
   - Скриншот `#storybook-root` каждой story в light/rtl, dark/rtl, light/ltr: Edge через `playwright-core`, фиксированный viewport, отключённые анимации (`reducedMotion: 'reduce'`), ожидание загрузки шрифтов.
   - Сравнение через `pixelmatch` + `pngjs` (новые devDependencies), порог 0.1%. Базовые снимки лежат в `visual/` в git (оценить размер: около 450 PNG).
   - Diff-картинки пишутся в `dist/visual-diff/`.
2. **Каркас `@vplans/ui-kit/testing`**: новый entry point.
   - Базовый `UiHarness` и первые harnesses: `UiButtonHarness`, `UiInputHarness`, `UiSelectHarness`, `UiCheckboxHarness`, `UiDialogHarness`.
   - Основа — CDK `ComponentHarness`, `TestbedHarnessEnvironment`.
   - `testing/**` уже прописан в `tsconfig.lib.json` / `tsconfig.spec.json`. Добавить исключение из coverage, если нужно.
   - Правило в README: у нового компонента есть harness.
3. Добавить `pnpm test-visual` в чеклист фазы в `CLAUDE.md`.

## Фаза 6 — повседневные блоки: feedback, навигация, оверлеи

> **Статус (2026-09-26): сделано и одобрено.** Все отклонения ниже приняты; пороги предупреждений подняты: бандл 800 kB, стиль компонента 6 kB. По просьбе пользователя сделана только фаза 6; фаза 6.0 не начата, поэтому в чеклисте нет `pnpm test-visual`, а у новых компонентов нет harnesses.
>
> Коммиты: `feat(alert)`, `feat(empty-state)`, `feat(progress)`, `feat(avatar)` + `fix(avatar)` (RTL «+N»), `feat(breadcrumbs)`, `feat(popover)` + `test(popover)`, `feat(dialog)` (drawer), `feat(badge)`, `feat(select)`, `feat(datepicker)`, `feat(menu)`, `chore(playground)` (секция «Phase 6»).
>
> Проверки: полный чеклист зелёный (396 unit-тестов, coverage 95.4/92.2/91.8/97.4, 186 stories × 3 режима без нарушений axe, ngc без ошибок). Браузер (Edge): light/dark/RTL для всех новых stories, открытые оверлеи, виды календаря.
>
> Отклонения от плана и решения, которые нужно подтвердить:
> - кнопка закрытия alert использует новый label `dismiss`, а не `close`;
> - добавлен label `moreCount` для «+N» у группы аватаров;
> - 8 цветов avatar: к бренду, зелёному, оливковому и красному добавлены примитивы purple/teal/orange/pink (100/200/800/900) и семантические `accent-1..8`; также новые `media-size-*`;
> - у badge с `dot` или `count` текст скрыт визуально, но остаётся для скринридеров;
> - в breadcrumbs свёрнутые пункты в меню — это button-пункты, которые кликают по скрытой ссылке (не `a[ui-menu-item]`);
> - popover закрывается, когда фокус уходит Tab'ом наружу;
> - drawer берёт `size` из `provideUiDialog()` вместе с диалогами;
> - `a[ui-menu-item]`: CDK Menu закрывает меню синхронно, и отсоединённая ссылка не переходит по `href`. Меню закрывается через `setTimeout` после клика; Space кликает по ссылке;
> - в year-view календаря на странице 24 года;
> - бюджеты: бандл playground 748 kB (warning 700 kB), `select.scss` 5.05 kB (warning 4 kB). Поднять пороги или облегчить?

| # | Компонент (entry) | API и поведение | A11y | Размер |
|---|---|---|---|---|
| 6.1 | `ui-alert` (`alert`) | `tone` info/success/warning/danger; `title`; контент; слот `[uiAlertActions]`; `dismissible` + `(dismissed)`; иконки тонов берутся из toast | `live`: off (по умолчанию) / polite → `role="status"` / assertive → `role="alert"`; кнопка закрытия с `labels().close` | S |
| 6.2 | `ui-empty-state` (`empty-state`) | слоты иконки или иллюстрации, `title`, описание, `[uiEmptyStateActions]`; `size` sm/md; подходит для `tr[ui-table-message]` | заголовок с `headingLevel` | S |
| 6.3 | `ui-progress-bar` (`progress`) | `value` / `max`; indeterminate при `value == null`; `size` sm/md; тона | `role="progressbar"`, `aria-valuenow/min/max`, имя через `aria-label` или `labels().loading`; без анимации при reduced motion | S |
| 6.4 | `ui-avatar` + `ui-avatar-group` (`avatar`) | `src` с запасным вариантом — инициалы из `name` (иврит и латиница); `size` sm/md/lg/xl; `shape`; цвет из набора токенов по хешу имени; группа с `max` и «+N» | `alt` = `name`; инициалы `aria-hidden` при наличии имени | S–M |
| 6.5 | `ui-breadcrumbs` (`breadcrumbs`) | `nav[ui-breadcrumbs]` + `a[ui-breadcrumb]` (routerLink); последний пункт — текущая страница; при > `maxItems` середина сворачивается в `ui-menu` (кнопка «…») | `aria-label` = `labels().breadcrumbs`, `aria-current="page"`; CSS-разделители зеркалятся в RTL | M |
| 6.6 | `ui-popover` (`popover`) | `[uiPopoverTriggerFor]` + `ng-template`; `uiPopoverPosition` (пресеты как у tooltip); `open()/close()`; `(opened)/(closed)` | немодальный `role="dialog"` + `aria-labelledby`; `aria-expanded`/`aria-controls` на триггере; фокус внутрь (`autoFocus`), Escape и клик снаружи закрывают, фокус возвращается | M |
| 6.7 | drawer (в `dialog`) | `UiDialog.openDrawer(content, { position: 'end' \| 'start', size })`; переиспользует `dialog-parts` и `provideUiDialog()`; `UiDrawerContainer` со slide-анимацией; на мобильных — полная ширина | `end` = слева в RTL; фокус и `aria-modal` как у диалога | M |
| 6.8 | Расширения | **select/multi-select:** `clearable` (label `clear`), `loading` (spinner + `aria-busy`), слоты `[uiOptionIcon]` / `[uiOptionDescription]`. **datepicker/calendar:** виды месяц/год (клик по заголовку), кнопки «очистить» и «сегодня». **menu:** `a[ui-menu-item]` (Enter через capture-listener), `ui-menu-group` с меткой, checkbox/radio-пункты (`CdkMenuItemCheckbox/Radio`), пресеты позиций. **badge:** тон `info` (вернуть `info-subtle`/`info-text` в токены), `size` lg, `dot`, `count` + `max` («99+») | APG для menuitemcheckbox/radio; grid месяцев и лет в календаре | M–L |

Новые labels: `clear`, `today`, `breadcrumbs`, `showMore`, `chooseMonth`, `chooseYear`, `dismiss`.

Переиспользовать:
- `select/select-base.ts` — оверлей, `matches()`, `labelFor()`;
- `datepicker/calendar.ts` — keyboard grid;
- `dialog/dialog.ts` и `dialog-container.ts`;
- `toast/toast.ts` — `ICONS`;
- `menu/menu.ts` — `UiLiveDirectionality`, Escape-listener.

## Фаза 7 — данные: таблица и ввод

> **Статус (2026-09-26): сделано и одобрено.** Все отклонения ниже приняты; порог предупреждения бандла поднят до 900 kB. Коммиты: `feat(table)` ×4 (+ `fix(table)` для JIT Storybook), `feat(number-input)`, `feat(chip)` (+ `fix(chip)` контраст), `refactor(select)` (общая панель), `feat(autocomplete)`, `feat(file-upload)`, `feat(select)` (multi-select), `chore(playground)` ×2, `chore(visual)`.
>
> Проверки: полный чеклист зелёный, кроме предупреждения бюджета (см. ниже). 532 unit-теста, coverage 95.7/92.7/92.6/97.7; 210 stories × 3 режима без нарушений axe; 630 базовых снимков (+72, ~4.2 МБ); ngc без ошибок. Браузер (Edge): light/dark/RTL для всех новых stories, открытые списки, прокрутка таблицы, раздел Phase 7 в playground.
>
> Отклонения от плана и решения для подтверждения:
> - number-input — элемент `ui-number-input`, а не `input[ui-number-input]`: кнопкам «−/+» нужна обёртка. Поддерживает `uiPrefix`/`uiSuffix`.
> - number-input: при уходе из поля значение обрезается до `min`/`max` и округляется до `maxFractionDigits` (не ошибка). Нечисловой текст → `null` + `uiNumberParse`, как планировалось. `inputmode="decimal"` (на iOS нет минуса; есть вход `inputmode`).
> - С Signal Forms лимиты задаются правилами `min()`/`max()`: `[formField]` запрещает атрибуты `min`/`max` на том же элементе (NG8022).
> - Выбор строк: модель — массив строк (`readonly T[]`) + `selectionCompareWith`, а не CDK `SelectionModel`. Селекторы `th[ui-table-select-all]`/`td[ui-table-select-row]` (с префиксом table, чтобы не путать с select).
> - Раскрываемые строки: `tr[ui-row-detail]` с `[ui-row-detail]="row"`; деталь всегда в DOM и скрыта (`@if (row.expanded())` для ленивого контента); `aria-expanded` только на кнопке (axe запрещает его на `tr` вне treegrid).
> - Sticky: смещения нескольких колонок считаются автоматически, тень рисует контейнер; в sticky-колонках нельзя `colspan`. Имя области: `label` → caption → label `scrollableTable`.
> - Объявление сортировки — форматтеры с названием колонки (`sortedAscending(column)`).
> - Chips: фильтр-chip — отдельный `button[ui-filter-chip]`; роль `ui-chip-set` (list/group) выбирается сама; chip-input: Backspace сразу удаляет последний чип, `addOnBlur` по умолчанию включён, дубликаты без учёта регистра пропускаются.
> - Autocomplete: без `displayWith` значение — текст; с `displayWith` — выбранный объект, а невыбранный текст стирается при уходе из поля. Первая опция не активируется сама; Escape без списка очищает поле; без совпадений список в режиме свободного текста скрыт.
> - File upload: файлы с нарушениями `accept`/`maxSize`/`maxFiles` не отбрасываются, а остаются в списке с пометкой и ошибками формы (`uiFileType`/`uiFileSize`/`uiFileCount`); добавлены `maxFiles` и `variant="button"`; прогресс — `ReadonlyMap<File, number>`; повторный файл пропускается.
> - Multi-select: chips в триггере `aria-hidden`, их крестик только для мыши (`tabindex="-1"`); «выбрать всё» действует на видимые после поиска опции и скрыт при `maxSelections`.
> - Общая панель опций экспортирована из `@vplans/ui-kit/select` как внутренняя (`ɵUiOptionPanel`, `ɵUiOptionParent`).
> - Бюджет: бандл playground 831.9 kB (warning 800 kB, error 1 MB). Поднять порог или облегчить?
> - Не сделано: harness для таблицы (фаза 9).

| # | Компонент | API и поведение | A11y | Размер |
|---|---|---|---|---|
| 7.1 | Выбор строк (`table`) | `[uiTableSelection]` с `SelectionModel` (`@angular/cdk/collections`) как model; `th[ui-select-all]` — трёхсостоянный `ui-checkbox`; `td[ui-select-row]`; Shift+клик выделяет диапазон | `aria-selected` на `tr`; labels `selectAll` / `selectRow` | M |
| 7.2 | Раскрываемые строки (`table`) | `tr[uiExpandableRow]` + `tr[uiRowDetail]`; кнопка-переключатель | `aria-expanded` / `aria-controls` | M |
| 7.3 | Прокрутка и sticky-колонки (`table`) | обёртка `ui-table-container` (overflow-x, тени у краёв); `th/td[uiSticky]="start\|end"` (логический inset) | прокручиваемая область `tabindex="0"` + `aria-label`, только когда есть overflow | M |
| 7.4 | Объявление сортировки | `LiveAnnouncer` с labels `sortedAscending/Descending/None` | — | S |
| 7.5 | `input[ui-number-input]` (`number-input`) | ввод по локали (`Intl.NumberFormat`, he-IL), форматирование на blur; `min/max/step`; кнопки-степперы; стрелки и PageUp/Down; ошибка `uiNumberParse` по образцу datepicker (`transformedValue` + validator для CVA) | `role="spinbutton"`, `aria-valuenow/min/max`; `inputmode="decimal"`, `dir="ltr"` | L |
| 7.6 | `ui-chip`, `ui-chip-set`, `ui-chip-input` (`chip`) | chips для показа (удаляемые, `(removed)`); фильтр-chips (`aria-pressed`); chip-input с value `string[]` (FormValueControl): Enter или запятая добавляют, Backspace удаляет последний | стрелки между chips; удаление объявляется | L |
| 7.7 | `ui-autocomplete` (`autocomplete`) | свободный текст с подсказками; value — строка или объект + `displayWith`; `(searchChange)` для сервера | combobox APG, `aria-autocomplete="list"` | M–L |
| 7.8 | `ui-file-upload` (`file-upload`) | dropzone + кнопка (скрытый `input[type=file]`); `accept`/`multiple`/`maxSize` → ошибки формы; список файлов с удалением и прогрессом (`ui-progress-bar`); value `File[]`. Кит не загружает файлы: прогресс передаёт приложение | dropzone — это кнопка; ошибки связаны через form-field | M |
| 7.9 | multi-select | chips в триггере (`ui-chip`); опция «выбрать всё»; `maxSelections` | — | M |

Перед 7.7 вынести из `UiSelectBase` общую панель: оверлей, key manager, `UiOption`, `UiOptionParent`. Её переиспользуют select, multi-select и autocomplete.

## Фаза 8 — сложные виджеты

> **Статус (2026-09-26): сделан только 8.4 (slider), ждёт ревью.** По просьбе пользователя остальные пункты (8.1–8.3, 8.5–8.7) не начаты. Коммиты: `feat(slider)`, `chore(visual)`, `chore(playground)` (раздел Phase 8), `docs`.
>
> Проверки: полный чеклист зелёный, предупреждений бюджета нет (бандл playground 872.5 kB при пороге 900 kB). 563 unit-теста, coverage 95.9/92.8/93.0/97.8 (slider 97.7/94.4/98.5/100); 220 stories × 3 режима без нарушений axe; 660 базовых снимков (+30); ngc без ошибок. Браузер (Edge): light/dark/RTL для всех stories слайдера; клавиши в RTL, клик по дорожке и перетаскивание в обоих направлениях, наложение бегунков диапазона, кольцо фокуса только с клавиатуры, имена в дереве доступности.
>
> Отклонения от плана и решения для подтверждения:
> - Два компонента в `@vplans/ui-kit/slider`: `ui-slider` (value `number | null`) и `ui-range-slider` (value `[start, end] | null`), общий внутренний базовый класс (`ɵUiSliderBase`). Один компонент с флагом `range` не подходит: у значений разные типы (Signal Forms проверяет тип поля), а подпись для `ui-form-field` разная (`label[for]` у одиночного, группа с `aria-labelledby` у диапазона).
> - Каждый бегунок — нативный `input[type=range]`, прозрачный внутри нарисованного бегунка: роль slider, `label[for]`, значения и регулировка экранным диктором (свайпы iOS) — от браузера. Указатель и клавиши обрабатывает компонент: клик по дорожке двигает ближайший бегунок, стрелки ←/→ идут по визуальному направлению (в RTL ← увеличивает), ↑/↓ всегда увеличивают/уменьшают, PageUp/PageDown — 10 шагов, Home/End — к пределам.
> - `null` показывает бегунок на `min` (у диапазона — всю шкалу); значение вне сетки или пределов показывается на ближайшем допустимом и не переписывается, пока пользователь не сдвинет бегунок. Как у нативного range, `max` вне сетки шага недостижим (0…10 с шагом 3 кончается на 9).
> - Бегунки диапазона не проходят друг через друга (у каждого `aria-valuemin/max` — соседний бегунок); где они совпали, бегунок выбирается по направлению перетаскивания. Имена бегунков: подпись поля + labels `rangeStart`/`rangeEnd` («מינימום»/«מקסימום») или входы `startLabel`/`endLabel`.
> - Signal Forms: у `ui-slider` пределы задаются правилами `min()`/`max()` (как у number-input); у `ui-range-slider` — входом `limits: [min, max]`, потому что `[formField]` запрещает атрибуты `min`/`max` (NG8022), а правила не применяются к кортежу.
> - `marks`: `true` — тик на каждом шаге (не больше 100), список `{ value, label? }` — тики и подписи под дорожкой (крайние подписи выровнены по краям, а не по центру). `aria-valuetext` по умолчанию — подпись метки на этом значении или число в формате локали; свой текст через `valueText`.
> - Добавлен выход `valueCommit` (отпустили указатель, нажали клавишу, диктор изменил значение) — для запросов к серверу; `valueChange` срабатывает и во время перетаскивания.
> - Нет: вертикальной ориентации, подсказки со значением над бегунком, минимального расстояния между бегунками. Добавить?

| # | Компонент | Суть | Размер |
|---|---|---|---|
| 8.1 | `ui-date-range-picker` (`datepicker`) | value `{ start, end }`; два календаря (один на мобильных); подсветка диапазона и клавиатура; слот пресетов; два поля с парсингом. Нужен range-режим в `UiCalendar` | L |
| 8.2 | `ui-time-input` (`time`) | value `"HH:mm"`; 24h для he-IL, 12h по локали; поле с маской + listbox интервалов; связка с datepicker для даты и времени | M |
| 8.3 | `ui-stepper` (`stepper`) | линейный и нелинейный; состояния шагов done/error/current; интеграция с валидностью формы; горизонтальный и вертикальный; `aria-current="step"`; RTL | M |
| 8.4 | `ui-slider` (`slider`) | одиночный и диапазон (два бегунка); step и marks; `role="slider"`, `aria-valuetext`; инверсия в RTL; FormValueControl | M–L |
| 8.5 | `ui-segmented` и `ui-button-toggle-group` (`segmented`) | одиночный выбор (семантика radiogroup) и множественный (`aria-pressed`) | S–M |
| 8.6 | Virtual scroll | `cdk-virtual-scroll-viewport` в панелях select/multi-select/autocomplete (порог по числу опций) и в строках таблицы. Главная сложность — key manager и `aria-activedescendant` для неотрендеренных опций | L |
| 8.7 | `ui-tree` (`tree`) | CDK Tree, APG tree view; раскрытие и сворачивание; выбор (одиночный или трёхсостоянные checkbox'ы); ленивые дети | L |

## Фаза 9 — инфраструктура для команд

1. **Harnesses для всех компонентов** в `@vplans/ui-kit/testing` (включая компоненты фазы 6, сделанные до 6.0). Постепенно переводить наши спеки на них.
2. **Токены breakpoints и density:**
   - SCSS-map `ui.$breakpoints` и миксины `ui.up(md)` / `ui.down(md)`;
   - компактная плотность через `[data-density="compact"]` — меняет токены высоты контролов;
   - покрывает SPEC-пункт «Tokens as SCSS source».
3. **Layout-утилиты:** классы `.ui-stack`, `.ui-cluster`, `.ui-grid`, `.ui-container` в `ui-kit.scss` и одноимённые миксины. Отступы через spacing-токены, логические свойства.
4. **MDX-страницы Storybook:** Getting started, Theming, RTL, Forms, Tokens, Contributing.
5. **Хвосты P3 из фазы 5:**
   - defaults-провайдеры для tooltip, pagination и table density;
   - `100vw` в dialog и toast;
   - захардкоженные множители в SCSS перенести в токены;
   - скрыть внутренности `UiOption`;
   - общий helper оверлеев (станет полезен после 6.6, 6.7 и 7.7).

---

## Решения по умолчанию (подтвердить в отчёте каждой фазы)

- **6:**
  - alert без live-региона по умолчанию;
  - popover фокусирует первый интерактивный элемент;
  - цвета avatar — 8 оттенков из токенов;
  - breadcrumbs сворачиваются при 5 и более пунктах.
- **7:**
  - number-input: value `number | null`, неразобранный текст → `null` + ошибка (как у даты);
  - chip-input: value `string[]`;
  - autocomplete хранит объект, если задан `displayWith`, иначе строку.
- **8:**
  - время как строка `"HH:mm"`;
  - slider-диапазон — кортеж `[number, number]`;
  - virtual scroll включается от 100 опций;
  - tree принимает вложенные `children` (+ accessor).
- **9:** визуальные базовые снимки хранятся в git.

## Критичные файлы и что переиспользовать

- `select/select-base.ts`, `select/option.ts` — оверлей, `labelFor`, `matches` → общая панель (7.7), clearable и loading (6.8).
- `datepicker/calendar.ts`, `datepicker/date-utils.ts` — виды месяц/год (6.8), range (8.1).
- `dialog/dialog.ts`, `dialog/dialog-container.ts`, `dialog/dialog-parts.ts` — drawer (6.7).
- `core/form-control-base.ts`, `core/checkable-base.ts`, `core/control-state.ts` — все новые контролы.
- `core/labels.ts`, `tokens/tokens.json`, `tokens/build-tokens.mts` — тексты, токены, пары контраста.
- `scripts/check-stories.mjs` — основа визуальной регрессии (6.0).
- `projects/playground/src/app/*` — секция на каждую фазу, как `phase-three`.

## Проверка (каждая фаза)

1. `pnpm tokens && pnpm lint && pnpm format:check && pnpm test:coverage && pnpm test:playground && pnpm build && pnpm build:playground && pnpm build-storybook && pnpm test-storybook && pnpm test-visual`, плюс `pnpm exec ngc -p projects/ui-kit/.storybook/tsconfig.json --noEmit`.
2. Для каждого компонента: спеки на рендер, inputs/outputs, клавиатуру и ARIA; для контролов ещё Signal Forms, Reactive (включая `formControlName`) и ngModel. Harness из 6.0 для новых компонентов.
3. Браузер (Edge через `playwright-core`) в light/dark/RTL: CSS-замеры и скриншоты ключевых состояний, как `browser-check.mjs` из фазы 5.
4. Отчёт фазы: что сделано, что осталось, решения. Ждать одобрения.
