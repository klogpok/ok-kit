# 04: put the copy into apartment-changes-new

**Status:** done
**Blocked by:** 01, 03

In `C:\vplans\client`, on branch `feat/ui-kit-pilot` from its `master`. Follow the client's
`AGENTS.md`. Spec decision 2: no common file changes. Do not push.

- [x] `pnpm sync:client` from the kit writes `apartment-changes-new/ui-kit/`; `sync:client --verify`
  passes.
- [x] `git -C C:\vplans\client diff --stat master` lists only paths under
  `src/app/pages/dashboard/apartment-changes-new/`.
- [x] `npx ng build -c production --localize` (the CI command) passes. The copy is not imported
  yet, so this proves only that its presence breaks nothing; ticket 05 proves it compiles in the
  app.
- [x] Commit in the client, e.g. `chore(ac): add a synced copy of @vplans/ui-kit`.

## Comments

**2026-10-18 - done.** Client commit `6b270e1ab` `chore(ac): add a synced copy of @vplans/ui-kit`
on `feat/ui-kit-pilot` (from client `master` `c01b93e56`), not pushed.

- **Where.** The main client checkout `C:\vplans\client` is the user's work on
  `ziv-compare-report` with a dev server on 4200, so it was not touched. The branch lives in a new
  worktree `C:\vplans\worktrees\client\ui-kit-pilot`; its `node_modules` is a junction to
  `C:\vplans\client\node_modules`, as in `ac-assignable-users` (master's lockfile matches the
  installed deps). This worktree is the client's integration branch for tickets 05 and 06.
- **Sync.** From the kit at `e57f22c`, with an explicit target and `--client` (the default target is
  the main checkout): 237 files added, 117 imports rewritten. `--verify` with that client: 41 entry
  points, 0 `ngc` errors, 59/59 stylesheets. `--check`: matches (237 files).
- **Diff.** `git diff --stat master`: 237 files, 29214 insertions, all under
  `src/app/pages/dashboard/apartment-changes-new/ui-kit/`.
- **Build.** `npx ng build -c production --localize` fails before building: the client's
  `devEngines.packageManager` requires pnpm 11 and npm refuses (`EBADDEVENGINES`). CI runs
  `pnpm exec ng build -c "production" --localize`; the same CLI was run as
  `node node_modules/@angular/cli/bin/ng.js build -c production --localize`: exit 0, 228 s. Warnings,
  none from the copy (it is not imported, so not in the bundle): 11 budget warnings (initial 5.55 MB
  of 4 MB, ten chunks over 1 MB), 30 "is not ESM" (canvg, moment, html2canvas and others), 14791
  "No translation found".
- **Found: line endings break `--check` in the client.** The client has no `.gitattributes` and Git
  for Windows sets `core.autocrlf=true`, so a checkout writes the copy with CRLF (the index holds
  LF). `--check` compares bytes: a file checked out again by git is reported as `differs`
  (reproduced on `button/button.ts`, then synced back). Every fresh checkout of the branch
  (another worktree, a teammate) will fail `--check` on all 237 files though the content matches.
  A sync writes LF again and git sees no change. Fix in the kit (follow-up): compare with line
  endings normalized, or have the copy carry its own `.gitattributes` (`* text eol=lf`).

## Русский перевод

# 04: положить копию в apartment-changes-new

**Статус:** сделано
**Зависит от:** 01, 03

В `C:\vplans\client`, в ветке `feat/ui-kit-pilot` от его `master`. По `AGENTS.md` клиента.
Решение 2 спеки: общие файлы не меняются. Не пушить.

- [x] `pnpm sync:client` из кита пишет `apartment-changes-new/ui-kit/`; `sync:client --verify`
  проходит.
- [x] `git -C C:\vplans\client diff --stat master` показывает только пути внутри
  `src/app/pages/dashboard/apartment-changes-new/`.
- [x] `npx ng build -c production --localize` (команда CI) проходит. Копию ещё никто не
  импортирует, так что это доказывает только, что её наличие ничего не ломает; что она
  компилируется в приложении, доказывает тикет 05.
- [x] Коммит в клиенте, например `chore(ac): add a synced copy of @vplans/ui-kit`.

## Комментарии

**2026-10-18 - сделано.** Коммит клиента `6b270e1ab` `chore(ac): add a synced copy of
@vplans/ui-kit` в `feat/ui-kit-pilot` (от `master` клиента `c01b93e56`), не запушен.

- **Где.** Основная копия клиента `C:\vplans\client` — работа пользователя в `ziv-compare-report` с
  dev-сервером на 4200, её не трогали. Ветка живёт в новом worktree
  `C:\vplans\worktrees\client\ui-kit-pilot`; его `node_modules` — junction на
  `C:\vplans\client\node_modules`, как в `ac-assignable-users` (lockfile master совпадает с
  установленными зависимостями). Этот worktree — интеграционная ветка клиента для тикетов 05 и 06.
- **Синхронизация.** Из кита на `e57f22c`, с явной целью и `--client` (цель по умолчанию — основная
  копия): добавлено 237 файлов, переписано 117 импортов. `--verify` с этим клиентом: 41 entry point,
  0 ошибок `ngc`, 59/59 стилей. `--check`: совпадает (237 файлов).
- **Diff.** `git diff --stat master`: 237 файлов, 29214 вставок, все внутри
  `src/app/pages/dashboard/apartment-changes-new/ui-kit/`.
- **Сборка.** `npx ng build -c production --localize` падает до сборки: `devEngines.packageManager`
  клиента требует pnpm 11, и npm отказывается (`EBADDEVENGINES`). CI запускает
  `pnpm exec ng build -c "production" --localize`; тот же CLI запущен как
  `node node_modules/@angular/cli/bin/ng.js build -c production --localize`: код 0, 228 с.
  Предупреждения, ни одного от копии (её не импортируют, в бандл она не входит): 11 о бюджетах
  (initial 5.55 MB при 4 MB, десять чанков больше 1 MB), 30 «is not ESM» (canvg, moment,
  html2canvas и др.), 14791 «No translation found».
- **Найдено: переводы строк ломают `--check` в клиенте.** У клиента нет `.gitattributes`, а Git for
  Windows ставит `core.autocrlf=true`, поэтому checkout пишет копию с CRLF (в индексе LF). `--check`
  сравнивает байты: файл, заново выгруженный git, получает `differs` (воспроизведено на
  `button/button.ts`, затем синхронизировано обратно). Любая свежая выгрузка ветки (другой worktree,
  коллега) провалит `--check` на всех 237 файлах при совпадающем содержимом. Синхронизация снова
  пишет LF, и git не видит изменений. Исправлять в ките (follow-up): сравнивать с нормализованными
  переводами строк или класть в копию свой `.gitattributes` (`* text eol=lf`).
