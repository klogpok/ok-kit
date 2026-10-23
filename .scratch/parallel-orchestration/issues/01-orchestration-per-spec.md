# 01: Several specs can be orchestrated at once in one checkout

**Status:** done

**Why:** `/orchestrate-spec` allows one orchestration per checkout. `scripts/orchestrator.mjs` keeps
everything in one folder, `.orchestrator/` of the main checkout: the `lock`, `plan.json`,
`state.json`, `progress.md`, the `check-*.log` files and `verify/`. Ticket ids restart at `01` in
every spec, so the heartbeat `.orchestrator/01.json` of one spec would be overwritten by the
heartbeat of another spec. While `popup-listbox-field` was in `verify`, `parsed-text-field` could not
start.

**What to build:** each orchestration lives in its own folder, `.orchestrator/<feature>/`, under its
own lock. All orchestrations share one limit of agents in flight.

- `scripts/orchestrator.mjs`: every command except `tickets` takes `--spec <feature>` (the folder
  name under `.scratch/`) and works in `.orchestrator/<feature>/`. `lock`, `plan.json`,
  `state.json`, `<ticket>.json`, `progress.md` and the logs all move there.
- The lock belongs to a spec. A second session can orchestrate another spec. A second session on the
  same spec still gets `held`.
- `next` counts the tickets in flight (`running`, `review`, `merging`) across every
  `.orchestrator/*/state.json`. The default limit, `--max 4`, applies to that total, not to one
  spec.
- `beat` takes `--spec`, because the id `01` alone is ambiguous.
- `scripts/orchestrator-heartbeat.mjs` reads every `.orchestrator/*/state.json`. It finds the spec
  by the agent id (`ticket.agent === event.agent_id`) and writes the heartbeat into that spec's
  folder. Agent ids are unique, so the agent does not have to know which spec it belongs to.
- `watch --spec` watches its own spec only. The `watcher` token stays in that spec's state.
- `.orchestrator/progress.md` at the top level becomes an index: one line per spec with its phase,
  ticket counts and a link to that spec's `progress.md`.
- Migration: a top-level `.orchestrator/state.json` left by an earlier run, whatever its phase, is
  moved into `.orchestrator/<feature>/` on the first command, taking `<feature>` from the `spec`
  field. Its lock and heartbeats move with it.
- `.claude/skills/orchestrate-spec/SKILL.md`: every `ORCH` call gets `--spec <feature>`. Lock,
  resume and the progress path are per spec. Step 6 (verify) waits while another spec is in `verify`,
  so two full visual and host-CSS runs never load the machine at the same time. A
  `.orchestrator/verify.lock` (`ORCH verify-lock acquire|release --spec`) serializes them. The
  Storybook server of `scripts/storybook-pages.mjs` already listens on a random port (`listen(0)`),
  so the runs only compete for CPU.
- The `/orchestrate-spec` agent prompt passes `--spec <feature>` to `beat`.

**Do not break the orchestration in flight.** Implement this only when no `.orchestrator/state.json`
in the main checkout has a phase other than `done`, or test the migration on a copy of the folder.
`SKILL.md` may have uncommitted changes in the main checkout: keep them.

- [x] `scripts/orchestrator.test.mjs` is extended first: two specs with the same ticket ids keep
      separate state and heartbeats.
- [x] Lock: two sessions take the locks of two specs. The same spec gives `held`. A dead pid gives
      `stale` per spec.
- [x] `next` respects the shared limit: with 3 running in spec A and `--max 4`, spec B launches at
      most 1.
- [x] The heartbeat hook binds an agent to the right spec by agent id. Missing folders, broken JSON
      and unknown agents still end with exit 0.
- [x] `beat --spec` and `watch --spec` touch only their own spec.
- [x] Top-level `progress.md` lists every spec.
- [x] Migration of a top-level `state.json` is covered by a test.
- [x] The verify lock serializes step 6 between specs.
- [x] `SKILL.md` and the header comment of `orchestrator.mjs` describe the per-spec layout.
- [x] `node --test scripts/` passes, and so does `pnpm check`.
  - Node 24 reads `scripts/` as a file, so the run was `pnpm test-scripts`
    (`node --test "scripts/*.test.mjs"`).
- [x] One commit, `feat(scripts): orchestrate several specs at once`.

## Русский перевод

# 01: Несколько спек можно оркестровать одновременно в одном checkout

**Статус:** сделано

