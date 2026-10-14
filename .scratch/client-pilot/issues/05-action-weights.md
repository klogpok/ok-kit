# 05: action-weights section on the kit

**Status:** ready-for-agent
**Blocked by:** 04

`apartment-changes-new/settings/action-weights-section/` in the client. Spec decisions 1, 2, 4
and 7. Behavior does not change: same data, validation, auto calculation, reset and save.

- [ ] Imports from the copy by relative path (`../../ui-kit/<entry>/public-api`).
  `<ui-embed-styles />` in the template; `provideUiLabels` keyed on `LOCALE_ID` (`he` →
  `UI_LABELS_HE`, otherwise `UI_LABELS_EN`) in the component's `providers`.
- [ ] `mat-checkbox` → `ui-checkbox`; the number input → `ui-number-input` (`min` 0, `step` 1,
  whole numbers, `%` as suffix, disabled when the row is off) inside a labelled field, so each
  input has an accessible name (today it has none).
- [ ] The two `mat-stroked-button`s → secondary `ui-button`; Save → primary `ui-button` with the
  kit's loading state instead of the nested `mat-spinner`; the section `mat-spinner` →
  `ui-spinner` with a label.
- [ ] The total line: keep its text, use kit tokens for the valid and invalid colors; consider
  `ui-alert` only if it reads better in the browser. Keep `ngModel` unless Reactive makes the
  component simpler.
- [ ] Drop the Material imports the component no longer uses; the `ac-settings-section` wrapper
  and `MatSnackBar` stay.
- [ ] A Karma spec next to the component, using the kit harnesses from the copy's `testing`:
  toggling a row, typing a weight, auto calculation, Save disabled until the total is 100. Run it
  through `.scratch/client-pilot/tsconfig.action-weights.spec.json` in the client (gitignored,
  modelled on `tsconfig.price-quotes.spec.json`) with
  `npx ng test --ts-config=.scratch/client-pilot/tsconfig.action-weights.spec.json --include=…
  --watch=false --browsers=ChromeHeadlessCI`. If the builder rejects a tsconfig there, report it;
  do not add one at the root.
- [ ] `npx ng build -c production --localize` passes; the diff against `master` is still only
  under `apartment-changes-new/`.
- [ ] Browser: he/RTL and en/LTR, collapsed and open, loading, invalid total, saving; keyboard
  through the rows; the look next to the other settings sections; no other page changes (the
  tokens are `--ui-*` only).
- [ ] Commit in the client, e.g. `feat(ac-settings): action weights on @vplans/ui-kit`.

## Русский перевод

# 05: раздел action-weights на ките

**Статус:** ready-for-agent
**Зависит от:** 04

`apartment-changes-new/settings/action-weights-section/` в клиенте. Решения 1, 2, 4 и 7 спеки.
Поведение не меняется: те же данные, проверка, автоматический расчёт, сброс и сохранение.

- [ ] Импорты из копии по относительному пути (`../../ui-kit/<entry>/public-api`).
  `<ui-embed-styles />` в шаблоне; `provideUiLabels` по `LOCALE_ID` (`he` → `UI_LABELS_HE`, иначе
  `UI_LABELS_EN`) в `providers` компонента.
- [ ] `mat-checkbox` → `ui-checkbox`; числовое поле → `ui-number-input` (`min` 0, `step` 1, целые
  числа, `%` как suffix, отключено, когда строка выключена) внутри подписанного поля, чтобы у
  каждого поля было доступное имя (сейчас его нет).
- [ ] Две `mat-stroked-button` → второстепенные `ui-button`; Save → основная `ui-button` с
  состоянием loading кита вместо вложенного `mat-spinner`; `mat-spinner` раздела → `ui-spinner`
  с подписью.
- [ ] Строка итога: текст тот же, цвета «верно» и «неверно» из токенов кита; `ui-alert` — только
  если в браузере так читается лучше. Оставить `ngModel`, если Reactive не упрощает компонент.
- [ ] Убрать импорты Material, которые больше не используются; обёртка `ac-settings-section` и
  `MatSnackBar` остаются.
- [ ] Karma-спек рядом с компонентом, с harnesses кита из `testing` копии: включение строки, ввод
  веса, автоматический расчёт, Save недоступна, пока сумма не 100. Запуск через
  `.scratch/client-pilot/tsconfig.action-weights.spec.json` в клиенте (в `.gitignore`, по образцу
  `tsconfig.price-quotes.spec.json`) командой
  `npx ng test --ts-config=.scratch/client-pilot/tsconfig.action-weights.spec.json --include=…
  --watch=false --browsers=ChromeHeadlessCI`. Если builder не примет tsconfig там — сообщить, а не
  класть его в корень.
- [ ] `npx ng build -c production --localize` проходит; diff с `master` по-прежнему только внутри
  `apartment-changes-new/`.
- [ ] Браузер: he/RTL и en/LTR, свёрнуто и раскрыто, загрузка, неверная сумма, сохранение;
  клавиатура по строкам; вид рядом с остальными разделами настроек; другие страницы не меняются
  (токены только `--ui-*`).
- [ ] Коммит в клиенте, например `feat(ac-settings): action weights on @vplans/ui-kit`.
