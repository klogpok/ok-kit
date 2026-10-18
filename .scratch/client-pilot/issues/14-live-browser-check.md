# 14: browser check of the two pilot screens in the live app

**Spec:** [../spec.md](../spec.md) → tickets 05 and 06

**Status:** ready-for-human

**Facts:** the browser items of tickets 05 and 06 need the running client with a backend, an admin
account and real project data. Agents have none of these, and port 4200 is the user's own dev
server, so on 2026-10-16 the user decided to do this check himself. Everything else is checked by
agents: kit `/phase-check`, the client's `ng build -c production --localize`, the action weights
spec (9 tests) and `test:price-quotes` (99 tests) on `feat/ui-kit-pilot` (ticket 07 → Comments).
The pilot is not approved until this check is done.

- [ ] Action weights section in he/RTL and en/LTR: the 8 points under "Manual browser check (the
  user)" in [05-action-weights.md](05-action-weights.md) → Comments.
- [ ] Price quotes case in he/RTL and en/LTR: the 8 points under "Browser: handed to the user" in
  [06-replace-ok-kit.md](06-replace-ok-kit.md) → Comments.
- [ ] Decide tickets 11 and 12 while looking at the action weights section.
- [ ] Anything that looks wrong: a new ticket here, with the screen, locale and a screenshot.

The branch to run is `feat/ui-kit-pilot` (worktree `C:\vplans\worktrees\client\ui-kit-pilot`, its
`node_modules` is a junction to the main checkout's). `pnpm start` serves `he` (`ng serve -c
he`); for `en` run `node node_modules/@angular/cli/bin/ng.js serve -c en` (`npx ng` refuses the
client's pnpm 11 `devEngines`). Add `--port 4300` if the main checkout's server holds 4200.

## Русский перевод

# 14: проверка двух экранов пилота в живом приложении в браузере

**Спека:** [../spec.md](../spec.md) → тикеты 05 и 06

**Статус:** ready-for-human

**Факты:** пункты «браузер» тикетов 05 и 06 требуют запущенного клиента с бэкендом, аккаунтом
администратора и настоящими данными проекта. У агентов ничего этого нет, а порт 4200 — dev-сервер
самого пользователя, поэтому 2026-10-16 пользователь решил провести эту проверку сам. Всё остальное
проверено агентами: `/phase-check` кита, `ng build -c production --localize` клиента, спек весов
действий (9 тестов) и `test:price-quotes` (99 тестов) на `feat/ui-kit-pilot` (тикет 07 →
Комментарии). Пилот не одобрен, пока эта проверка не сделана.

- [ ] Раздел весов действий в he/RTL и en/LTR: 8 пунктов в «Manual browser check (the user)» в
  [05-action-weights.md](05-action-weights.md) → Комментарии.
- [ ] Price quotes case в he/RTL и en/LTR: 8 пунктов в «Browser: handed to the user» в
  [06-replace-ok-kit.md](06-replace-ok-kit.md) → Комментарии.
- [ ] Решить тикеты 11 и 12, глядя на раздел весов действий.
- [ ] Всё, что выглядит неправильно: новый тикет здесь, с экраном, локалью и скриншотом.

Запускать ветку `feat/ui-kit-pilot` (worktree `C:\vplans\worktrees\client\ui-kit-pilot`, его
`node_modules` — junction на `node_modules` основного checkout). `pnpm start` запускает `he`
(`ng serve -c he`); для `en` — `node node_modules/@angular/cli/bin/ng.js serve -c en` (`npx ng`
отказывается из-за `devEngines` с pnpm 11 у клиента). Добавить `--port 4300`, если 4200 занят
сервером основного checkout.
