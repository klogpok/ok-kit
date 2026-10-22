# План фаз 6–9 @vplans/ui-kit

> **Сейчас (2026-10-22):** фазы 1–9, миграция на Angular 20, вид чипсов, popup listbox и пилот в client сделаны и одобрены; план и SPEC исчерпаны. Leading actions в popup listbox сделаны и ждут одобрения — раздел «Leading actions в popup listbox» ниже. Статус каждой фазы — в её разделе ниже.

## Контекст

Фазы 1–5 закрыты. В фазе 5 прошли второй аудит, исправления и тулинг; ответы на ревью применены.

В ките есть:
- базовые контролы, оверлеи, таблица, datepicker;
- токены, тема и RTL;
- проверки: coverage-пороги, `pnpm test-storybook` (axe по всем stories в 3 режимах), ESLint strictTypeChecked. *(После перехода на Angular 20 пороги — в `scripts/check-coverage.mjs`.)*

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
  - формы — только реактивные и шаблонные через `ControlValueAccessor`: каждый конкретный контрол сам отдаёт `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => X), multi: true }` (Signal Forms удалены, см. журнал решений).
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
> **Историческая запись:** пункты ниже писались до миграции на Angular 20 и описывают Signal Forms как живой дизайн. Signal Forms из кита удалены; что действует сейчас — в разделе «Миграция на Angular 20 (сделано 2026-10-06)» ниже.
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

> **Статус (2026-09-26): 8.4 (slider) сделан и одобрен**; все отклонения ниже приняты, вертикальная ориентация, подсказка со значением и минимальный зазор пока не нужны. По просьбе пользователя остальные пункты (8.1–8.3, 8.5–8.7) не начаты. Коммиты: `feat(slider)`, `chore(visual)`, `chore(playground)` (раздел Phase 8), `docs`.
>
> **Историческая запись:** пункты ниже писались до миграции на Angular 20 и описывают Signal Forms как живой дизайн. Signal Forms из кита удалены; что действует сейчас — в разделе «Миграция на Angular 20 (сделано 2026-10-06)» ниже.
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

> **Статус (2026-09-26): 8.1–8.3 сделаны и одобрены**; все отклонения ниже приняты. По ответу на ревью разделы playground загружаются лениво (`@defer (on viewport)`): начальный бандл 697.4 kB вместо 927.8 kB, порог бюджета не менялся. Коммиты: `feat(date-range-picker)`, `feat(time)`, `feat(stepper)`, `chore(playground)` (мастер заявки на осмотр и ленивые разделы), `fix(time)`, два `chore(visual)`, `docs`.
>
> **Историческая запись:** пункты ниже писались до миграции на Angular 20 и описывают Signal Forms как живой дизайн. Signal Forms из кита удалены; что действует сейчас — в разделе «Миграция на Angular 20 (сделано 2026-10-06)» ниже.
>
> Проверки: полный чеклист зелёный. 653 unit-теста (+90), coverage 96.3/93.1/93.5/98.1 (datepicker 97.3/93.5/95.0/98.5, time 98.1/92.4/96.1/99.6, stepper 97.9/94.7/93.9/100); 243 stories × 3 режима без нарушений axe (+23); 729 базовых снимков (+69, галерея токенов обновлена); ngc без ошибок. Предупреждение бюджета: бандл playground 927.8 kB при пороге 900 kB (ошибка — 1 MB). Браузер (Edge): light/dark/RTL/LTR для всех новых stories с открытыми панелями, 1 месяц на ширине 420px, маска и 12-часовой формат, состояния шагов и фокус после «Далее»; мастер в playground пройден от начала до конца.
>
> Отклонения от плана и решения для подтверждения:
> - **8.1 range picker.** Value — `{ start, end } | null` (`null`, когда оба пусты). Диапазон с одним открытым концом — допустимое значение («с 1 сентября»); если нужны оба конца, приложение добавляет валидатор. Пределы — `minDate`/`maxDate`, а не `min`/`max`: `[formField]` резервирует `min`/`max` (NG8022), а правила дат к объекту не применяются.
> - Пресеты — вход `presets: { label, range | () => range }[]`, а не слот контента: функция считает диапазон от «сегодня» в момент клика. В диалоге с двумя месяцами пресеты — колонка сбоку, с одним — строка сверху. Двух месяцев от ширины экрана 52rem, ниже — один.
> - Ошибки: текст не дата → `uiDateParse`; конец раньше начала → `uiDateRangeOrder` (label `invalidDateRange`), при этом пустым становится поле, которое набирали последним. Помечается только поле с ошибкой, остальные ошибки (например, required) помечают оба поля.
> - Календарь: если задано только начало, первый клик ставит конец; клик раньше начала начинает диапазон заново; после выбора конца диалог закрывается. Предпросмотр полосы — по дню под указателем или в фокусе и только по доступным дням. В диалоге есть «Очистить», кнопки «Сегодня» нет.
> - `UiCalendar` получил `range`, `[(selectedRange)]`, `rangeSelected` и `months` (несколько месяцев рядом; окно сдвигается, только когда активный день выходит за край). Снимки существующих stories календаря и datepicker не изменились.
> - **8.2 time input.** Value — строка `"HH:mm"` (24 часа) или `null`; формат показа берётся из цикла часов локали (`he-IL` — «14:30», `en-US` — «2:30 PM»). Входа для принудительного 12/24 нет. Без AM/PM введённые часы читаются как 24-часовые и в 12-часовой локали.
> - Пределы — `minTime`/`maxTime` (по той же причине NG8022; правила `min()`/`max()` принимают только числа), шаг списка — `interval` (по умолчанию 30 минут).
> - Маска оставляет только символы времени и ставит «:», когда цифры однозначны: «930» → «9:30», «1430» → «14:30»; «123» остаётся как есть до следующей цифры. На телефоне в 24-часовой локали — цифровая клавиатура, `maxlength` 5.
> - Список: editable combobox на `ui-option`. Кнопки-переключателя нет, только декоративная иконка часов: клик по полю или ArrowDown открывает список (`ui-icon-button` снимает статический `tabindex`, а лишняя Tab-остановка не нужна). Список открывается на выбранном времени или ближайшем следующем, а без значения — около текущего часа. Набранный текст подсвечивает ближайшее время и не фильтрует список.
> - «Связка с datepicker» — не отдельный компонент, а помощники `uiDateWithTime(date, time)` и `uiTimeOf(date)`, story «WithDate» и пример в README.
> - **8.3 stepper.** Своя реализация, а не CDK Stepper: CDK строится на семантике tablist, а нам нужен список кнопок с `aria-current="step"` и поддержка полей Signal Forms. `control` шага принимал `AbstractControl` или `FieldTree`; после миграции на Angular 20 (тикет 07) `UiStepControl` — это только `AbstractControl`.
> - Шаг «done», если его покинули валидным; «error», если его покинули (или пытались покинуть) невалидным. `completed` и `error` (строка показывается под названием) задают состояние вручную. Состояние читается после названия (labels `stepCompleted` / `stepError`).
> - `linear`: шаг доступен, только когда шаги до него валидны или `optional`. Заблокированный «Далее» помечает форму шага как touched, чтобы поля показали ошибки. Назад можно всегда (входа `editable` нет).
> - Содержимое шагов создаётся один раз и сохраняет состояние; ленивого `uiStepContent` нет. `reset()` возвращает на первый шаг и забывает посещения, но формы не сбрасывает. Если нажатая кнопка «Далее» исчезла вместе с шагом, фокус переходит на заголовок нового шага. Стрелками между заголовками не перемещаться — только Tab.
> - Бюджет: бандл playground превысил 900 kB. Ответ: разделы playground сделаны ленивыми, порог оставлен.

