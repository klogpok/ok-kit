# 03: sync script into the client

**Status:** done
**Blocked by:** None

Spec decision 3. `pnpm sync:client [target]` runs `scripts/sync-to-client.mjs`. The default target
is `../client/src/app/pages/dashboard/apartment-changes-new/ui-kit`. The script never writes
outside the target.

- [x] Mirror every entry point of `projects/ui-kit/` that has a `public-api.ts` (including
  `testing` and the internal `listbox`), plus `styles/`, into the target with the same layout. Skip
  `*.spec.ts`, `*.stories.ts`, `ng-package.json`, `package.json`, `tsconfig*.json`, `.storybook/`,
  `docs/`, `src/`, `test-setup*`, `tokens/` sources and anything else that only serves the kit's
  build. Files removed from the kit are removed from the target.
- [x] Rewrite every `'@vplans/ui-kit/<entry>'` import to the relative `'../<entry>/public-api'`
  (computed from the file's folder). That is the only transformation. Fail if an import of
  `@vplans/ui-kit` remains outside a comment.
- [x] Write `<target>/SYNCED.md`: "generated, do not edit", the source commit hash and whether the
  kit's working tree was dirty, the command to sync again, and how a consumer loads the kit
  (`<ui-embed-styles />`, `provideUiLabels`). Refuse to write into a target that has files the
  script did not create, unless they are its own previous output (detect by `SYNCED.md`).
- [x] `--check`: exit non-zero when the target differs from what a sync would write.
- [x] `--verify`: copy into a temporary folder under `dist/`, compile it with `ngc` using the
  options of the client's `tsconfig.json` (read from the client, `noEmit`), and compile every
  component stylesheet with `sass` without `includePaths`. This repeats the check of 2026-10-14
  (0 errors, 58 stylesheets).
- [x] README "Consuming the kit" section: the command, what a consumer adds, and the rule that a
  fix goes into the kit, never into the copy. Add the gotcha to the matching `.claude/rules/` file.
- [x] Commit `chore(scripts): sync the kit into the client`.

## Comments

**2026-10-16 - done.** Commit `chore(scripts): sync the kit into the client`.

- **Layout.** `scripts/sync-to-client.mjs` is the command line; the logic is in
  `scripts/sync-to-client.lib.mjs` (`planSync`, `rewriteImports`, `syncTarget`, `checkTarget`,
  `renderSyncedMd`) and is tested by `scripts/sync-to-client.test.mjs` with `node --test` against
  fixture folders: 13 tests, new command `pnpm test:scripts`. The repo had no script tests before;
  `node:test` needs no dependency.
- **The copy:** 237 files (160 `.ts`, 72 `.scss`, 3 `.html`, 1 `.css`, `SYNCED.md`) in 41 entry
  folders plus `styles/`, 117 imports rewritten, the same count as the check of 2026-10-14. Files
  skipped: specs, stories, `ng-package.json`, `package.json`, `tsconfig*.json`, `*.md`/`*.mdx`, and
  the folders `src/`, `docs/`, `tokens/`, `test-setup*` and any dot folder.
- **The rewrite** parses each `.ts` file with the TypeScript parser and rewrites only module
  specifiers (`import`/`export … from`, `import()`, `import('…')` types), so comments stay as they
  are (the `listbox/public-api.ts` comment still names `@vplans/ui-kit/select`). Any other string
  or template literal naming `@vplans/ui-kit`, or a bare `'@vplans/ui-kit'`, fails the sync with
  the file and line. A file inside the entry it imports gets `./public-api`.
- **Safety.** Every path is checked to stay inside the target before anything is written; the
  target's parent folder must exist (a wrong path fails instead of creating folders), and a
  non-empty target needs this script's `SYNCED.md` (recognized by its first-line marker).
- **Decision (for the user to confirm): a target with `SYNCED.md` is mirrored as a whole.** A file
  added there by hand is deleted on the next sync, as a file removed from the kit is; `--check`
  lists it as `extra` first. The alternative was a manifest of written files in `SYNCED.md` and a
  refusal on any unlisted file; with "the copy is never edited by hand" that seemed only extra
  noise in `SYNCED.md`.
- **`--check`** compares every file byte for byte, except the source line of `SYNCED.md`: a new
  kit commit with no change to the copied files does not make the copy stale. A sync always
  rewrites that line. It prints `missing`/`differs`/`extra` per path and exits 1.
- **`--verify`** syncs into `dist/client-sync-verify/ui-kit`, writes a tsconfig from the client's
  `tsconfig.json` (read with the TypeScript config reader; `baseUrl` dropped, `noEmit`), runs
  `ngc` over the 41 `public-api.ts` files, then compiles every non-partial `.scss` of the copy with
  the `sass` of `@angular/build`. Result: **0 errors, 59/59 stylesheets.** 59, not 58: the
  2026-10-14 copy had no `styles/ui-kit-embed.scss` yet (ticket 01). A planted type error in the
  copy is reported by `ngc` (exit 1, `TS2322`). The client is found next to the main checkout
  (`git rev-parse --git-common-dir`), so the default also works from a worktree; `--client <path>`
  names another one. The client is only read.
- **Checked by hand:** a sync into `dist/sync-target/ui-kit` (237 added), `--check` exit 0; after a
  hand edit and an added file `--check` exit 1 (`differs button/button.ts`, `extra core/extra.ts`);
  a sync again (1 changed, 1 removed) and `--check` exit 0; a folder with a foreign file is refused.
  The real client was not written to; ticket 04 runs the first sync there.
- **Docs.** README "Consuming the kit" (the commands, what the copy holds, what a consumer adds,
  "a fix goes into the kit, never into the copy") and two rows in the Scripts table. The gotcha is
  in `.claude/rules/components.md` → "The client copy": cross-entry imports only as module
  specifiers, runtime code only in entry folders or `styles/`, fixes never in the copy.
- **Checks:** `pnpm test:scripts` 13/13, `pnpm lint` and `pnpm format:check` clean,
  `pnpm sync:client --verify` 0 errors and 59/59.

**2026-10-18 - review fixes.** Branch `client-pilot-review` (kit worktree
`.claude/worktrees/review-fixes`):

- `fix(scripts): sync compares non-UTF-8 files by bytes`. The CRLF-tolerant comparison of ticket
  10 decoded every file without a NUL byte as UTF-8, so two different files that are not valid
  UTF-8 could compare equal once their invalid bytes became U+FFFD. Line endings are now
  normalized only when the bytes are valid UTF-8 (`TextDecoder` with `fatal`, `ignoreBOM` so
  a byte order mark still counts); anything else is compared byte for byte. Regression test first.
- `chore(scripts): rename test:scripts to test-scripts`: a colon marks a variant
  (`test-visual:update`); README, ROADMAP and the test file follow. Older comments keep the old
  name as history.
- `refactor(scripts): sync script cleanups`: one `sortedByKey` helper, one line-number helper in
  `rewriteImports`, one folder skip predicate (dot folders, `test-setup*`, `src`, `docs`,
  `tokens`, `node_modules`) applied at the top of the kit and inside an entry alike (the kit has
  no nested folder of those names, so the copy is the same), `diff(plan, existing, {
  ignoreSourceLine })` instead of a boolean, and the default client resolved inside the `try`,
  so a git or argument error prints with the `sync-to-client:` prefix.
- **Checks:** `pnpm test-scripts` 15/15, `pnpm lint`, `pnpm format:check`; `pnpm sync:client
  --verify` 0 errors, 59/59; a sync into a temp folder with the old and the new code: the same
  237 files byte for byte, only the source commit line of `SYNCED.md` differs.

## Русский перевод

# 03: скрипт синхронизации в клиент

**Статус:** сделано
**Зависит от:** нет

Решение 3 спеки. `pnpm sync:client [target]` запускает `scripts/sync-to-client.mjs`. Цель по
умолчанию — `../client/src/app/pages/dashboard/apartment-changes-new/ui-kit`. Скрипт никогда не
пишет за пределы цели.

- [x] Зеркалить в цель каждый entry point из `projects/ui-kit/`, у которого есть `public-api.ts`
  (включая `testing` и внутренний `listbox`), и `styles/`, с той же структурой. Пропускать
  `*.spec.ts`, `*.stories.ts`, `ng-package.json`, `package.json`, `tsconfig*.json`, `.storybook/`,
  `docs/`, `src/`, `test-setup*`, исходники `tokens/` и всё, что нужно только сборке кита. Файлы,
  удалённые из кита, удаляются и из цели.
- [x] Переписать каждый импорт `'@vplans/ui-kit/<entry>'` на относительный
  `'../<entry>/public-api'` (от папки файла). Это единственное преобразование. Падать, если импорт
  `@vplans/ui-kit` остался вне комментария.
- [x] Писать `<target>/SYNCED.md`: «сгенерировано, не править», хеш коммита-источника, был ли
  рабочий каталог кита грязным, команда для повторной синхронизации и как потребитель подключает
  кит (`<ui-embed-styles />`, `provideUiLabels`). Отказываться писать в цель, где есть файлы не от
  скрипта, кроме его прошлого вывода (распознаётся по `SYNCED.md`).
- [x] `--check`: ненулевой код выхода, если цель отличается от того, что запишет синхронизация.
- [x] `--verify`: копия во временную папку в `dist/`, компиляция `ngc` с опциями `tsconfig.json`
  клиента (читаются из клиента, `noEmit`) и сборка стилей всех компонентов `sass` без
  `includePaths`. Повторяет проверку 2026-10-14 (0 ошибок, 58 стилей).
- [x] Раздел README «Consuming the kit»: команда, что добавляет потребитель и правило
  «исправление идёт в кит, а не в копию». Gotcha добавить в подходящий файл `.claude/rules/`.
- [x] Коммит `chore(scripts): sync the kit into the client`.

## Комментарии

**2026-10-16 - сделано.** Коммит `chore(scripts): sync the kit into the client`.

- **Устройство.** `scripts/sync-to-client.mjs` — командная строка; логика — в
  `scripts/sync-to-client.lib.mjs` (`planSync`, `rewriteImports`, `syncTarget`, `checkTarget`,
  `renderSyncedMd`), её проверяет `scripts/sync-to-client.test.mjs` через `node --test` на
  папках-фикстурах: 13 тестов, новая команда `pnpm test:scripts`. Раньше тестов скриптов в репо не
  было; `node:test` не требует зависимостей.
- **Копия:** 237 файлов (160 `.ts`, 72 `.scss`, 3 `.html`, 1 `.css`, `SYNCED.md`) в 41 папке
  entry points и `styles/`, переписано 117 импортов — столько же, сколько в проверке 2026-10-14.
  Пропускаются specs, stories, `ng-package.json`, `package.json`, `tsconfig*.json`, `*.md`/`*.mdx` и
  папки `src/`, `docs/`, `tokens/`, `test-setup*` и любые папки с точкой.
- **Переписывание** разбирает каждый `.ts` парсером TypeScript и меняет только спецификаторы
  модулей (`import`/`export … from`, `import()`, типы `import('…')`), так что комментарии не
  трогаются (комментарий в `listbox/public-api.ts` по-прежнему называет `@vplans/ui-kit/select`).
  Любая другая строка или шаблонная строка с `@vplans/ui-kit`, или голый `'@vplans/ui-kit'`,
  роняет синхронизацию с файлом и строкой. Файл внутри того entry, который он импортирует,
  получает `./public-api`.
- **Безопасность.** До любой записи каждый путь проверяется на то, что он внутри цели; родительская
  папка цели должна существовать (неверный путь падает, а не создаёт папки), а непустой цели нужен
  `SYNCED.md` этого скрипта (распознаётся по маркеру в первой строке).
- **Решение (пользователю подтвердить): цель с `SYNCED.md` зеркалится целиком.** Файл, добавленный
  туда руками, удаляется при следующей синхронизации, как и файл, удалённый из кита; `--check`
  сначала показывает его как `extra`. Альтернатива — манифест записанных файлов в `SYNCED.md` и
  отказ при любом файле вне списка; при правиле «копию руками не правят» это показалось лишним
  шумом в `SYNCED.md`.
- **`--check`** сравнивает каждый файл побайтно, кроме строки источника в `SYNCED.md`: новый
  коммит кита без изменений в копируемых файлах не делает копию устаревшей. Синхронизация эту
  строку всегда переписывает. Печатает `missing`/`differs`/`extra` по путям и выходит с кодом 1.
- **`--verify`** синхронизирует в `dist/client-sync-verify/ui-kit`, пишет tsconfig из
  `tsconfig.json` клиента (читается загрузчиком конфигов TypeScript; `baseUrl` убран, `noEmit`),
  запускает `ngc` по 41 `public-api.ts`, затем собирает каждый не-partial `.scss` копии `sass` из
  `@angular/build`. Итог: **0 ошибок, 59/59 стилей.** 59, а не 58: в копии 2026-10-14 ещё не было
  `styles/ui-kit-embed.scss` (тикет 01). Подложенную в копию ошибку типов `ngc` ловит (код 1,
  `TS2322`). Клиент ищется рядом с основной копией репо (`git rev-parse --git-common-dir`), так что
  цель по умолчанию верна и из worktree; `--client <path>` указывает другой. Клиент только читается.
- **Проверено руками:** синхронизация в `dist/sync-target/ui-kit` (237 добавлено), `--check` код 0;
  после ручной правки и добавленного файла `--check` код 1 (`differs button/button.ts`,
  `extra core/extra.ts`); повторная синхронизация (1 изменён, 1 удалён) и `--check` код 0; папка с
  чужим файлом отклоняется. В настоящий клиент ничего не писалось; первую синхронизацию туда делает
  тикет 04.
- **Документация.** README «Consuming the kit» (команды, что входит в копию, что добавляет
  потребитель, «исправление идёт в кит, а не в копию») и две строки в таблице Scripts. Gotcha — в
  `.claude/rules/components.md` → «The client copy»: импорты между entry points только как
  спецификаторы модулей, код для рантайма только в папках entry points или `styles/`, исправления
  никогда не в копии.
- **Проверки:** `pnpm test:scripts` 13/13, `pnpm lint` и `pnpm format:check` чисто,
  `pnpm sync:client --verify` — 0 ошибок и 59/59.

**2026-10-18 - исправления по ревью.** Ветка `client-pilot-review` (worktree кита
`.claude/worktrees/review-fixes`):

- `fix(scripts): sync compares non-UTF-8 files by bytes`. Сравнение с допуском CRLF из тикета 10
  декодировало как UTF-8 каждый файл без байта NUL, поэтому два разных файла, не являющихся
  корректным UTF-8, могли совпасть после замены неверных байтов на U+FFFD. Теперь окончания строк
  нормализуются только для корректного UTF-8 (`TextDecoder` с `fatal`, `ignoreBOM`, чтобы BOM
  по-прежнему считался); остальное сравнивается побайтно. Сначала регрессионный тест.
- `chore(scripts): rename test:scripts to test-scripts`: двоеточие обозначает вариант
  (`test-visual:update`); README, ROADMAP и файл тестов обновлены. В старых комментариях старое
  имя оставлено как история.
- `refactor(scripts): sync script cleanups`: один помощник `sortedByKey`, один помощник номера
  строки в `rewriteImports`, один предикат пропуска папок (папки с точкой, `test-setup*`, `src`,
  `docs`, `tokens`, `node_modules`) одинаково на верхнем уровне кита и внутри entry (вложенных
  папок с такими именами в ките нет, копия та же), `diff(plan, existing, { ignoreSourceLine })`
  вместо булева параметра, и клиент по умолчанию вычисляется внутри `try`, так что ошибка git или
  аргументов печатается с префиксом `sync-to-client:`.
- **Проверки:** `pnpm test-scripts` 15/15, `pnpm lint`, `pnpm format:check`; `pnpm sync:client
  --verify` 0 ошибок, 59/59; синхронизация во временную папку старым и новым кодом: те же 237
  файлов побайтно, отличается только строка коммита-источника в `SYNCED.md`.
