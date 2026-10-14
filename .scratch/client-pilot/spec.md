# Client pilot: the first screen of the VPlans client on the kit

Status: ready-for-agent

Work outside the phases, chosen on 2026-10-14 after phase 9 closed. The kit covers the whole SPEC,
but no screen of the app uses it yet. The pilot puts it into the real app and turns what breaks
into tickets.

## Facts (survey of 2026-10-14)

- **The app** is `C:\vplans\client`: Angular 20.3, CDK and Material 20.2, Bootstrap 4.6 (reboot is
  global), Tailwind v4 without preflight, Karma tests with one `tsconfig.<area>.spec.json` per area,
  ESLint with the `app` selector prefix (not run in CI: GitLab runs only `ng build --localize` and
  tests), and per-locale builds (`en` source, `he`, `fr`) through `$localize`. `html[dir]` is set at
  runtime by `core/services/localization.service.ts`. Global background `#e4e7ed` comes from
  `html {}` in `src/styles.scss`. The client's `.scratch/` is gitignored.
- **A vendored kit is already there:**
  `src/app/pages/dashboard/apartment-changes-new/ok-kit/`. It is part of another repo
  (`C:\vplans\ui-kit`, Angular 22, commit `edfe4b7`) renamed to the `ok` prefix, with 8 patches
  listed in its `VENDORED.md`. It is self-contained: relative imports, and nothing in `tsconfig`,
  `angular.json` or `app.module`. It has two consumers:
  - `shared/cases/price-quotes-case` uses `<ok-select searchable creatable clearable size="sm"
    [maxLength] [formControl]>` with `ok-option`;
  - `shared/apartment-changes-dialog` renders `<ok-tokens />` (an unencapsulated component that
    loads the tokens while it is rendered) and provides `provideOkLabels` by `LOCALE_ID`.
- **ok-kit-20 lacks** the vendored patches 5–7: `creatable` (in the source it was on both select
  and multi-select, through the base class), `maxLength` on the search input, and the pointer
  cursor on a closed searchable select.
- **A self-contained copy compiles** (check of 2026-10-14, no client change): every entry point
  except specs and stories, copied as if into `apartment-changes-new`, with its 117
  `@vplans/ui-kit/<entry>` imports rewritten to relative paths. `ngc` with the client's
  `tsconfig.json` options (`strictTemplates`, `useDefineForClassFields: false`, `noUnusedLocals`,
  `noUnusedParameters`) reports 0 errors, and a planted type error is caught. All 58 component
  stylesheets compile with `sass` from the new place without `includePaths`.
- **The client's global CSS** is Bootstrap 4.6 (about 220 element rules of reboot), `styles.scss`
  (almost no element rules: `html`/`body` background, font and `letter-spacing: -0.01em`, `--mat-*`
  variables, scrollbars; the Material theme on `#4285f4` reaches `mat-*` only), and `ol.css` and
  `ckeditor5.css` (scoped to `.ol-*`/`.ck-*`). No class names collide: the kit uses `ui-` only.
- **The kit loses to the host's global rules** (browser check of 2026-10-14, ticket 01: the
  client's built global CSS prepended to every story in light RTL changed 266 of 306): reboot's
  `body { text-align: left }` is inherited and breaks RTL alignment (form-field hint, a form's
  button), `label { margin-bottom }` adds 8px under labels and lifts table checkboxes, `svg
  { vertical-align: middle }` shifts icons. Inherited `color`/`letter-spacing` barely show.
- **Style clashes of the full `ui-kit.scss`:**
  - `_base.scss` sets `:root` font, color, line-height and background, which outranks the client's
    `html {}` rule and restyles the whole app;
  - `tokens.css` (line 305) switches to dark under `prefers-color-scheme: dark`, while the client is
    light only;
  - `styles.scss:688` sets `.cdk-overlay-pane { max-width/max-height: unset !important }`, which
    breaks the viewport margin of a kit dialog. The pilot has no dialog.

## Decisions (user, 2026-10-14)

1. **The pilot screen** is `settings/action-weights-section` (474 lines): `mat-checkbox`, a number
   input with `%`, two secondary buttons, a primary button with loading, `mat-spinner`, a
   "total = 100%" check, one query and one mutation, admin only. The `ac-settings-section` wrapper
   and `MatSnackBar` stay.
2. **No common client file changes.** `tsconfig*.json`, `angular.json`, `.eslintrc.json`,
   `package.json`, `src/styles.scss` and the root providers stay as they are. Every client change
   is inside `src/app/pages/dashboard/apartment-changes-new/`.
3. **The kit is a self-contained copy in `apartment-changes-new/ui-kit/`**, written by a copy
   script in the kit (`scripts/sync-to-client.mjs`). The script rewrites the cross-entry imports to
   relative paths; that is its only transformation. The copy is never edited by hand: a fix goes
   into the kit and is synced again.
