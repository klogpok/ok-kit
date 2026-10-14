# 06: replace the vendored ok-kit

**Status:** ready-for-agent
**Blocked by:** 02, 04

Spec decision 6, in the client branch of ticket 04. Sync the kit again first, so the copy has
ticket 02. No common file changes.

- [ ] `shared/cases/price-quotes-case`: `ok-select`/`ok-option` → `ui-select`/`ui-option` from the
  copy, with `searchable creatable clearable size="sm" [maxLength] [formControl] [readonly]`;
  update its spec; `npm run test:price-quotes` passes with its tsconfig unchanged.
- [ ] `shared/apartment-changes-dialog`: `<ok-tokens />` → `<ui-embed-styles />`,
  `provideOkLabels` → `provideUiLabels` with the same `LOCALE_ID` rule.
- [ ] Delete `apartment-changes-new/ok-kit/`; a grep for `ok-kit`, `Ok[A-Z]`, `OK_` and `--ok-` in
  `src/` finds nothing.
- [ ] `npx ng build -c production --localize` passes; the diff against `master` is still only under
  `apartment-changes-new/`.
- [ ] Browser: the price quotes case in he/RTL and en/LTR: search, create a location, clear,
  readonly, the length limit; compare with the old look and list visible differences in the report
  (the token sheets differ by about 170 lines).
- [ ] Commit in the client, e.g. `refactor(price-quotes): @vplans/ui-kit instead of the vendored
  ok-kit`.

## Русский перевод

# 06: заменить вендорный ok-kit

**Статус:** ready-for-agent
**Зависит от:** 02, 04

Решение 6 спеки, в ветке клиента из тикета 04. Сначала синхронизировать кит заново, чтобы в копии
был тикет 02. Общие файлы не меняются.

- [ ] `shared/cases/price-quotes-case`: `ok-select`/`ok-option` → `ui-select`/`ui-option` из
  копии, с `searchable creatable clearable size="sm" [maxLength] [formControl] [readonly]`;
  обновить его спек; `npm run test:price-quotes` проходит с неизменным tsconfig.
- [ ] В `shared/apartment-changes-dialog`: `<ok-tokens />` → `<ui-embed-styles />`,
  `provideOkLabels` → `provideUiLabels` с тем же правилом по `LOCALE_ID`.
- [ ] Удалить `apartment-changes-new/ok-kit/`; grep по `ok-kit`, `Ok[A-Z]`, `OK_` и `--ok-` в
  `src/` ничего не находит.
- [ ] `npx ng build -c production --localize` проходит; diff с `master` по-прежнему только внутри
  `apartment-changes-new/`.
- [ ] Браузер: кейс ценовых предложений в he/RTL и en/LTR: поиск, создание локации, очистка,
  readonly, ограничение длины; сравнить со старым видом и перечислить заметные различия в отчёте
  (таблицы токенов расходятся примерно на 170 строк).
- [ ] Коммит в клиенте, например `refactor(price-quotes): @vplans/ui-kit instead of the vendored
  ok-kit`.
