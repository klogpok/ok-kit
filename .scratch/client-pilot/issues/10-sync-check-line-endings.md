# 10: sync --check ignores line endings

**Spec:** [../spec.md](../spec.md), tickets 03 and 04

**Status:** ready-for-agent
**Blocked by:** None

**Facts:** ticket 04 (→ Comments) found that `pnpm sync:client --check` (`scripts/sync-to-client.mjs`
and `.lib.mjs`, ticket 03) compares bytes. The client has no `.gitattributes`, and Git for Windows
runs with `core.autocrlf=true`, so the committed copy (LF in the index) is checked out with CRLF.
Every fresh checkout of the client branch (another worktree, a teammate) then reports all 237
files as `differs` though their content matches the kit. A sync on such a checkout rewrites all
237 files with LF.

- [ ] A failing test first in `scripts/sync-to-client.test.mjs`: a target whose text files have
  CRLF passes `--check`; a real content change still fails it.
- [ ] `--check` compares text with line endings normalized.
- [ ] A sync does not rewrite a file that differs only in line endings; check what `git status`
  reports after such a rewrite.
- [ ] Decide whether the copy also carries a `.gitattributes`, and justify it here.
- [ ] README "Consuming the kit" and the `.claude/rules/` gotcha describe the behavior.
- [ ] `pnpm test:scripts`, `pnpm lint`, `pnpm format:check`, `node scripts/check-scratch.mjs`.
  Nothing is written into the client; tests use temporary targets.
- [ ] Commit `fix(scripts): sync check ignores line endings`.

## Русский перевод

# 10: sync --check не учитывает переводы строк

**Спека:** [../spec.md](../spec.md), тикеты 03 и 04

**Статус:** ready-for-agent
**Зависит от:** нет

**Факты:** тикет 04 (→ Комментарии) обнаружил, что `pnpm sync:client --check`
(`scripts/sync-to-client.mjs` и `.lib.mjs`, тикет 03) сравнивает байты. У клиента нет
`.gitattributes`, а Git for Windows работает с `core.autocrlf=true`, поэтому закоммиченная копия (в
индексе LF) выгружается с CRLF. Любая свежая выгрузка ветки клиента (другой worktree, коллега)
показывает все 237 файлов как `differs`, хотя содержимое совпадает с китом. Синхронизация в такую
выгрузку переписывает все 237 файлов с LF.

- [ ] Сначала падающий тест в `scripts/sync-to-client.test.mjs`: цель, у текстовых файлов которой
  CRLF, проходит `--check`; настоящее изменение содержимого по-прежнему его проваливает.
- [ ] `--check` сравнивает текст с нормализованными переводами строк.
- [ ] Синхронизация не переписывает файл, который отличается только переводами строк; проверить,
  что показывает `git status` после такой перезаписи.
- [ ] Решить, кладёт ли копия ещё и `.gitattributes`, и обосновать здесь.
- [ ] README «Consuming the kit» и gotcha в `.claude/rules/` описывают поведение.
- [ ] `pnpm test:scripts`, `pnpm lint`, `pnpm format:check`, `node scripts/check-scratch.mjs`. В
  клиент ничего не пишется; тесты используют временные цели.
- [ ] Коммит `fix(scripts): sync check ignores line endings`.
