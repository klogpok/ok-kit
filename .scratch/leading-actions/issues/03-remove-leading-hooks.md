# 03: remove the leading hooks, the slot and the old classes; docs

**Status:** ready-for-agent
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

- [ ] No reference to the removed hooks, the slot or the old classes outside the CHANGELOG.
- [ ] Client check done and written here.
- [ ] `/phase-check` clean.
- [ ] Commits `refactor(listbox): ...`, `docs(listbox): ...`.

## Comments

## Русский перевод

# 03: удалить ведущие хуки, слот и старые классы; документация

**Статус:** ready-for-agent
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

- [ ] Нет ссылок на удалённые хуки, слот или старые классы вне CHANGELOG.
- [ ] Проверка клиента сделана и записана здесь.
- [ ] `/phase-check` чистый.
- [ ] Коммиты `refactor(listbox): ...`, `docs(listbox): ...`.
