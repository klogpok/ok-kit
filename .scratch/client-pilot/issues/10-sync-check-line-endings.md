# 10: sync --check ignores line endings

**Spec:** [../spec.md](../spec.md), tickets 03 and 04

**Status:** done
**Blocked by:** None

**Facts:** ticket 04 (→ Comments) found that `pnpm sync:client --check` (`scripts/sync-to-client.mjs`
and `.lib.mjs`, ticket 03) compares bytes. The client has no `.gitattributes`, and Git for Windows
runs with `core.autocrlf=true`, so the committed copy (LF in the index) is checked out with CRLF.
Every fresh checkout of the client branch (another worktree, a teammate) then reports all 237
files as `differs` though their content matches the kit. A sync on such a checkout rewrites all
237 files with LF.

- [x] A failing test first in `scripts/sync-to-client.test.mjs`: a target whose text files have
  CRLF passes `--check`; a real content change still fails it.
- [x] `--check` compares text with line endings normalized.
- [x] A sync does not rewrite a file that differs only in line endings; check what `git status`
  reports after such a rewrite.
- [x] Decide whether the copy also carries a `.gitattributes`, and justify it here.
- [x] README "Consuming the kit" and the `.claude/rules/` gotcha describe the behavior.
- [x] `pnpm test:scripts`, `pnpm lint`, `pnpm format:check`, `node scripts/check-scratch.mjs`.
  Nothing is written into the client; tests use temporary targets.
- [x] Commit `fix(scripts): sync check ignores line endings`.

## Comments

**2026-10-18 - done.** Commit `003d1d0` `fix(scripts): sync check ignores line endings`.

- **Fix.** `diff` in `sync-to-client.lib.mjs` (used by both `checkTarget` and `syncTarget`) compares
  each file with CRLF read as LF; a file with a NUL byte counts as binary and is compared as is
  (the copy has none today: `.ts`, `.scss`, `.html`, `.css`, `SYNCED.md`). So `--check` matches a
  CRLF checkout, and a sync leaves alone a file that differs only in line endings. A file the kit
  really changed is still reported and written with the kit's LF.
- **Why the sync must not rewrite.** Checked with Git 2.38.1 for Windows, `core.autocrlf=true`:
  after a committed LF file is checked out (CRLF) and rewritten with LF, `git status` reports it as
  ` M` even after `git update-index --refresh`, while `git diff` shows nothing. The old sync on a
  fresh client checkout therefore marked all 237 files as modified (ticket 04 looked at the diff,
  which is empty).
- **No `.gitattributes` in the copy.** A `* text eol=lf` there would also fix `--check`, but: it
  changes how the client's git treats a folder of its repo, which the client's own files nowhere do;
  on checkouts that already hold the CRLF copy, git reports those files as modified until they are
  checked out again; and it would be a file the kit does not have, an exception to "the copy is
  the kit's files". The normalized comparison fixes the reported bug without touching the client's
  git settings, so the copy stays as it is. If the client ever adds a `.gitattributes`, nothing
  here needs to change.
- **Tests.** New test "treats a CRLF checkout of the copy as matching, and leaves its files alone":
  red before the fix (the check reported both files as changed), green after. `pnpm test:scripts`
  14/14. By hand: a sync into `dist/crlf-test/ui-kit`, every file converted to CRLF, then `--check`
  matches (237 files, exit 0) and a sync reports 0 changed; the folder was removed. Nothing was
  written into the client.
- **Docs.** README "Consuming the kit" (a paragraph on line endings) and a bullet in
  `.claude/rules/components.md` → "The client copy".
- **Checks.** `pnpm lint` and `pnpm format:check` clean, `node scripts/check-scratch.mjs` passes.

## Русский перевод

# 10: sync --check не учитывает переводы строк

**Спека:** [../spec.md](../spec.md), тикеты 03 и 04

**Статус:** сделано
**Зависит от:** нет

