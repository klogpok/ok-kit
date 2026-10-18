# 06: replace the vendored ok-kit

**Status:** done
**Blocked by:** 02, 04

Spec decision 6, in the client branch of ticket 04. Sync the kit again first, so the copy has
ticket 02. No common file changes.

- [x] `shared/cases/price-quotes-case`: `ok-select`/`ok-option` → `ui-select`/`ui-option` from the
  copy, with `searchable creatable clearable size="sm" [maxLength] [formControl] [readonly]`;
  update its spec; `npm run test:price-quotes` passes with its tsconfig unchanged.
- [x] `shared/apartment-changes-dialog`: `<ok-tokens />` → `<ui-embed-styles />`,
  `provideOkLabels` → `provideUiLabels` with the same `LOCALE_ID` rule.
- [x] Delete `apartment-changes-new/ok-kit/`; a grep for `ok-kit`, `Ok[A-Z]`, `OK_` and `--ok-` in
  `src/` finds nothing.
- [x] `npx ng build -c production --localize` passes; the diff against `master` is still only under
  `apartment-changes-new/`.
- [x] Browser: the price quotes case in he/RTL and en/LTR: search, create a location, clear,
  readonly, the length limit; compare with the old look and list visible differences in the report
  (the token sheets differ by about 170 lines).
- [x] Commit in the client, e.g. `refactor(price-quotes): @vplans/ui-kit instead of the vendored
  ok-kit`.

## Comments

**2026-10-18 - done.** Client commit `3c56d79a8` `refactor(price-quotes): @vplans/ui-kit instead of
the vendored ok-kit` on `feat/ui-kit-pilot-06` (from `feat/ui-kit-pilot` `6b270e1ab`; merging
`feat/ui-kit-pilot` back in: already up to date), worktree
`C:\vplans\worktrees\client\ui-kit-pilot-06`, not pushed.

- **Copy.** No resync: `pnpm sync:client <worktree>\…\apartment-changes-new\ui-kit --check` matches
  the kit (237 files), so it already has ticket 02.
- **Price quotes case.** `OkSelect`/`OkOption` → `UiSelect`/`UiOption` from
  `../../../ui-kit/select/public-api`, the same inputs; the SCSS override is now
  `--ui-focus-ring-width: 1px`.
- **Spec (test first).** The location block reads the cell through `UiSelectHarness` (copy's
  `testing` entry) instead of `By.directive(OkSelect)`, `.ok-select__*` classes and the overlay's
  `ok-option` elements: `open`, `getOptions`, `clickOptions`, `search`, `create`, `clear`,
  `getValueText`, `isReadonly`. Two cases were added: clear saves `null`, a published quote's cell
  is readonly. `provideOkLabels(OK_LABELS_EN)` → `provideUiLabels(UI_LABELS_EN)`. Red against the
  ok-select template (10 failed: no `.ui-select`), then green after the migration:
  `test:price-quotes` 99/99 (tsconfig unchanged). The CLI ran as
  `node node_modules/@angular/cli/bin/ng.js test …` (npm refuses the pnpm 11 `devEngines`).
- **Dialog.** `<ui-embed-styles />` from `ui-kit/theme`, and
  `provideUiLabels(() => (inject(LOCALE_ID).startsWith('he') ? UI_LABELS_HE : UI_LABELS_EN))`.
- **Grep.** Scoped to `apartment-changes-new/` (user decision): no hit in code. Left: base64 noise in
  `shared/ac-pdf-editor/jbig2-wasm.data.ts` (`OkE`, `OkI`… inside the wasm string, also on
  `master`) and the kit repo name `ok-kit-20` in the generated `ui-kit/SYNCED.md`. Unrelated hits
  elsewhere in `src/` that stay: `crm/api-call-generator/**/*.scss` (`--ok-050`, `--ok-100`),
  `crm/marketing-activity-report` scss (`--ok-soft`), `OK_METHODS` (`crm/flow-builder/flow.types.ts`,
  `flow-props.component.ts`), `OK_SECRET` (`crm-settings/webhook-management/
  webhook-verify-example.component.ts`), `OK_LIMIT` (`service-calls-excel-import-wizard`),
  `OK_STORAGE_KEY`/`OK_*_BASE_URL` (`shared/calendar-invite/*`).
- **Build.** `ng build -c production --localize`: exit 0, 272 s. Warnings as in ticket 04 (11
  budget, the "not ESM" modules, 14791 "No translation found"), none from the copy.
  `git diff --stat master`: 267 files, all under `apartment-changes-new/` (237 copy files added,
  the `ok-kit` folder deleted, 6 consumer files). No `src/languages/*.xlf` change, no new i18n id.
