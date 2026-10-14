# 03: sync script into the client

**Status:** ready-for-agent
**Blocked by:** None

Spec decision 3. `pnpm sync:client [target]` runs `scripts/sync-to-client.mjs`. The default target
is `../client/src/app/pages/dashboard/apartment-changes-new/ui-kit`. The script never writes
outside the target.

- [ ] Mirror every entry point of `projects/ui-kit/` that has a `public-api.ts` (including
  `testing` and the internal `listbox`), plus `styles/`, into the target with the same layout. Skip
  `*.spec.ts`, `*.stories.ts`, `ng-package.json`, `package.json`, `tsconfig*.json`, `.storybook/`,
  `docs/`, `src/`, `test-setup*`, `tokens/` sources and anything else that only serves the kit's
  build. Files removed from the kit are removed from the target.
- [ ] Rewrite every `'@vplans/ui-kit/<entry>'` import to the relative `'../<entry>/public-api'`
  (computed from the file's folder). That is the only transformation. Fail if an import of
  `@vplans/ui-kit` remains outside a comment.
- [ ] Write `<target>/SYNCED.md`: "generated, do not edit", the source commit hash and whether the
  kit's working tree was dirty, the command to sync again, and how a consumer loads the kit
  (`<ui-embed-styles />`, `provideUiLabels`). Refuse to write into a target that has files the
  script did not create, unless they are its own previous output (detect by `SYNCED.md`).
- [ ] `--check`: exit non-zero when the target differs from what a sync would write.
- [ ] `--verify`: copy into a temporary folder under `dist/`, compile it with `ngc` using the
  options of the client's `tsconfig.json` (read from the client, `noEmit`), and compile every
  component stylesheet with `sass` without `includePaths`. This repeats the check of 2026-10-14
  (0 errors, 58 stylesheets).
- [ ] README "Consuming the kit" section: the command, what a consumer adds, and the rule that a
  fix goes into the kit, never into the copy. Add the gotcha to the matching `.claude/rules/` file.
- [ ] Commit `chore(scripts): sync the kit into the client`.

## Русский перевод

# 03: скрипт синхронизации в клиент

**Статус:** ready-for-agent
**Зависит от:** нет

Решение 3 спеки. `pnpm sync:client [target]` запускает `scripts/sync-to-client.mjs`. Цель по
умолчанию — `../client/src/app/pages/dashboard/apartment-changes-new/ui-kit`. Скрипт никогда не
пишет за пределы цели.

- [ ] Зеркалить в цель каждый entry point из `projects/ui-kit/`, у которого есть `public-api.ts`
  (включая `testing` и внутренний `listbox`), и `styles/`, с той же структурой. Пропускать
  `*.spec.ts`, `*.stories.ts`, `ng-package.json`, `package.json`, `tsconfig*.json`, `.storybook/`,
  `docs/`, `src/`, `test-setup*`, исходники `tokens/` и всё, что нужно только сборке кита. Файлы,
  удалённые из кита, удаляются и из цели.
- [ ] Переписать каждый импорт `'@vplans/ui-kit/<entry>'` на относительный
  `'../<entry>/public-api'` (от папки файла). Это единственное преобразование. Падать, если импорт
  `@vplans/ui-kit` остался вне комментария.
- [ ] Писать `<target>/SYNCED.md`: «сгенерировано, не править», хеш коммита-источника, был ли
  рабочий каталог кита грязным, команда для повторной синхронизации и как потребитель подключает
  кит (`<ui-embed-styles />`, `provideUiLabels`). Отказываться писать в цель, где есть файлы не от
  скрипта, кроме его прошлого вывода (распознаётся по `SYNCED.md`).
- [ ] `--check`: ненулевой код выхода, если цель отличается от того, что запишет синхронизация.
- [ ] `--verify`: копия во временную папку в `dist/`, компиляция `ngc` с опциями `tsconfig.json`
  клиента (читаются из клиента, `noEmit`) и сборка стилей всех компонентов `sass` без
  `includePaths`. Повторяет проверку 2026-10-14 (0 ошибок, 58 стилей).
- [ ] Раздел README «Consuming the kit»: команда, что добавляет потребитель и правило
  «исправление идёт в кит, а не в копию». Gotcha добавить в подходящий файл `.claude/rules/`.
- [ ] Коммит `chore(scripts): sync the kit into the client`.
