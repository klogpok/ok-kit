# 04: the client was not checked for the old select classes

**Spec:** [../spec.md](../spec.md) → ticket 03, "Check the client copy with `pnpm sync:client --check` before the rename lands"

**Status:** needs-info

**Facts:** Tickets 01 and 02 renamed the leading rows: `.ui-select__create`, `.ui-select__all` and
`.ui-select__leading` are gone; the rows are now `.ui-listbox__create`, `.ui-listbox__select-all`
inside `.ui-listbox__actions`. The client check of ticket 03 could not run: `sync-to-client.mjs`
looks for the client next to the main checkout (`D:\projects\client`), and neither it nor
`C:\vplans\client` or `C:\vplans\worktrees\client\ui-kit-pilot` exists on this machine. So nobody
has looked whether the client's own styles or tests use the old classes. The kit itself has no
reference left to them outside `CHANGELOG.md`, `docs/DECISIONS.md` and closed tickets.

**Options:**

1. Merge now; on the next `pnpm sync:client` in the client checkout, search the client for
   `ui-select__create`, `ui-select__all` and `ui-select__leading` and fix any hit in the client
   (recommended). The CHANGELOG lists the rename.
2. Point the kit at the client (`pnpm sync:client --client <path> --check`) and run the search
   before `master` moves.

## Русский перевод

# 04: клиент не проверен на старые классы select

**Спека:** [../spec.md](../spec.md) → тикет 03, «Проверить копию в клиенте через `pnpm sync:client --check` до переименования»

**Статус:** needs-info

**Факты:** Тикеты 01 и 02 переименовали ведущие строки: `.ui-select__create`, `.ui-select__all`
и `.ui-select__leading` удалены, теперь это `.ui-listbox__create` и `.ui-listbox__select-all`
внутри `.ui-listbox__actions`. Проверку клиента из тикета 03 выполнить не удалось:
`sync-to-client.mjs` ищет клиент рядом с основным checkout (`D:\projects\client`), а на этой
машине нет ни его, ни `C:\vplans\client`, ни `C:\vplans\worktrees\client\ui-kit-pilot`. Поэтому
никто не проверил, используют ли старые классы собственные стили или тесты клиента. В самом ките
упоминания остались только в `CHANGELOG.md`, `docs/DECISIONS.md` и закрытых тикетах.

**Варианты:**

1. Влить сейчас; при следующем `pnpm sync:client` в checkout клиента поискать в клиенте
   `ui-select__create`, `ui-select__all` и `ui-select__leading` и исправить найденное в клиенте
   (рекомендую). Переименование описано в CHANGELOG.
2. Указать киту путь к клиенту (`pnpm sync:client --client <путь> --check`) и выполнить поиск до
   того, как сдвинется `master`.
