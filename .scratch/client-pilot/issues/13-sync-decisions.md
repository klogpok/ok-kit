# 13: three behaviors of the sync script to confirm

**Spec:** [../spec.md](../spec.md) → decision 3, tickets 03 and 10

**Status:** needs-info

**Facts:** ticket 03 (→ Comments) made three choices in `scripts/sync-to-client.mjs` that the spec
did not settle. All three are in the code and tested (`pnpm test-scripts`, 15 tests), and
README → "Consuming the kit" describes them. Each one can be confirmed or changed on its own.

1. **A target with `SYNCED.md` is mirrored as a whole.** A file added there by hand is deleted on
   the next sync, as a file removed from the kit is; `--check` lists it as `extra` first. A
   target without `SYNCED.md` that is not empty is refused.
2. **`--check` ignores the source commit line of `SYNCED.md`.** A new kit commit that changes no
   copied file does not make the copy stale; a sync always rewrites that line, so the client
   commit that holds the copy shows which kit commit it came from. Line endings are ignored too
   (ticket 10).
3. **The default `--client` is found next to the main kit checkout** (`git rev-parse
   --git-common-dir`, then `../client`), also when the script runs from a kit worktree. The
   default target is then that client's `apartment-changes-new/ui-kit`, i.e. the user's main client
   checkout `C:\vplans\client`. The pilot always passed an explicit target and `--client` (the
   integration worktree `C:\vplans\worktrees\client\ui-kit-pilot`).

**Options:**

1. Confirm all three (recommended). The copy is never edited by hand, so a hand-added file is a
   mistake to remove, not to keep; a stale-by-hash `--check` would fail after every kit commit;
   and a worktree of the kit has no `../client` of its own.
2. Change point 1: keep a manifest of written files in `SYNCED.md` and refuse to sync while the
   target holds a file that is not in it (safer against a hand-added file, noisier `SYNCED.md`).
3. Change point 2: `--check` also fails when the source commit differs (strict provenance; the
   client copy must be resynced after every kit commit).
4. Change point 3: no default target or client; both must be named on every run (no chance of
   writing into the main client checkout by accident).

## Русский перевод

# 13: три поведения скрипта синхронизации на подтверждение

**Спека:** [../spec.md](../spec.md) → решение 3, тикеты 03 и 10

**Статус:** needs-info

**Факты:** тикет 03 (→ Комментарии) сделал в `scripts/sync-to-client.mjs` три выбора, которые
спека не решала. Все три есть в коде и покрыты тестами (`pnpm test-scripts`, 15 тестов), README →
«Consuming the kit» их описывает. Каждый можно подтвердить или изменить отдельно.

1. **Папка с `SYNCED.md` зеркалится целиком.** Файл, добавленный туда руками, удаляется при
   следующей синхронизации, как и файл, удалённый из кита; `--check` сначала показывает его как
   `extra`. Непустую папку без `SYNCED.md` скрипт не трогает.
2. **`--check` не смотрит на строку с коммитом-источником в `SYNCED.md`.** Новый коммит кита, не
   меняющий скопированные файлы, не делает копию устаревшей; синхронизация всегда переписывает эту
   строку, так что коммит клиента с копией показывает, из какого коммита кита она взята. Концы
   строк тоже не учитываются (тикет 10).
3. **`--client` по умолчанию ищется рядом с основным checkout кита** (`git rev-parse
   --git-common-dir`, затем `../client`), в том числе когда скрипт запущен из worktree кита. Папка
   по умолчанию тогда — `apartment-changes-new/ui-kit` этого клиента, то есть основной checkout
   пользователя `C:\vplans\client`. В пилоте всегда передавались явные папка и `--client`
   (интеграционный worktree `C:\vplans\worktrees\client\ui-kit-pilot`).

**Варианты:**

1. Подтвердить все три (рекомендую). Копию руками не правят, так что добавленный руками файл —
   ошибка, которую надо убрать, а не сохранить; `--check` по хешу падал бы после каждого коммита
   кита; а у worktree кита нет своего `../client`.
2. Изменить пункт 1: вести в `SYNCED.md` список записанных файлов и отказываться от синхронизации,
   пока в папке есть файл не из списка (надёжнее против добавленного руками файла, но `SYNCED.md`
   шумнее).
3. Изменить пункт 2: `--check` падает и при другом коммите-источнике (строгое происхождение; копию
   в клиенте надо пересинхронизировать после каждого коммита кита).
4. Изменить пункт 3: без папки и клиента по умолчанию; оба указываются при каждом запуске (нельзя
   случайно записать в основной checkout клиента).
