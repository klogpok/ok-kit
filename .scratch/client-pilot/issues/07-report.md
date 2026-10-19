# 07: pilot report

**Status:** done
**Blocked by:** 05, 06

- [x] Kit: `/phase-check` (full check command, visual baselines, browser in light/dark/RTL).
- [x] Client: `npx ng build -c production --localize`, the action-weights spec through the
  `.scratch` tsconfig, `npm run test:price-quotes`, `sync:client --check` is clean, and
  `git diff --stat master` lists only paths under `apartment-changes-new/`.
- [x] Report to the user: what was done, what broke and how it was fixed (kit ticket or a change
  inside `apartment-changes-new`), what is left, and the next screen from the survey
  (`create-quote-item-dialog`, `deadline-dialog` → `schedule-dialog`). Every open question becomes
  its own `needs-info` ticket here.
- [x] ROADMAP section status and the delivered decisions in `docs/DECISIONS.md`.

## Comments

**2026-10-18 - done.** Kit branch `client-pilot-07` (worktree `.claude/worktrees/pilot-report`, from
`client-pilot` at `0f42935`); client branch `feat/ui-kit-pilot` at `43e3b6495` (worktree
`C:\vplans\worktrees\client\ui-kit-pilot`), not pushed, nothing in the client changed.

- **Kit `/phase-check`.** `tokens`, `lint`, `format:check` clean; 993 unit tests, coverage
  98.68/83.54/94.49/98.68; playground 8 tests; `build`, `build:playground` (one budget warning:
  `ui-kit-embed.scss` 41.11 kB over the 7 kB warning, accepted in ticket 08), `build-storybook`;
  310 stories × 3 modes without axe violations or console errors; `test-visual` 310 stories × 3
  modes without changes; `ngc` of the stories clean; `test-scripts` 15/15.
- **`test-host-css`** 711 captures: the full run failed 6 captures, all known machine-load noise:
  5 captures "did not finish rendering in 15 s" (multi-select disabled, invalid, searchable;
  segmented vertical) and `data-display-table--wide-with-sticky-columns.light-ltr` (the flaky
  capture of ticket 02). Each of those stories passed when rerun alone (`--filter`): the host
  changes no kit element. The 9 known story-markup captures (expandable rows, stepper default and
  vertical) are unchanged; the inherited host `color`/`letter-spacing` are accepted (ticket 09).
- **Browser (built Storybook, Edge, light/dark RTL and light LTR):** the stories of the pilot's
  controls (select and multi-select creatable, number input, checkbox, button loading, spinner;
  15 stories): roots `text-align: start` (button `center`), the closed searchable select has
  cursor `pointer`, `text` while open, the panel starts at the field's start edge (0 px) and
  is dark in the dark theme. Only console error: the static server's `favicon.ico` 404.
- **Client.** `node node_modules/@angular/cli/bin/ng.js build -c production --localize`: exit 0
  (447 s, the machine was loaded), 11 budget warnings (initial 5.55 MB of 4 MB, ten chunks over
  1 MB), 9 non-ESM modules, 14791 "No translation found": the same as tickets 04–06, none from the
  kit copy. Action weights spec 9/9 (through
  `.scratch/client-pilot/tsconfig.action-weights.spec.json`), `test:price-quotes` 99/99.
  `pnpm sync:client <worktree>\…\ui-kit --check --client <worktree>`: matches (237 files).
  `git diff --stat master`: 272 files, +27883 −3444, all under `apartment-changes-new/`;
  `git status` clean after the runs.
