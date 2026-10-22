# 03: remove the leading hooks, the slot and the old classes; docs

**Status:** done
**Blocked by:** 02

Spec: `../spec.md`, decisions 6, 8 and the constraints.

- `UiListboxConfig` loses `leadingOptions`, `alwaysShown`, `passedOver`, `leadingShown` and
  `isIndeterminate`; `UiListbox` loses the `[uiListboxLeading]` slot; the controller and
  `listbox.spec.ts` lose the code and the test of projected leading options.
- Before the rename lands, run `pnpm sync:client --check` and search the client for
  `ui-select__create`, `ui-select__all` and `ui-select__leading`; write the result here.
- CHANGELOG: the class rename. `docs/DECISIONS.md`: a section with the spec's decisions.
  `projects/ui-kit/README.md` and the rules files: any mention of `uiListboxLeading`, the removed
  hooks or the old classes. `docs/ROADMAP.md`: a line for this work.
- Run `/phase-check` and report.

- [x] No reference to the removed hooks, the slot or the old classes outside the CHANGELOG.
- [x] Client check done and written here.
- [x] `/phase-check` clean.
- [x] Commits `refactor(listbox): ...`, `docs(listbox): ...`.

## Comments

- 2026-10-22, agent: **client check.** The rename had already landed in tickets 01–02 (the old
  rules left `select.scss` in ticket 02), so the check ran after it. `pnpm sync:client --check`
  looks for the client at `D:\projects\client` (next to the main kit checkout); there is no such
  folder, so it reports every file of the copy as `missing` and exits 1. `C:\vplans\client` and the
  pilot worktree `C:\vplans\worktrees\client\ui-kit-pilot` do not exist either (as seen from the
  agent's shell), so `ui-select__create`, `ui-select__all` and `ui-select__leading` could
  not be searched for in the client: whether it styles them stays unknown. The client copy in
  `feat/ui-kit-pilot` gets the new classes at its next `pnpm sync:client`; a search of the client
  for the three old classes belongs to that sync.
- **References left on purpose:** the closed tickets of `.scratch/listbox/` and
  `.scratch/client-pilot/` and the "Popup listbox: plan" section of `docs/DECISIONS.md` still name
  the removed hooks and classes: they are history. The new "Leading actions" section of
  `DECISIONS.md` lists what was removed. Code, README, rules and docs pages name none of them.
- **`UiListboxHost.isIndeterminate(option)` stays.** `ui-option` draws the partly checked
  checkbox of "Select all" from it; the controller now answers it for "Select all" alone. Only the
  config hook of that name is gone.
- **NG0956:** the leading actions in `listbox.ts` are tracked by `action.kind`, with a test in
  `listbox.spec.ts` that fails on the warning. The NG0956 lines in the `pnpm test` output of
  "UiSelect with server-side search" came from that spec's own host, which tracked its string
  results by identity; it now tracks records by id. The listbox and select specs log no NG0956;
  the three left in `pnpm test` come from `file-upload.spec.ts` (size 1, replacing a file) and
  were there before this work.

## Русский перевод

# 03: удалить ведущие хуки, слот и старые классы; документация

**Статус:** сделано
**Зависит от:** 02

Спека: `../spec.md`, решения 6, 8 и ограничения.

- `UiListboxConfig` теряет `leadingOptions`, `alwaysShown`, `passedOver`, `leadingShown` и
  `isIndeterminate`; `UiListbox` теряет слот `[uiListboxLeading]`; контроллер и `listbox.spec.ts`
  теряют код и тест проецируемых ведущих опций.
- До переименования запустить `pnpm sync:client --check` и поискать в клиенте `ui-select__create`,
  `ui-select__all` и `ui-select__leading`; записать результат сюда.
- CHANGELOG: переименование классов. `docs/DECISIONS.md`: раздел с решениями спеки.
  `projects/ui-kit/README.md` и файлы правил: любые упоминания `uiListboxLeading`, удалённых хуков
  или старых классов. `docs/ROADMAP.md`: строка об этой работе.
- Запустить `/phase-check` и отчитаться.

- [x] Нет ссылок на удалённые хуки, слот или старые классы вне CHANGELOG.
- [x] Проверка клиента сделана и записана здесь.
- [x] `/phase-check` чистый.
- [x] Коммиты `refactor(listbox): ...`, `docs(listbox): ...`.

## Комментарии

- 2026-10-22, агент: **проверка клиента.** Переименование уже вошло в тикетах 01–02 (старые
  правила ушли из `select.scss` в тикете 02), поэтому проверка прошла после него.
  `pnpm sync:client --check` ищет клиент в `D:\projects\client` (рядом с основным checkout кита);
  такой папки нет, поэтому скрипт помечает каждый файл копии как `missing` и завершается с кодом 1.
  `C:\vplans\client` и worktree пилота `C:\vplans\worktrees\client\ui-kit-pilot` тоже не существуют
  (в shell агента), поэтому `ui-select__create`, `ui-select__all` и
  `ui-select__leading` в клиенте поискать не удалось: стилизует ли он их, остаётся неизвестным.
  Копия кита в `feat/ui-kit-pilot` получит новые классы при следующем `pnpm sync:client`; поиск
  трёх старых классов в клиенте относится к этой синхронизации.
- **Ссылки, оставленные намеренно:** закрытые тикеты `.scratch/listbox/` и `.scratch/client-pilot/`
  и раздел «Popup listbox: plan» в `docs/DECISIONS.md` по-прежнему называют удалённые хуки и
  классы: это история. Новый раздел «Leading actions» в `DECISIONS.md` перечисляет удалённое. Код,
  README, правила и страницы документации их не упоминают.
- **`UiListboxHost.isIndeterminate(option)` остаётся.** `ui-option` рисует по нему частично
  отмеченный чекбокс «Выбрать все»; контроллер теперь отвечает на него только для «Выбрать все».
  Удалён лишь одноимённый хук конфига.
- **NG0956:** leading actions в `listbox.ts` отслеживаются по `action.kind`, с тестом в
  `listbox.spec.ts`, который падает на этом предупреждении. Строки NG0956 в выводе `pnpm test` у
  «UiSelect with server-side search» шли от собственного host этого spec, который отслеживал
  строковые результаты по identity; теперь он отслеживает записи по id. Spec listbox и select не
  выводят NG0956; три оставшихся в `pnpm test` идут от `file-upload.spec.ts` (размер 1, замена
  файла) и были до этой работы.