**Факты:** тикет 04 (→ Комментарии) обнаружил, что `pnpm sync:client --check`
(`scripts/sync-to-client.mjs` и `.lib.mjs`, тикет 03) сравнивает байты. У клиента нет
`.gitattributes`, а Git for Windows работает с `core.autocrlf=true`, поэтому закоммиченная копия (в
индексе LF) выгружается с CRLF. Любая свежая выгрузка ветки клиента (другой worktree, коллега)
показывает все 237 файлов как `differs`, хотя содержимое совпадает с китом. Синхронизация в такую
выгрузку переписывает все 237 файлов с LF.

- [x] Сначала падающий тест в `scripts/sync-to-client.test.mjs`: цель, у текстовых файлов которой
  CRLF, проходит `--check`; настоящее изменение содержимого по-прежнему его проваливает.
- [x] `--check` сравнивает текст с нормализованными переводами строк.
- [x] Синхронизация не переписывает файл, который отличается только переводами строк; проверить,
  что показывает `git status` после такой перезаписи.
- [x] Решить, кладёт ли копия ещё и `.gitattributes`, и обосновать здесь.
- [x] README «Consuming the kit» и gotcha в `.claude/rules/` описывают поведение.
- [x] `pnpm test:scripts`, `pnpm lint`, `pnpm format:check`, `node scripts/check-scratch.mjs`. В
  клиент ничего не пишется; тесты используют временные цели.
- [x] Коммит `fix(scripts): sync check ignores line endings`.

## Комментарии

**2026-10-18 - сделано.** Коммит `003d1d0` `fix(scripts): sync check ignores line endings`.

- **Исправление.** `diff` в `sync-to-client.lib.mjs` (его используют и `checkTarget`, и
  `syncTarget`) сравнивает каждый файл, читая CRLF как LF; файл с байтом NUL считается бинарным и
  сравнивается как есть (сейчас в копии таких нет: `.ts`, `.scss`, `.html`, `.css`, `SYNCED.md`).
  Поэтому `--check` совпадает с выгрузкой в CRLF, а синхронизация не трогает файл, который
  отличается только переводами строк. Файл, который кит действительно изменил, по-прежнему
  показывается и записывается с LF кита.
- **Почему синхронизация не должна переписывать.** Проверено на Git 2.38.1 for Windows,
  `core.autocrlf=true`: после того как закоммиченный LF-файл выгружен (CRLF) и переписан с LF,
  `git status` показывает его как ` M` даже после `git update-index --refresh`, а `git diff` пуст.
  Старая синхронизация в свежую выгрузку клиента помечала бы изменёнными все 237 файлов (тикет 04
  смотрел на diff, а он пуст).
- **Без `.gitattributes` в копии.** `* text eol=lf` там тоже исправил бы `--check`, но: он меняет
  то, как git клиента обращается с папкой его репо, чего собственные файлы клиента нигде не делают;
  в выгрузках, где копия уже лежит в CRLF, git покажет эти файлы изменёнными, пока их не выгрузят
  заново; и это был бы файл, которого нет в ките, — исключение из правила «копия — это файлы кита».
  Нормализованное сравнение исправляет найденную ошибку, не трогая настройки git клиента, поэтому
  копия остаётся как есть. Если клиент когда-нибудь добавит `.gitattributes`, здесь ничего менять
  не придётся.
- **Тесты.** Новый тест «treats a CRLF checkout of the copy as matching, and leaves its files
  alone»: красный до исправления (проверка показывала оба файла изменёнными), зелёный после.
  `pnpm test:scripts` 14/14. Руками: синхронизация в `dist/crlf-test/ui-kit`, все файлы переведены
  в CRLF, затем `--check` совпадает (237 файлов, код 0), а синхронизация показывает 0 изменённых;
  папка удалена. В клиент ничего не писалось.
- **Документация.** README «Consuming the kit» (абзац о переводах строк) и пункт в
  `.claude/rules/components.md` → «The client copy».
- **Проверки.** `pnpm lint` и `pnpm format:check` чисто, `node scripts/check-scratch.mjs` проходит.