- **Client facts.** `npx ng` fails on the client's `devEngines` (pnpm `>=11 <12`,
  `EBADDEVENGINES`), so the CLI runs as `node node_modules/@angular/cli/bin/ng.js …`; the client's
  only CI job (`deploy-job`, manual, `master`) still calls `npm install` and `npx ng build`.
  Prettier (the client's `.prettierrc`, no format script) reports 5 of the 11 changed consumer
  files, and the same files already fail on `master`; `price-quotes-case.component.html` does not
  parse (`@let`) on `master` either. Not changed: the pilot keeps the client's formatting.
- **What broke and how it was fixed.** Host CSS bent the kit (266 of 306 stories): kit ticket 01.
  The vendored patches were missing: kit ticket 02. CRLF checkouts failed `--check`: kit ticket 10.
  `MatSnackBarModule` in a standalone component hid the spec's stub: `TestBed.overrideProvider` in
  the client spec (ticket 05). Two copies of the labels factory: `provideAcUiLabels()` in
  `apartment-changes-new/shared/` (review fixes).
- **Open tickets:** 11 (number input steppers), 12 (total line borders), 13 (sync behaviors), 14
  (live browser check, `ready-for-human`), 15 (next screen). Decisions in `docs/DECISIONS.md` →
  "Client pilot: delivered", status in `docs/ROADMAP.md`.
- **Next screen (survey):** `create-quote-item-dialog`, then `deadline-dialog` →
  `schedule-dialog`; ticket 15.

## Русский перевод

# 07: отчёт пилота

**Статус:** сделано
**Зависит от:** 05, 06

- [x] Кит: `/phase-check` (полная команда проверок, визуальные снимки, браузер в light/dark/RTL).
- [x] Клиент: `npx ng build -c production --localize`, спек action-weights через tsconfig в
  `.scratch`, `npm run test:price-quotes`, `sync:client --check` чистый, а `git diff --stat master`
  показывает только пути внутри `apartment-changes-new/`.
- [x] Отчёт пользователю: что сделано, что сломалось и как исправлено (тикет в ките или правка
  внутри `apartment-changes-new`), что осталось, и следующий экран по обзору
  (`create-quote-item-dialog`, `deadline-dialog` → `schedule-dialog`). Каждый открытый вопрос —
  отдельный тикет `needs-info` здесь же.
- [x] Статус раздела ROADMAP и принятые решения в `docs/DECISIONS.md`.

## Комментарии

**2026-10-18 - сделано.** Ветка кита `client-pilot-07` (worktree `.claude/worktrees/pilot-report`,
от `client-pilot` на `0f42935`); ветка клиента `feat/ui-kit-pilot` на `43e3b6495` (worktree
`C:\vplans\worktrees\client\ui-kit-pilot`), без push, в клиенте ничего не изменено.

- **`/phase-check` кита.** `tokens`, `lint`, `format:check` чистые; 993 unit-теста, coverage
  98.68/83.54/94.49/98.68; playground 8 тестов; `build`, `build:playground` (одно предупреждение
  бюджета: `ui-kit-embed.scss` 41.11 kB сверх предупреждения 7 kB, принято в тикете 08),
  `build-storybook`; 310 stories × 3 режима без нарушений axe и ошибок консоли; `test-visual`
  310 stories × 3 режима без изменений; `ngc` stories чистый; `test-scripts` 15/15.
- **`test-host-css`** 711 снимков: полный прогон упал на 6 снимках, все — известный шум от загрузки
  машины: 5 снимков «did not finish rendering in 15 s» (multi-select disabled, invalid, searchable;
  segmented vertical) и `data-display-table--wide-with-sticky-columns.light-ltr` (нестабильный
  снимок из тикета 02). Каждая из этих stories прошла при повторном запуске по одной
  (`--filter`): хост не меняет ни один элемент кита. 9 известных снимков с разметкой stories
  (expandable rows, stepper default и vertical) без изменений; унаследованные от хоста
  `color`/`letter-spacing` приняты (тикет 09).
- **Браузер (собранный Storybook, Edge, light/dark RTL и light LTR):** stories контролов пилота
  (select и multi-select creatable, number input, checkbox, button loading, spinner; 15 stories):
  корни `text-align: start` (у кнопки `center`), у закрытого select с поиском курсор `pointer`,
  у открытого `text`, панель начинается у начального края поля (0 px) и тёмная в тёмной теме.
  Единственная ошибка консоли — 404 `favicon.ico` статического сервера.
- **Клиент.** `node node_modules/@angular/cli/bin/ng.js build -c production --localize`: exit 0
  (447 с, машина была загружена), 11 предупреждений бюджета (initial 5.55 MB из 4 MB, десять чанков
  больше 1 MB), 9 модулей не ESM, 14791 «No translation found» — как в тикетах 04–06, ни одного от
  копии кита. Спек весов действий 9/9 (через
  `.scratch/client-pilot/tsconfig.action-weights.spec.json`), `test:price-quotes` 99/99.
  `pnpm sync:client <worktree>\…\ui-kit --check --client <worktree>`: совпадает (237 файлов).
  `git diff --stat master`: 272 файла, +27883 −3444, все внутри `apartment-changes-new/`; после
  прогонов `git status` чистый.
- **Факты о клиенте.** `npx ng` падает на `devEngines` клиента (pnpm `>=11 <12`,
  `EBADDEVENGINES`), поэтому CLI запускается как `node node_modules/@angular/cli/bin/ng.js …`;
  единственная задача CI клиента (`deploy-job`, вручную, `master`) всё ещё вызывает `npm install`
  и `npx ng build`. Prettier (`.prettierrc` клиента, скрипта форматирования нет) жалуется на 5 из
  11 изменённых файлов потребителей, и те же файлы не проходят уже на `master`;
  `price-quotes-case.component.html` не разбирается (`@let`) и на `master`. Не менялось: пилот
  сохраняет форматирование клиента.
- **Что сломалось и как исправлено.** CSS хоста гнул кит (266 из 306 stories): тикет кита 01. Не
  хватало вендорных патчей: тикет кита 02. CRLF-checkout проваливал `--check`: тикет кита 10.
  `MatSnackBarModule` в standalone-компоненте прятал заглушку спека: `TestBed.overrideProvider` в
  спеке клиента (тикет 05). Две копии фабрики лейблов: `provideAcUiLabels()` в
  `apartment-changes-new/shared/` (правки ревью).
- **Открытые тикеты:** 11 (кнопки −/+ числового поля), 12 (рамки строки итога), 13 (поведение
  синхронизации), 14 (проверка в живом браузере, `ready-for-human`), 15 (следующий экран). Решения —
  в `docs/DECISIONS.md` → «Client pilot: delivered», статус — в `docs/ROADMAP.md`.
- **Следующий экран (обзор):** `create-quote-item-dialog`, затем `deadline-dialog` →
  `schedule-dialog`; тикет 15.