4. **Each consumer brings what the kit needs:** an unencapsulated `<ui-embed-styles />` in its
   template loads the embed stylesheet, and `provideUiLabels` keyed on `LOCALE_ID` sits in its own
   `providers`.
5. **The kit ships the embed stylesheet and its loader:** `styles/ui-kit-embed.scss` (tokens
   without the OS dark block, plus the layout classes; no `_base`, no typography) and the
   `ui-embed-styles` component that loads it. The kit resists host global CSS itself: component
   roots set `text-align: start`, and the `label` and `svg` elements it renders set their own
   margin, display and vertical alignment. A host-CSS check (Bootstrap reboot fixture) joins
   `/phase-check`.
6. **The vendored `ok-kit` is replaced within the pilot:** patches 5–7 move into ok-kit-20, the two
   consumers move to the copy, and the `ok-kit` folder is deleted.
7. **Tests without common files:** `test:price-quotes` keeps working, because its tsconfig finds
   files through imports. The action-weights spec runs through a tsconfig in the client's
   gitignored `.scratch/client-pilot/` with `ng test --ts-config=…`.
8. **The client work happens on its own branch** (`feat/ui-kit-pilot` from the client's `master`),
   following the client's `AGENTS.md`. Nothing is pushed without the user's approval.
9. **Tracked like a phase:** a ROADMAP section, the tickets below, `/phase-check` for the kit plus
   the client's build and tests, a report and approval.

## Tickets

(01, 02, 03) → 04 → (05, 06) → 07. See `issues/`.

## Out of scope

- Other screens of `apartment-changes-new`. The survey ranks `create-quote-item-dialog` and
  `deadline-dialog` → `schedule-dialog` next; they wait for the pilot report.
- Using the kit outside `apartment-changes-new`, and any change to the client's common files.
- Kit dialogs in the client and the `.cdk-overlay-pane !important` clash: they come with the first
  dialog screen.
- Replacing `MatSnackBar` with `ui-toast`.
- `C:\vplans\ui-kit` (the Angular 22 repo) and any sync with it.

## Русский перевод

# Пилот в client: первый экран клиента VPlans на ките

Статус: ready-for-agent

Работа вне фаз, выбрана 2026-10-14 после закрытия фазы 9. Кит покрывает весь SPEC, но ни один
экран приложения им ещё не пользуется. Пилот встраивает кит в настоящее приложение и превращает
всё, что сломается, в тикеты.

## Факты (обзор 2026-10-14)

- **Приложение** — `C:\vplans\client`: Angular 20.3, CDK и Material 20.2, Bootstrap 4.6 (reboot
  глобальный), Tailwind v4 без preflight. Тесты на Karma, на каждую область свой
  `tsconfig.<area>.spec.json`. ESLint с префиксом селекторов `app` (в CI не запускается: GitLab
  выполняет только `ng build --localize` и тесты). Сборки по локалям (исходная `en`, `he`, `fr`)
  через `$localize`. `html[dir]` ставит в рантайме `core/services/localization.service.ts`.
  Глобальный фон `#e4e7ed` задаёт правило `html {}` в `src/styles.scss`. `.scratch/` клиента в
  `.gitignore`.
- **Вендорный кит уже есть:** `src/app/pages/dashboard/apartment-changes-new/ok-kit/`. Это часть
  другого репозитория (`C:\vplans\ui-kit`, Angular 22, коммит `edfe4b7`), переименованная на
  префикс `ok`, с 8 патчами, перечисленными в её `VENDORED.md`. Она самодостаточна: импорты
  относительные, в `tsconfig`, `angular.json` и `app.module` ничего нет. У неё два потребителя:
  - `shared/cases/price-quotes-case` использует `<ok-select searchable creatable clearable
    size="sm" [maxLength] [formControl]>` с `ok-option`;
  - `shared/apartment-changes-dialog` рисует `<ok-tokens />` (компонент без инкапсуляции, который
    загружает токены, пока отрисован) и отдаёт `provideOkLabels` по `LOCALE_ID`.
- **В ok-kit-20 нет** вендорных патчей 5–7: `creatable` (в источнике он был у select и
  multi-select через базовый класс), `maxLength` у поля поиска и курсора-указателя у закрытого
  select с поиском.
- **Самодостаточная копия компилируется** (проверка 2026-10-14, client не менялся): все entry
  points без spec и stories скопированы как будто в `apartment-changes-new`, 117 импортов
  `@vplans/ui-kit/<entry>` переписаны на относительные пути. `ngc` с опциями `tsconfig.json`
  клиента (`strictTemplates`, `useDefineForClassFields: false`, `noUnusedLocals`,
  `noUnusedParameters`) даёт 0 ошибок, а подложенную ошибку типов ловит. Все 58 стилей компонентов
  собираются `sass` из нового места без `includePaths`.
- **Глобальный CSS клиента** — это Bootstrap 4.6 (около 220 правил reboot по тегам),
  `styles.scss` (правил по тегам почти нет: фон, шрифт и `letter-spacing: -0.01em` на
  `html`/`body`, переменные `--mat-*`, полосы прокрутки; тема Material на `#4285f4` действует
  только на `mat-*`), а также `ol.css` и `ckeditor5.css` (ограничены `.ol-*`/`.ck-*`). Имена
  классов не пересекаются: у кита только `ui-`.
- **Кит проигрывает глобальным правилам хоста** (проверка в браузере 2026-10-14, тикет 01:
  собранный глобальный CSS клиента, подключённый первым к каждой story в светлой теме RTL, изменил
  266 из 306): `body { text-align: left }` из reboot наследуется и ломает выравнивание в RTL
  (подсказка поля, кнопка формы), `label { margin-bottom }` добавляет 8px под лейблами и
  поднимает галочки в таблице, `svg { vertical-align: middle }` сдвигает иконки. Унаследованные
  `color`/`letter-spacing` почти не видны.
- **Конфликты полного `ui-kit.scss`:**
  - `_base.scss` задаёт шрифт, цвет, line-height и фон на `:root`. Это перебивает правило
    `html {}` клиента и перекрашивает всё приложение;
  - `tokens.css` (строка 305) переключается в тёмные токены по `prefers-color-scheme: dark`, а
    клиент только светлый;
  - `styles.scss:688` задаёт `.cdk-overlay-pane { max-width/max-height: unset !important }`, и
    диалог кита теряет отступ от края экрана. В пилоте диалога нет.

## Решения (пользователь, 2026-10-14)

1. **Экран пилота** — `settings/action-weights-section` (474 строки): `mat-checkbox`, числовой
   ввод с `%`, две второстепенные кнопки, основная кнопка с loading, `mat-spinner`, проверка
   «сумма = 100%», один query и одна mutation, только для админов. Обёртка `ac-settings-section`
   и `MatSnackBar` остаются.
2. **Общие файлы клиента не меняются.** `tsconfig*.json`, `angular.json`, `.eslintrc.json`,
   `package.json`, `src/styles.scss` и корневые провайдеры остаются как есть. Все изменения в
   клиенте — внутри `src/app/pages/dashboard/apartment-changes-new/`.
3. **Кит — самодостаточная копия в `apartment-changes-new/ui-kit/`**, её пишет скрипт копирования
   в ките (`scripts/sync-to-client.mjs`). Скрипт переписывает импорты между entry points на
   относительные пути — это его единственное преобразование. Копию руками не правят: исправление
   идёт в кит и синхронизируется заново.
4. **Каждый потребитель сам подключает то, что нужно киту:** `<ui-embed-styles />` без
   инкапсуляции в его шаблоне загружает встраиваемые стили, а `provideUiLabels` по `LOCALE_ID`
   стоит в его собственных `providers`.
5. **Кит поставляет встраиваемые стили и их загрузчик:** `styles/ui-kit-embed.scss` (токены без
   dark-блока ОС и layout-классы; без `_base` и типографики) и компонент `ui-embed-styles`,
   который их загружает. Кит сам устойчив к глобальному CSS хоста: корни компонентов задают
   `text-align: start`, а его `label` и `svg` сами задают margin, display и вертикальное
   выравнивание. Проверка CSS хоста (фикстура с Bootstrap reboot) входит в `/phase-check`.
6. **Вендорный `ok-kit` заменяется в рамках пилота:** патчи 5–7 переносятся в ok-kit-20, оба
   потребителя переходят на копию, папка `ok-kit` удаляется.
7. **Тесты без общих файлов:** `test:price-quotes` продолжает работать, потому что его tsconfig
   находит файлы по импортам. Спек action-weights запускается через tsconfig в `.scratch/client-pilot/`
   клиента (в `.gitignore`) командой `ng test --ts-config=…`.
8. **Работа в client идёт в своей ветке** (`feat/ui-kit-pilot` от `master` клиента) по
   `AGENTS.md` клиента. Без одобрения пользователя ничего не пушится.
9. **Ведётся как фаза:** раздел в ROADMAP, тикеты ниже, `/phase-check` для кита, сборка и тесты
   клиента, отчёт и одобрение.

## Тикеты

(01, 02, 03) → 04 → (05, 06) → 07. См. `issues/`.

## Вне рамок

- Другие экраны `apartment-changes-new`. Следующими по обзору идут `create-quote-item-dialog` и
  `deadline-dialog` → `schedule-dialog`; они ждут отчёта пилота.
- Кит вне `apartment-changes-new` и любые изменения общих файлов клиента.
- Диалоги кита в клиенте и конфликт `.cdk-overlay-pane !important`: их время придёт с первым
  экраном, где есть диалог.
- Замена `MatSnackBar` на `ui-toast`.
- `C:\vplans\ui-kit` (репозиторий на Angular 22) и любая синхронизация с ним.