> **Статус (2026-09-26): 8.5 (segmented) сделан и одобрен**; все отклонения ниже приняты. По ответу на ревью добавлены вертикальная ориентация (оба компонента) и Home/End (`ui-segmented`): второй `feat(segmented)` и `chore(visual)` (+6 снимков). Коммиты: `feat(segmented)` ×2, `chore(visual)` ×2 (60 снимков + галерея токенов), `chore(playground)` (поля «Deal» и «Features» в фильтрах квартир), `docs`.
>
> **Историческая запись:** пункты ниже писались до миграции на Angular 20 и описывают Signal Forms как живой дизайн. Signal Forms из кита удалены; что действует сейчас — в разделе «Миграция на Angular 20 (сделано 2026-10-06)» ниже.
>
> Проверки: полный чеклист зелёный, предупреждений бюджета нет (начальный бандл playground 697.4 kB). 687 unit-тестов (+34), coverage 96.1/93.2/93.4/98.0 (segmented 93.8/98.7/86.0/97.5 — непокрыты только пустые колбэки по умолчанию); 263 story × 3 режима без нарушений axe (+20); 789 базовых снимков (+60); ngc без ошибок. Браузер (Edge): light/dark/RTL/LTR и forced colors для всех новых stories; стрелки в RTL и LTR, перенос по кругу, пропуск отключённых, readonly, кольцо фокуса только с клавиатуры, Space/Enter у кнопок, `fullWidth`, дерево доступности.
>
> Отклонения от плана и решения для подтверждения:
> - Два компонента в `@vplans/ui-kit/segmented`: `ui-segmented` + `ui-segment` (один выбор, value `T | null`) и `ui-button-toggle-group` + `button[ui-button-toggle]` (только множественный выбор, value `readonly T[]`). Одиночного режима у toggle-группы и отдельной toggle-кнопки без группы нет.
> - `ui-segmented` — нативные radio (одна Tab-остановка, Space и имена от браузера), прозрачные поверх сегмента. Стрелки обрабатывает компонент: WebKit не зеркалит ←/→ в RTL, а нам нужно одинаково везде. ←/→ идут по визуальному направлению, ↑/↓ — по порядку, с переносом по кругу; стрелка сразу выбирает (APG radio group). В readonly стрелки только двигают фокус. Home/End нет.
> - Вид: общая рамка (`--ui-segmented-*`, один набор токенов на оба компонента). Выбранный сегмент — сплошной primary с белым текстом; нажатая toggle-кнопка — `primary-subtle` с текстом `primary-text` и галочкой, чтобы состояние не держалось только на цвете. Галочка меняет ширину кнопки.
> - Значение toggle-группы — в порядке нажатия (как у multi-select), а не в порядке кнопок.
> - Readonly toggle-группа: `aria-readonly` не разрешён на `group`/`button`, поэтому кнопки получают `aria-disabled="true"` и остаются фокусируемыми (диктор читает «недоступно»). `aria-required` на `group` тоже не разрешён: обязательность — через валидаторы (`Validators.required` или `minLength(path, 1)` в Signal Forms).
> - Отключённая группа получает `aria-disabled`: иначе axe считает серую подпись `ui-form-field` нарушением контраста.
> - Нет: вертикальной ориентации, Home/End, отдельной toggle-кнопки. Добавить? **Ответ:** добавить вертикальную ориентацию и Home/End. Сделано: `orientation="vertical"` у обоих компонентов (элементы шириной с самый широкий, текст у начального края, ненажатые toggle-кнопки держат место галочки; `aria-orientation` только у `radiogroup` — на `group` он не разрешён); Home/End в `ui-segmented` выбирают первый и последний доступный сегмент (в toggle-группе каждая кнопка — своя Tab-остановка, поэтому клавиш перемещения там нет).