**Зачем:** `/orchestrate-spec` допускает одну оркестрацию на checkout. `scripts/orchestrator.mjs`
держит всё в одной папке, `.orchestrator/` главного checkout: `lock`, `plan.json`, `state.json`,
`progress.md`, файлы `check-*.log` и `verify/`. Номера тикетов в каждой спеке начинаются с `01`,
поэтому heartbeat `.orchestrator/01.json` одной спеки перезаписывался бы heartbeat'ом другой. Пока
`popup-listbox-field` была на `verify`, `parsed-text-field` не могла стартовать.

**Что сделать:** каждая оркестрация живёт в своей папке `.orchestrator/<feature>/` под своим lock.
Все оркестрации делят один лимит агентов в работе.

- `scripts/orchestrator.mjs`: каждая команда, кроме `tickets`, принимает `--spec <feature>` (имя
  папки в `.scratch/`) и работает в `.orchestrator/<feature>/`. Туда переезжают `lock`,
  `plan.json`, `state.json`, `<ticket>.json`, `progress.md` и логи.
- Lock принадлежит спеке. Вторая сессия может оркестровать другую спеку. Вторая сессия на той же
  спеке по-прежнему получает `held`.
- `next` считает тикеты в работе (`running`, `review`, `merging`) по всем
  `.orchestrator/*/state.json`. Лимит по умолчанию, `--max 4`, относится к этой сумме, а не к одной
  спеке.
- `beat` принимает `--spec`, потому что id `01` сам по себе неоднозначен.
- `scripts/orchestrator-heartbeat.mjs` читает все `.orchestrator/*/state.json`. Он находит спеку
  по id агента (`ticket.agent === event.agent_id`) и пишет heartbeat в папку этой спеки. Id агентов
  уникальны, поэтому агенту не нужно знать, к какой спеке он относится.
- `watch --spec` следит только за своей спекой. Токен `watcher` остаётся в state этой спеки.
- `.orchestrator/progress.md` верхнего уровня становится индексом: по строке на спеку с фазой,
  числом тикетов и ссылкой на `progress.md` этой спеки.
- Миграция: `.orchestrator/state.json` верхнего уровня, оставшийся от прошлого запуска, в любой фазе
  при первой команде переносится в `.orchestrator/<feature>/`, где `<feature>` берётся из поля
  `spec`. Вместе с ним переезжают его lock и heartbeat'ы.
- `.claude/skills/orchestrate-spec/SKILL.md`: каждый вызов `ORCH` получает `--spec <feature>`. Lock,
  resume и путь к progress — на спеку. Шаг 6 (verify) ждёт, пока другая спека находится на `verify`,
  чтобы два полных прогона visual и host CSS не нагружали машину одновременно. Их упорядочивает
  `.orchestrator/verify.lock` (`ORCH verify-lock acquire|release --spec`). Сервер Storybook из
  `scripts/storybook-pages.mjs` уже слушает случайный порт (`listen(0)`), поэтому прогоны делят
  только CPU.
- Prompt агента в `/orchestrate-spec` передаёт `--spec <feature>` в `beat`.

**Не сломать идущую оркестрацию.** Делать только тогда, когда ни один `.orchestrator/state.json` в
главном checkout не находится в фазе, отличной от `done`, или проверять миграцию на копии папки. В
главном checkout у `SKILL.md` могут быть незакоммиченные изменения: их нужно сохранить.

- [x] Сначала расширяется `scripts/orchestrator.test.mjs`: две спеки с одинаковыми id тикетов
      держат раздельные state и heartbeat'ы.
- [x] Lock: две сессии берут lock двух спек. Та же спека даёт `held`. Мёртвый pid даёт `stale`
      отдельно для каждой спеки.
- [x] `next` соблюдает общий лимит: если в спеке A работают 3 тикета и `--max 4`, спека B запускает
      не больше 1.
- [x] Heartbeat-хук привязывает агента к нужной спеке по id агента. Отсутствующие папки, битый JSON
      и неизвестные агенты по-прежнему завершаются с exit 0.
- [x] `beat --spec` и `watch --spec` трогают только свою спеку.
- [x] `progress.md` верхнего уровня перечисляет все спеки.
- [x] Миграция `state.json` верхнего уровня покрыта тестом.
- [x] Verify lock упорядочивает шаг 6 между спеками.
- [x] `SKILL.md` и шапка `orchestrator.mjs` описывают раскладку по спекам.
- [x] `node --test scripts/` проходит, и `pnpm check` тоже.
  - Node 24 читает `scripts/` как файл, поэтому запускался `pnpm test-scripts`
    (`node --test "scripts/*.test.mjs"`).
- [x] Один коммит, `feat(scripts): orchestrate several specs at once`.