- **Browser: handed to the user.** No backend or credentials here, and 4200 is the user's server,
  so the checkbox means "checklist handed over", not "checked". Checklist, in he/RTL and en/LTR
  (table control → an apartment → "Price quotes" → open a quote):
  1. the location cell looks like the other inputs of the row (sm height, 1px focus ring);
  2. type part of a name: the list filters; Enter or a click picks it and saves;
  3. type a new name and pick "הוספת «…»" / "Add «…»": it is saved and shown, Hebrew label with
     Latin or digits in it keeps its order;
  4. the × button clears the cell and saves an empty location;
  5. a published or paid quote: the cell is readonly (default cursor, no list, no ×);
  6. paste or type more than 255 characters: the field stops at 255;
  7. the list panel is aligned to the start side (right in he, left in en) and above the dialog;
  8. compare with the old look on `master`.
- **Visible differences derived from the code.** The light token values the select uses are the
  same: of the old sheet's `:root` and component tokens, 2 changed (spinner stroke width ×1.25,
  table cell padding through a new default token), 59 added (chip variants, tree, motion, layout)
  and 14 removed (old chip tokens); none is read by `ui-select`/`ui-option`. Expected differences:
  the trigger now sets `text-align: start` (a Bootstrap `body { text-align: left }` could leak into
  the old trigger in he); the × button sets `font: inherit` against the reboot; the Hebrew "Add"
  label isolates the typed text (FSI…PDI); the embed sheet also brings the kit's layout classes
  (unused here). Panel and option styles are otherwise the same.
- **Open.** None blocking. The spec run prints `NG0956` (track by identity) when the project's
  options change; it is the template's existing `track name`, not from the kit.

## Русский перевод

# 06: заменить вендорный ok-kit

**Статус:** сделано
**Зависит от:** 02, 04

Решение 6 спеки, в ветке клиента из тикета 04. Сначала синхронизировать кит заново, чтобы в копии
был тикет 02. Общие файлы не меняются.

- [x] `shared/cases/price-quotes-case`: `ok-select`/`ok-option` → `ui-select`/`ui-option` из
  копии, с `searchable creatable clearable size="sm" [maxLength] [formControl] [readonly]`;
  обновить его спек; `npm run test:price-quotes` проходит с неизменным tsconfig.
- [x] В `shared/apartment-changes-dialog`: `<ok-tokens />` → `<ui-embed-styles />`,
  `provideOkLabels` → `provideUiLabels` с тем же правилом по `LOCALE_ID`.
- [x] Удалить `apartment-changes-new/ok-kit/`; grep по `ok-kit`, `Ok[A-Z]`, `OK_` и `--ok-` в
  `src/` ничего не находит.
- [x] `npx ng build -c production --localize` проходит; diff с `master` по-прежнему только внутри
  `apartment-changes-new/`.
- [x] Браузер: кейс ценовых предложений в he/RTL и en/LTR: поиск, создание локации, очистка,
  readonly, ограничение длины; сравнить со старым видом и перечислить заметные различия в отчёте
  (таблицы токенов расходятся примерно на 170 строк).
- [x] Коммит в клиенте, например `refactor(price-quotes): @vplans/ui-kit instead of the vendored
  ok-kit`.

## Комментарии

**2026-10-18 - сделано.** Коммит клиента `3c56d79a8` `refactor(price-quotes): @vplans/ui-kit
instead of the vendored ok-kit` в `feat/ui-kit-pilot-06` (от `feat/ui-kit-pilot` `6b270e1ab`; слияние
`feat/ui-kit-pilot` обратно: уже актуально), worktree `C:\vplans\worktrees\client\ui-kit-pilot-06`,
не запушен.

- **Копия.** Без пересинхронизации: `pnpm sync:client <worktree>\…\apartment-changes-new\ui-kit
  --check` совпадает с китом (237 файлов), тикет 02 в ней уже есть.
- **Кейс ценовых предложений.** `OkSelect`/`OkOption` → `UiSelect`/`UiOption` из
  `../../../ui-kit/select/public-api`, те же inputs; переопределение в SCSS теперь
  `--ui-focus-ring-width: 1px`.