> **Статус (2026-10-07): 8.6 (virtual scroll) сделан и одобрен**; все отклонения ниже приняты, порог предупреждения стиля компонента поднят до 7 kB. Решения код-ревью (данные через `items`, виртуализируются только `items`) приняты и записаны в журнал решений. Коммиты: `feat(select)`, `feat(table)`, `docs(select, table)`, `fix(select, table)` (по код-ревью), `chore(visual)`, `docs` (решения), `fix(select)` (End на закрытом списке, найдено в браузере).
>
> - **Списки.** `ui-select`, `ui-multi-select` и `ui-autocomplete` принимают опции данными: `items` (`UiOptionItem`: `value`, `label`, `description?`, `disabled?`). Начиная с `virtualThreshold` элементов (по умолчанию 100) список рисуется в `cdk-virtual-scroll-viewport`. Key manager ходит по данным, поэтому стрелки, Home/End, PageUp/Down, typeahead, поиск и «выбрать всё» доходят до неотрисованных опций. `aria-activedescendant` пуст, пока активная опция не отрисована. `aria-posinset`/`aria-setsize` считают весь список вместе с «выбрать всё».
> - **Таблица.** `cdk-virtual-scroll-viewport[uiTableViewport]`: `aria-rowcount` у таблицы, `aria-rowindex` только у строк `*cdkVirtualFor`, фокусируемая область с именем из caption, `stickyHeader` у верхнего края viewport.
>
> Проверки: полный чеклист зелёный, кроме предупреждения бюджета (см. ниже). 757 unit-тестов (+28), coverage 98.2/81.0/93.1/98.2; 267 stories × 3 режима без нарушений axe (+4); 801 базовый снимок (+12); ngc без ошибок. Браузер (Edge): light/dark/RTL/LTR для новых stories с открытыми списками; End/Home/PageUp в select (в том числе на закрытом списке), End+Enter в multi-select, PageDown до конца отфильтрованного autocomplete, прокрутка таблицы на 10 000 строк до середины и до конца (заголовок на месте, `aria-rowindex` совпадает с номером строки).
>
> Отклонения от плана и решения для подтверждения:
> - В поле поиска (`searchable`, autocomplete) открытого списка Home/End двигают курсор, а не активную опцию (APG для редактируемого combobox); на закрытом списке они открывают его на первой или последней опции. Так было и до 8.6.
> - Harnesses select и autocomplete в виртуальном режиме видят только отрисованные опции (записано в README).
> - Бюджет: `select.scss` 6.07 kB при пороге предупреждения 6 kB — тикет `.scratch/virtual-scroll/issues/01-select-style-budget.md`. **Ответ:** поднять порог до 7 kB (ошибка остаётся 8 kB).

