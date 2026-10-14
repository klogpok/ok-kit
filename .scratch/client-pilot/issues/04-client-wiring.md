# 04: put the copy into apartment-changes-new

**Status:** ready-for-agent
**Blocked by:** 01, 03

In `C:\vplans\client`, on branch `feat/ui-kit-pilot` from its `master`. Follow the client's
`AGENTS.md`. Spec decision 2: no common file changes. Do not push.

- [ ] `pnpm sync:client` from the kit writes `apartment-changes-new/ui-kit/`; `sync:client --verify`
  passes.
- [ ] `git -C C:\vplans\client diff --stat master` lists only paths under
  `src/app/pages/dashboard/apartment-changes-new/`.
- [ ] `npx ng build -c production --localize` (the CI command) passes. The copy is not imported
  yet, so this proves only that its presence breaks nothing; ticket 05 proves it compiles in the
  app.
- [ ] Commit in the client, e.g. `chore(ac): add a synced copy of @vplans/ui-kit`.

## Русский перевод

# 04: положить копию в apartment-changes-new

**Статус:** ready-for-agent
**Зависит от:** 01, 03

В `C:\vplans\client`, в ветке `feat/ui-kit-pilot` от его `master`. По `AGENTS.md` клиента.
Решение 2 спеки: общие файлы не меняются. Не пушить.

- [ ] `pnpm sync:client` из кита пишет `apartment-changes-new/ui-kit/`; `sync:client --verify`
  проходит.
- [ ] `git -C C:\vplans\client diff --stat master` показывает только пути внутри
  `src/app/pages/dashboard/apartment-changes-new/`.
- [ ] `npx ng build -c production --localize` (команда CI) проходит. Копию ещё никто не
  импортирует, так что это доказывает только, что её наличие ничего не ломает; что она
  компилируется в приложении, доказывает тикет 05.
- [ ] Коммит в клиенте, например `chore(ac): add a synced copy of @vplans/ui-kit`.