- **Спек (сначала тест).** Блок локаций читает ячейку через `UiSelectHarness` (entry `testing`
  копии) вместо `By.directive(OkSelect)`, классов `.ok-select__*` и элементов `ok-option` оверлея:
  `open`, `getOptions`, `clickOptions`, `search`, `create`, `clear`, `getValueText`, `isReadonly`.
  Добавлены два случая: очистка сохраняет `null`, ячейка опубликованного предложения — readonly.
  `provideOkLabels(OK_LABELS_EN)` → `provideUiLabels(UI_LABELS_EN)`. Красный на шаблоне с
  ok-select (10 падений: нет `.ui-select`), затем зелёный после миграции: `test:price-quotes` 99/99
  (tsconfig не менялся). CLI запускался как `node node_modules/@angular/cli/bin/ng.js test …` (npm
  отказывает из-за `devEngines` pnpm 11).
- **Диалог.** `<ui-embed-styles />` из `ui-kit/theme` и
  `provideUiLabels(() => (inject(LOCALE_ID).startsWith('he') ? UI_LABELS_HE : UI_LABELS_EN))`.
- **Grep.** Ограничен `apartment-changes-new/` (решение пользователя): в коде совпадений нет.
  Остались: шум base64 в `shared/ac-pdf-editor/jbig2-wasm.data.ts` (`OkE`, `OkI`… внутри строки
  wasm, есть и на `master`) и имя репозитория кита `ok-kit-20` в сгенерированном
  `ui-kit/SYNCED.md`. Несвязанные совпадения в остальном `src/`, которые остаются:
  `crm/api-call-generator/**/*.scss` (`--ok-050`, `--ok-100`), scss
  `crm/marketing-activity-report` (`--ok-soft`), `OK_METHODS` (`crm/flow-builder/flow.types.ts`,
  `flow-props.component.ts`), `OK_SECRET` (`crm-settings/webhook-management/
  webhook-verify-example.component.ts`), `OK_LIMIT` (`service-calls-excel-import-wizard`),
  `OK_STORAGE_KEY`/`OK_*_BASE_URL` (`shared/calendar-invite/*`).
- **Сборка.** `ng build -c production --localize`: exit 0, 272 с. Предупреждения как в тикете 04
  (11 бюджетных, модули «not ESM», 14791 «No translation found»), ни одного из копии.
  `git diff --stat master`: 267 файлов, все внутри `apartment-changes-new/` (237 файлов копии
  добавлены, папка `ok-kit` удалена, 6 файлов потребителей). Ни `src/languages/*.xlf`, ни новых
  i18n id.
- **Браузер: передан пользователю.** Здесь нет бэкенда и учётных данных, а 4200 — сервер
  пользователя, поэтому галочка означает «чек-лист передан», а не «проверено». Чек-лист, в he/RTL и
  en/LTR (table control → квартира → «Ценовые предложения» → открыть предложение):
  1. ячейка локации выглядит как остальные поля строки (высота sm, кольцо фокуса 1px);
  2. набрать часть имени: список фильтруется; Enter или клик выбирает и сохраняет;
  3. набрать новое имя и выбрать «הוספת «…»» / «Add «…»»: сохраняется и показывается; в иврите
     латиница и цифры внутри подписи не меняют порядок;
  4. кнопка × очищает ячейку и сохраняет пустую локацию;
  5. опубликованное или оплаченное предложение: ячейка readonly (обычный курсор, нет списка, нет ×);
  6. вставить или набрать больше 255 символов: поле останавливается на 255;
  7. панель списка выровнена по начальной стороне (справа в he, слева в en) и поверх диалога;
  8. сравнить со старым видом на `master`.
- **Заметные различия по коду.** Значения светлых токенов, которые читает select, те же: из
  `:root` и компонентных токенов старой таблицы 2 изменены (толщина штриха спиннера ×1.25, отступ
  ячейки таблицы через новый токен по умолчанию), 59 добавлены (варианты chip, tree, motion, layout)
  и 14 удалены (старые токены chip); ни один не читается `ui-select`/`ui-option`. Ожидаемые
  различия: триггер теперь задаёт `text-align: start` (в he в старый триггер мог протечь
  `body { text-align: left }` из Bootstrap); кнопка × задаёт `font: inherit` против reboot; подпись
  «Добавить» на иврите изолирует набранный текст (FSI…PDI); embed-таблица приносит и layout-классы
  кита (здесь не используются). Стили панели и опций в остальном те же.
- **Открыто.** Ничего блокирующего. Прогон спека печатает `NG0956` (track by identity) при смене
  опций проекта; это существующий `track name` шаблона, не кит.