| # | Компонент | Суть | Размер |
|---|---|---|---|
| 8.1 | `ui-date-range-picker` (`datepicker`) | value `{ start, end }`; два календаря (один на мобильных); подсветка диапазона и клавиатура; слот пресетов; два поля с парсингом. Нужен range-режим в `UiCalendar` | L |
| 8.2 | `ui-time-input` (`time`) | value `"HH:mm"`; 24h для he-IL, 12h по локали; поле с маской + listbox интервалов; связка с datepicker для даты и времени | M |
| 8.3 | `ui-stepper` (`stepper`) | линейный и нелинейный; состояния шагов done/error/current; интеграция с валидностью формы; горизонтальный и вертикальный; `aria-current="step"`; RTL | M |
| 8.4 | `ui-slider` (`slider`) | одиночный и диапазон (два бегунка); step и marks; `role="slider"`, `aria-valuetext`; инверсия в RTL; FormValueControl | M–L |
| 8.5 | `ui-segmented` и `ui-button-toggle-group` (`segmented`) | одиночный выбор (семантика radiogroup) и множественный (`aria-pressed`) | S–M |
| 8.6 | Virtual scroll | `cdk-virtual-scroll-viewport` в панелях select/multi-select/autocomplete (порог по числу опций) и в строках таблицы. Главная сложность — key manager и `aria-activedescendant` для неотрендеренных опций | L |
| 8.7 | `ui-tree` (`tree`) | CDK Tree, APG tree view; раскрытие и сворачивание; выбор (одиночный или трёхсостоянные checkbox'ы); ленивые дети | L |

> **8.7 — спека согласована (2026-10-07):** [.scratch/tree/spec.md](../.scratch/tree/spec.md), термины в [GLOSSARY.md](../GLOSSARY.md), значение — [ADR 0001](adr/0001-tree-value-is-every-checked-key.md).
>
> **Статус (2026-10-10): 8.7 сделана и одобрена.** Точка входа `@vplans/ui-kit/tree` (`ui-tree`, `UiTreeNodeDef`) на CDK Tree; режимы `none`/`single`/`multiple`, каскад галочек, ленивые ветки с повтором, `loading` и пустое состояние, свой шаблон узла; `UiTreeHarness` и `UiTreeNodeHarness`; токены `--ui-tree-*`; тексты `noItems`, `loadFailed`, `retry`; в core — `UiControlState.writeDerivedValue()`. История «Foundations/Tokens → Component tokens» переложена в две колонки: страница переросла 16384px, и её снимок падал через раз. Вопросы ревью (тикеты 01–03 в `.scratch/tree/issues/`) закрыты 2026-10-07: всё поведение оставлено как сделано, ответы — в [DECISIONS.md](DECISIONS.md).

## Фаза 9 — инфраструктура для команд

> **Статус (2026-10-10): спека и тикеты готовы, работа не начата.** Решения опроса — в [спеке](../.scratch/phase-9/spec.md): пять подфаз 9.1 P3 → 9.2 брейкпоинты и density → 9.3 layout → 9.4 harnesses → 9.5 MDX, у каждой отчёт и одобрение. Тикеты 01–24 — в `.scratch/phase-9/issues/`. Пункты ниже — исходный план; где он расходится со спекой, действует спека.
>
> **Статус (2026-10-10): 9.1 (хвосты P3) сделана и одобрена.** Ответы на тикеты 25–27 — в [DECISIONS.md](DECISIONS.md); исправление сдвига popover — тикет 28. Ветка `phase-9`, тикеты 01–06. Коммиты: `feat(tooltip)` (`provideUiTooltip`), `feat(pagination)` (`provideUiPagination`), `fix(overlays)` (ширина dialog, drawer, toast и popover считается от контейнера оверлея, `100vw` убран), `feat(tokens)` + `chore(visual)` (множители в component-токены), `refactor(select)` (внутренности `UiOption`), `refactor(core)` (`core/overlay.ts`: пресеты позиций и `syncOverlayDirection`), `docs(rules)`, правки по код-ревью: `fix(time)`, `refactor(select)`, `refactor(tooltip)`, `docs(readme)`, `docs(changelog)`.
>
> Проверки: полный чеклист зелёный. 834 unit-теста (+14), coverage 98.29/81.42/93.27/98.29; 294 stories × 3 режима без нарушений axe; 882 снимка без изменений; ngc без ошибок; бюджеты playground без предупреждений. Браузер (Edge, видимая полоса прокрутки 15px, light/dark, RTL/LTR, 360 и 1024px): dialog, drawer, toast и popover не заходят под полосу; select, autocomplete, datepicker, date-range-picker, time input, tooltip и popover открываются там же, где раньше; значения новых токенов совпадают со старыми.
>
> Отклонения от спеки:
> - Изменились три снимка `foundations-tokens--component-tokens`: галерея показывает новые токены (этого требует тикет 04). Остальные снимки не изменились.
> - Аватар: множитель `0.6` задаёт размер иконки-заглушки, а не инициалов, поэтому токен называется `--ui-avatar-icon-size-ratio`.
> - Скаляры (`0.8`, `1.2`, `0.6`, `0.96`) — литералы: семантического токена для безразмерного множителя нет (записано в README).
> - `UiOption`: `filteredOut` читают панель и группа, поэтому наружу вышел `ɵfilteredOut()`; защищённый `computed` остался для шаблона (шаблон Angular не принимает имя с `ɵ`). `getLabel` остался публичным — тикет 25.
> - Toast тоже синхронизирует направление через `syncOverlayDirection`.
> - `time-input` получил `skipPredicate` по `ɵdisabled`: стандартный предикат CDK читает `disabled`.
>
> Вопросы для решения: тикеты 25 (`getLabel`), 26 (смысл `--ui-spinner-stroke-width`), 27 (сдвинутый popover под левой полосой в RTL-iframe).
>
> **Статус (2026-10-10): 9.2 (брейкпоинты и density) сделана и одобрена.** Ответы на тикеты 29–31 — в [DECISIONS.md](DECISIONS.md). Тикеты 08, 09, 10 и 28 (ответ на тикет 27). Коммиты: `feat(tokens)` (брейкпоинты: `$breakpoints`, `ui.up()`/`ui.down()`, `UI_BREAKPOINTS` в core), `feat(datepicker)` (два месяца от md), `feat(tokens)` + `feat(storybook)` (compact density, переключатель Density в тулбаре, «Foundations/Density»), `feat(table)` (`density` по умолчанию `undefined`, таблица следует области), `fix(popover)` (сдвиг у края держит отступ 8 px), `chore(visual)` ×5; по код-ревью: `chore(lint)`, `feat(tokens)` (compact-область заново объявляет `--ui-table-cell-padding-block`), `refactor(popover)` (обёртка над стратегией CDK вместо подкласса, геометрия в `core/overlay.ts`), `feat(tokens)` (таблица density в README и compact-значения в `UI_TOKENS` из генератора), `docs(readme)`; по проверке в браузере: `fix(storybook)` (истории Density не зависят от density в тулбаре).
>
> Значения compact: высота контролов sm/md/lg 1.75/2/2.5rem; padding-inline 0.5/0.625/0.75rem; gap 0.25/0.375/0.5rem; отступ ячейки таблицы по блоку — compact-значение таблицы. Шрифты и `--ui-space-*` не меняются.
>
> Проверки: полный чеклист зелёный. 845 unit-тестов (+11), coverage 98.32/81.48/93.31/98.32; 300 stories × 3 режима без нарушений axe (+6); 900 снимков (+18; изменён `foundations-tokens--component-tokens` — новая строка токена); ngc без ошибок; бюджеты playground без предупреждений. Браузер (Edge, light/dark, RTL/LTR, density из тулбара): контролы, option, menu, tree, segmented, календарь, tabs, pagination и таблица уменьшаются, шрифты прежние, обрезаний и наложений нет; date-range-picker: один месяц до 831px, два от 832px; popover у начального и конечного края держит 8 px, в том числе в RTL-iframe с левой полосой.
>
> Отклонения от спеки:
> - «Foundations/Density» — четыре истории (`Controls`, `Table`, `OpenListDefault`, `OpenListCompact`), а не одна: overlay получает compact только через корень, поэтому открытый список в compact — отдельная история; таблица отдельно, чтобы не менять снимки контролов. Истории закрепляют density сами и не следуют тулбару.
> - Таблица: новый токен `--ui-table-cell-padding-block-default`; генератор теперь разрешает ссылку component-токена на токен того же компонента (правило в README).
> - `table.spec.ts` проверяет классы `ui-table--*`: Vitest не загружает CSS. Поведение в области проверяет play-функция истории `Table` (отступы 12/6/12/6 px).
> - Popover сдвигается своей обёрткой над стратегией CDK (тикет 28), а не отступом стратегии, как предлагал тикет: отступ стратегии CDK не учитывает левую полосу.
> - Генерируемый `_breakpoints.scss` исключён из stylelint, как `_tokens.scss`.
>
> Вопросы для решения: тикеты 29 (сброс переопределений внутри области density), 30 (возврат к обычной плотности внутри compact), 31 (собственный сдвиг только у popover или и у tooltip).
>
> **Статус (2026-10-10): 9.3 (layout-утилиты) сделана и одобрена.** Ответ на тикет 32 — в [DECISIONS.md](DECISIONS.md); исправление playground — тикет 33. Тикеты 12 и 13. Коммиты: `feat(styles)` (`.ui-stack`, `.ui-cluster`, `.ui-grid`, `.ui-container`, `.ui-gap-3xs` … `.ui-gap-3xl` и миксины `stack`, `cluster`, `grid`, `container`), `refactor(playground)` (playground без своих `.row`, `.toolbar`, `.stack`, `.grid`; скриншоты до и после совпадают попиксельно), `chore(visual)` ×2; по код-ревью: `fix(styles)` (`--ui-grid-min` не протекает во вложенные grid) + история `NestedGrid`, `feat(tokens)` (семантические токены `--ui-layout-grid-min` = 20rem и `--ui-layout-container-max-width` = 80rem), генерируемый `styles/_spacing.scss` со списком шагов отступа, `docs`, `refactor(playground)` (локальный класс вместо `.form .ui-cluster > *`).
>
> Проверки: полный чеклист зелёный. 845 unit-тестов, playground 7; coverage 98.32/81.49/93.31/98.32; 306 stories × 3 режима без нарушений axe (+6); 918 снимков (+18); ngc без ошибок; бюджеты playground без предупреждений (initial 705.11 kB). Браузер (Edge, light/dark, RTL/LTR, 360–1600 px): отступы 2…48 px по шкале, cluster переносится и зеркалится, grid перестраивается 1→2→4 колонки, вложенный grid держит свой минимум, container по центру с отступами; playground без наложений и горизонтального скролла.
>
> Отклонения от спеки:
> - Каждый layout-класс сам задаёт `--ui-gap` и `--ui-grid-min`, а не читает их с fallback: так вложенный layout не наследует значения родителя. Модификатор `.ui-gap-*` и `--ui-grid-min` действуют на том же элементе, не на предке (записано в README).
> - 20rem и 80rem — семантические токены `--ui-layout-grid-min` и `--ui-layout-container-max-width`: stylelint запрещает литералы `rem`, а так значения можно переопределить в рантайме.
> - `container()` ещё задаёт `box-sizing: border-box` и `inline-size: 100%`, чтобы работать внутри flex-строки; миксины принимают и имя шага, и любую длину.
> - `.ui-stack` — flex-колонка (не grid).
> - Play-проверки Grid и NestedGrid рассчитаны на ширину снимков (1024 px); на 360 px колонок меньше, и они падают — вёрстка при этом правильная.
>
> Вопрос для решения: тикет 32 (секции phase 8 в playground без стиля карточки и JSON в RTL; было и в `master`).
>
> **Статус (2026-10-11): 9.4 (harnesses) сделана и одобрена.** 9.5 не начата: пользователь попросил остановиться. Тикеты 15–19 и 33 (ответ на тикет 32). 18 новых harnesses в `@vplans/ui-kit/testing`, по коммиту `feat` и spec на каждый: accordion, alert, avatar (+ группа), badge, breadcrumbs, datepicker, empty-state, form-field, menu, pagination, popover, progress, radio, switch, table (+ строка и ячейка), tabs (+ tab nav), toast, tooltip. Правило README: harness обязателен для компонента с состоянием или поведением; divider, skeleton, spinner, icon и card освобождены. Playground: общий стиль карточки для всех секций, JSON читается слева направо в RTL. По код-ревью: breadcrumbs, tab link и step наследуют `UiHarness`; datepicker ищет только свою панель (id + `aria-controls`); стрелки пагинации найдены по классам; breadcrumbs открывают «…» через `UiMenuHarness`; таблица отмечает строки через `UiCheckboxHarness`; `getTone()` у alert и toast без `!`.
>
> Проверки: полный чеклист зелёный. 925 unit-тестов (+80), playground 8 (+1); coverage 98.34/83.14/94.49/98.34 (без testing ветки были бы 79.96 — ниже порога 80); 306 stories × 3 режима без нарушений axe; 918 снимков без изменений; ngc без ошибок; бюджеты playground без предупреждений. Браузер (Edge, light/dark, RTL/LTR): datepicker, пагинация, popover и tooltip с новой разметкой выглядят и работают как раньше; в playground у всех 16 секций рамка карточки, JSON читается по порядку.
>
> Отклонения от спеки:
> - API сверх спеки (группа аватаров, tab nav, `clickToday`/`clickClear`, `getControl()` без запроса) и разметка для harnesses — тикет 35.
> - Tooltip не связан с триггером в DOM: harness находит подсказку по тексту из `aria-describedby`; два триггера с одинаковым текстом неразличимы (записано в README).
> - `UiPaginationHarness.getPageSize()` возвращает `null` без выбора размера страницы: на последней странице текст диапазона не равен размеру.
> - Коммиты harnesses названы то `feat(testing)`, то `feat(<компонент>)`.
>
> Вопросы для решения: тикеты 34 (toast через `documentRootLoader`), 35 (API сверх спеки), 36 (harness date-range-picker ищет панель глобально), 37 (Shift-диапазон в harness таблицы). **Ответы (2026-10-11)** — в [DECISIONS.md](DECISIONS.md); тикет 36 исправлен тикетом 38.
>
> **Статус (2026-10-11): 9.5 (документация) сделана и одобрена; фаза 9 закрыта.** Ветка `phase-9.5`. Тикеты 21–23. Шесть MDX-страниц в Storybook, раздел Docs первым в sidebar (`storySort`): Getting started, Theming, RTL, Forms, Tokens, Contributing — `projects/ui-kit/docs/`, на английском, примеры — существующие stories через `<Canvas of>` (галереи токенов, Foundations/Density и Layout, form-field, кнопки, `Hebrew` у select/menu/popover/tooltip), остальное — блоки кода. Из README ушли Installation, Usage, Theming, Breakpoints, Layout, Density, RTL, i18n, общая часть Forms и направление оверлеев; README оставил таблицу exports, справку по компонентам, Testing, таблицу токенов и правила вклада, ссылается на страницы. `pnpm tokens` пишет таблицу density в `docs/tokens.mdx`. Коммиты: 72a5209, 6b1564a, 5fadb0d (+ merge d06d141), по код-ревью 6ada630, 1bddd2a, 73fd320, 555fac8; снимки — отдельный `chore(visual)`.
>
> По код-ревью: один ключ `'ui-theme'` в конфиге темы и no-flash скрипте; живые stories на Getting started; зеркалирование drawer и toast на странице RTL; export `SignalForms` → `AccountForm`; docs-страницы следуют теме и направлению toolbar (`.storybook/preview.scss`, слушатель канала в `preview.ts`), текст остаётся LTR, canvases — RTL.
>
> Проверки: полный чеклист зелёный. 926 unit-тестов, playground 8; coverage 98.33/83.14/94.49/98.33; 306 stories × 3 режима без нарушений axe; ngc без ошибок; бюджеты playground без предупреждений. Снимки: Edge обновился до 155 (153 → 155), текст рисуется иначе — 763 из 918 снимков пересозданы с одобрения пользователя (шрифт проверен: Assistant 500 из веб-шрифта). Браузер (Edge, light/dark, LTR/RTL): все шесть страниц отрисованы, canvases читаемы в тёмной теме.
>
> Отклонения от спеки: справка по компонентам осталась в README (тикет 39); таблицы на JSX, MDX вне Prettier (тикет 40); `storySort` задаёт порядок всех групп, переименование story, тема docs (тикет 41).
>
> Вопросы для решения: тикеты 39, 40, 41. **Ответы (2026-10-11)** — в [DECISIONS.md](DECISIONS.md): всё оставить как есть.

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

## Миграция на Angular 20 (сделано 2026-10-06)

> **Статус (2026-10-07): сделано, одобрено и слито в `master`**; открытых вопросов нет. Отдельная фаза между 8.5 и 8.6: фазы 8.6 и 8.7
> сознательно отложены до её окончания, чтобы ни один новый компонент не писался под удаляемый API.
> Спека и тикеты — в `.scratch/ng20-migration/`.

**Зачем.** Единственное приложение, которое потребляет кит, работает на Angular 20 и обновлено не
будет (решение организационное). Оно берёт кит копированием исходников, поэтому исходники обязаны
компилироваться компилятором Angular 20, а Signal Forms в Angular 20 не существует. До миграции
приложение не могло пользоваться китом вообще.

**Что дала фаза и ответы на ревью** — в [DECISIONS.md](DECISIONS.md), разделы «Angular 20 migration: …»;
изменения пакета — в CHANGELOG, версия 0.2.0.

**Проверки.** Полный чеклист зелёный на каждом этапе: 729 юнит-тестов в 69 файлах, 7 тестов
playground, `lint` и `format:check` чисто, обе сборки и `build-storybook` успешны, 263 стори в
3 режимах без нарушений axe и без визуальных изменений.

## Вид чипсов (сделано и одобрено 2026-10-10)

> Отдельная задача вне фаз: тикет `.scratch/chip-appearance/issues/01-chip-appearance.md`. Новый вид по умолчанию `outline`, прежний — `appearance="soft"`; `size` (`sm`/`md`), `tone`, иконки в фильтрах, `provideUiChip()`. Решения — в [DECISIONS.md](DECISIONS.md) («Chips: outline by default, soft on request»).

## Popup listbox (сделано и одобрено 2026-10-11)

> Архитектурная работа вне фаз по итогам архитектурного обзора. Спека и тикеты 01–09 — в `.scratch/listbox/`; решения и что поставлено — в [DECISIONS.md](DECISIONS.md) («Popup listbox: plan» и «Popup listbox: review answers»).
>
> **Статус (2026-10-11): сделано и одобрено.** Ответы на ревью (тикеты 10–14) приняты по рекомендованным вариантам: `UiSelectBase` остаётся, time-input без слотов показывает «нет вариантов», одно правило ArrowUp для всех полей, `getActiveOption()` добавлен в harness select, autocomplete и time (`feat(testing)`), направление читается при открытии панели; internal entry point не требует своих stories (`docs(readme)`). Ветка `listbox`, тикеты 01–09. Коммиты: `fix(autocomplete)` (ArrowUp/ArrowDown без активной опции, тест сначала), `feat(core)` (`ɵUiDropdownPanel`), `refactor(datepicker)` (оба датапикера на dropdown panel), `feat(listbox)` (internal entry point `@vplans/ui-kit/listbox`: контроллер `ɵinjectListbox`, элемент `ui-listbox`), `refactor(time)`, `refactor(autocomplete)`, `refactor(select)` ×2 (поля на контроллере, удалены `option-panel.ts`, `UiOptionParent`, `select/_panel.scss` и `ɵ`-экспорты `select`), `fix(listbox)` (active option сохраняется при пересчёте `items`), `refactor(testing)` (общий внутренний listbox-harness), `docs(listbox)` (правила, CHANGELOG, README).
>
> Проверки: полный чеклист зелёный. 967 unit-тестов, coverage 98.67/83.39/94.43/98.67; playground 8; 306 stories × 3 режима без нарушений axe и ошибок консоли; 918 снимков без изменений; ngc без ошибок; бюджеты playground без предупреждений. В логе `test:playground` — `IntersectionObserver is not defined` от `@defer (on viewport)` в jsdom, было и раньше.
>
> Браузер (собранный Storybook manager, Edge, видимая полоса прокрутки 15 px): select, multi-select, autocomplete и time-input в light/dark RTL и light LTR — панель начинается у начального края поля и равна ему по ширине (разница 0 px), Escape возвращает фокус в поле, тёмная тема даёт тёмную поверхность. Клик по триггеру select закрывает список, по полю autocomplete/time — оставляет открытым; клик снаружи закрывает. Датапикеры: клик по toggle и снаружи закрывает, фокус остаётся на toggle; в dark RTL панель выровнена по полю; range picker на ширине 360 и 480 px показывает один месяц и не выходит за экран. Переключение направления при открытой панели: панель остаётся на старом месте до повторного открытия — тикет 14.
>
> Отклонения от спеки: у select/multi-select остался общий абстрактный `UiSelectBase` (решение 6 обещало убрать иерархию) — тикет 10. Поведенческие изменения: time-input без слотов показывает «нет вариантов» (тикет 11), ArrowUp без активной опции ведёт к последней опции во всех полях (тикет 12). `UiOptionHarness.isActive()` читает ARIA; `getActiveOption()` был только во внутреннем harness (тикет 13; по ответу на ревью добавлен в публичные).
>
> Вопросы ревью закрыты: тикеты 10–14 в `.scratch/listbox/issues/` — сделано.

**Зачем.** Четыре поля повторяют жизненный цикл выпадающей панели, три — политику клавиатуры, а `time-input` и `autocomplete` опираются на внутренности `select`. Итог: dropdown panel в `core` (директива на `ng-template`) и internal entry point `@vplans/ui-kit/listbox`, на которых стоят `select`, `multi-select`, `autocomplete`, `time-input` и оба датапикера.

## Пилот в client (спека готова 2026-10-14, отчёт 2026-10-18, одобрен 2026-10-19)

> Работа вне фаз после закрытия фазы 9: первый экран приложения `C:\vplans\client` на ките. Спека и тикеты 01–07 — в `.scratch/client-pilot/`; решения — в [DECISIONS.md](DECISIONS.md) («Client pilot: plan»).
>
> **Статус (2026-10-14): спека и тикеты готовы; тикет 01 (встраиваемые стили, `ui-embed-styles`, устойчивость к CSS хоста, `pnpm test-host-css`) сделан; вопросы 08 (ошибка бюджета `anyComponentStyle` в playground — 48 kB) и 09 (`color`/`letter-spacing` наследуются от хоста) решены 2026-10-15. Тикет 02 сделан 2026-10-15: `creatable` и `maxLength` у `ui-select`/`ui-multi-select`, курсор `pointer` у закрытого поиска, `UiLabels.create`, `UiSelectHarness.create()`; 4 новые stories, 12 снимков. Тикет 03 сделан 2026-10-16: `pnpm sync:client [target]` (`--check`, `--verify`) пишет самодостаточную копию в `apartment-changes-new/ui-kit/` (237 файлов, 117 импортов переписано, `SYNCED.md`); `--verify` — `ngc` с опциями client 0 ошибок, 59/59 стилей; тесты скрипта — `pnpm test-scripts`.**
>
> **Статус (2026-10-18): тикеты 01–07 и 10 сделаны, пилот ждёт одобрения пользователя и его проверки в браузере (тикет 14).** Тикет 10 (2026-10-18): `sync:client --check` сравнивает текст без учёта концов строк, CRLF-checkout копии совпадает. Тикет 04: копия (237 файлов) в ветке клиента `feat/ui-kit-pilot` (worktree `C:\vplans\worktrees\client\ui-kit-pilot`, без push). Тикет 05: `action-weights-section` на `ui-checkbox`, `ui-number-input` с `%`, `ui-button` (Save с loading), `ui-spinner`; спек 9 тестов через tsconfig в `.scratch/` клиента. Тикет 06: `price-quotes-case` на `ui-select` (creatable, maxLength), диалог на `<ui-embed-styles />`, папка `ok-kit` удалена. Правки ревью: `provideAcUiLabels()` в `apartment-changes-new/shared/`, правки скрипта синхронизации, `test:scripts` → `test-scripts`. Тикет 07 (отчёт): `/phase-check` кита зелёный — 993 unit-теста, coverage 98.68/83.54/94.49/98.68, playground 8, 310 stories × 3 режима без нарушений axe, снимки без изменений, `test-host-css` 711 снимков (6 упавших в полном прогоне — таймауты и известный нестабильный снимок, прошли по одной), `test-scripts` 15/15; браузер (Edge, light/dark RTL, light LTR) — контролы пилота. Клиент: `ng build -c production --localize` exit 0 (те же 11 предупреждений бюджета, ни одного от кита), спек весов 9/9, `test:price-quotes` 99/99, `sync:client --check` совпадает (237 файлов), `git diff --stat master` — 272 файла, все внутри `apartment-changes-new/`. Решения пользователя 2026-10-16: без новых i18n id; живые экраны проверяет пользователь. Открыто: 11 (кнопки −/+ у весов), 12 (рамки строки итога), 13 (три поведения синхронизации), 14 (проверка в браузере, `ready-for-human`), 15 (следующий экран: `create-quote-item-dialog` или `deadline-dialog` → `schedule-dialog`). Решения — в [DECISIONS.md](DECISIONS.md) («Client pilot: delivered»).
>
> **Статус (2026-10-19): пилот одобрен.** Исправление тикета 16 синхронизировано в `feat/ui-kit-pilot` (`e5ddbf58e`) и слито в `try/ui-kit-pilot` основного checkout клиента (`8d8195c68`); пользователь подтвердил, что страница больше не прокручивается в пустоту. Тикеты 14 и 16 сделаны. Ветки клиента не запушены.
>
> Ход дела: пользователь проверил оба экрана в живом приложении и одобрил пилот, но затем заметил, что страница настроек прокручивается в пустоту ниже последней карточки, пока раздел весов свёрнут. Причина — пустая скрытая область ошибки `ui-form-field` (`position: absolute`) выходит из-под обрезки свёрнутого раздела. Тикет 16: `position: relative` у `ui-form-field`, `ui-badge`, `.ui-stepper__header`, `.ui-table` и play story `InCollapsedPanel` у каждого. Тикеты 11–13 решены по рекомендованным вариантам без правок кода: кнопки −/+ у весов остаются, рамки строки итога остаются полного цвета, три поведения синхронизации подтверждены. Тикет 15 (следующий экран) — `wontfix`: пока не нужен, начнётся с новой спеки по запросу. Решения — в [DECISIONS.md](DECISIONS.md) («Client pilot: approved»).
>
> - Экран — `settings/action-weights-section` в `apartment-changes-new`.
> - Общие файлы client (`tsconfig*`, `angular.json`, `.eslintrc`, `package.json`, `styles.scss`, корневые провайдеры) не меняются; все правки — внутри `apartment-changes-new/`.
> - Доставка — `scripts/sync-to-client.mjs`: самодостаточная копия в `apartment-changes-new/ui-kit/`, импорты переписаны на относительные. Проверено 2026-10-14: `ngc` с опциями client — 0 ошибок, 58 стилей собираются без `includePaths`.
> - Потребитель сам подключает `<ui-embed-styles />` (встраиваемые стили без `_base` и авто-dark) и `provideUiLabels`.
> - Вендорная копия `ok-kit` (префикс `ok-`) заменяется: `creatable`/`maxLength` переезжают в `ui-select`, `price-quotes-case` переходит на копию, папка удаляется.
> - Работа в client — в ветке `feat/ui-kit-pilot`, без push.

## Leading actions в popup listbox (решено 2026-10-21, сделано 2026-10-22)

> Архитектурная работа вне фаз, кандидат 1 архитектурного обзора 2026-10-21. Спека и тикеты 01–03 — в `.scratch/leading-actions/`; решения — в [DECISIONS.md](DECISIONS.md) («Leading actions»).
>
> **Статус (2026-10-22): тикеты 01–03 сделаны, ждёт одобрения пользователя.** «Добавить «…»» и «Выбрать все» стали данными контроллера listbox (`createAction`, `selectAllAction`); `ui-select`/`ui-multi-select` на них переведены; слот `[uiListboxLeading]` и хуки `leadingOptions`, `alwaysShown`, `passedOver`, `leadingShown`, `isIndeterminate` удалены; классы `.ui-select__leading`/`__create`/`__all` → `.ui-listbox__actions`/`__create`/`__select-all` (в CHANGELOG). Публичный интерфейс select и его harness не изменились. Клиент локально не выкачан: проверить, стилизует ли он старые классы, не удалось (тикет 03).

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
2. Для каждого компонента: спеки на рендер, inputs/outputs, клавиатуру и ARIA; для контролов ещё Reactive (включая `formControlName`) и ngModel. Harness из 6.0 для новых компонентов.
3. Браузер (Edge через `playwright-core`) в light/dark/RTL: CSS-замеры и скриншоты ключевых состояний, как `browser-check.mjs` из фазы 5.
4. Отчёт фазы: что сделано, что осталось, решения. Ждать одобрения.
