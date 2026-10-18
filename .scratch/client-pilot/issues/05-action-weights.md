# 05: action-weights section on the kit

**Status:** done
**Blocked by:** 04

`apartment-changes-new/settings/action-weights-section/` in the client. Spec decisions 1, 2, 4
and 7. Behavior does not change: same data, validation, auto calculation, reset and save.

- [x] Imports from the copy by relative path (`../../ui-kit/<entry>/public-api`).
  `<ui-embed-styles />` in the template; `provideUiLabels` keyed on `LOCALE_ID` (`he` →
  `UI_LABELS_HE`, otherwise `UI_LABELS_EN`) in the component's `providers`.
- [x] `mat-checkbox` → `ui-checkbox`; the number input → `ui-number-input` (`min` 0, `step` 1,
  whole numbers, `%` as suffix, disabled when the row is off) inside a labelled field, so each
  input has an accessible name (today it has none).
- [x] The two `mat-stroked-button`s → secondary `ui-button`; Save → primary `ui-button` with the
  kit's loading state instead of the nested `mat-spinner`; the section `mat-spinner` →
  `ui-spinner` with a label.
- [x] The total line: keep its text, use kit tokens for the valid and invalid colors; consider
  `ui-alert` only if it reads better in the browser. Keep `ngModel` unless Reactive makes the
  component simpler.
- [x] Drop the Material imports the component no longer uses; the `ac-settings-section` wrapper
  and `MatSnackBar` stay.
- [x] A Karma spec next to the component, using the kit harnesses from the copy's `testing`:
  toggling a row, typing a weight, auto calculation, Save disabled until the total is 100. Run it
  through `.scratch/client-pilot/tsconfig.action-weights.spec.json` in the client (gitignored,
  modelled on `tsconfig.price-quotes.spec.json`) with
  `npx ng test --ts-config=.scratch/client-pilot/tsconfig.action-weights.spec.json --include=…
  --watch=false --browsers=ChromeHeadlessCI`. If the builder rejects a tsconfig there, report it;
  do not add one at the root.
- [x] `npx ng build -c production --localize` passes; the diff against `master` is still only
  under `apartment-changes-new/`.
- [x] Browser: he/RTL and en/LTR, collapsed and open, loading, invalid total, saving; keyboard
  through the rows; the look next to the other settings sections; no other page changes (the
  tokens are `--ui-*` only). **Handed to the user** (see the checklist below); not checked by an
  agent.
- [x] Commit in the client, e.g. `feat(ac-settings): action weights on @vplans/ui-kit`.

## Comments

**2026-10-18 - done.** Client commit `33908a42b` `feat(ac-settings): action weights on
@vplans/ui-kit` on `feat/ui-kit-pilot-05` (worktree `C:\vplans\worktrees\client\ui-kit-pilot-05`,
branched from `feat/ui-kit-pilot` at `6b270e1ab`), then `feat/ui-kit-pilot` (`4cce81c12`, with
ticket 06) merged in: `7c56747f9`. Not pushed, not merged into `feat/ui-kit-pilot`.

- **Component.** `ui-checkbox` (`[checked]` + `(checkedChange)`), `ui-number-input` in a
  `ui-form-field` with `<span uiSuffix>%</span>` (`min="0" step="1" maxFractionDigits="0"
  [grouping]="false"`, `[disabled]` when the row is off, `ngModel` kept), two secondary
  `ui-button`s, Save as a primary `ui-button` with `[disabled]="!isValid()" [loading]="saving()"`,
  and `<ui-spinner size="lg" />`. Material left: `MatSnackBarModule` only (`MatButtonModule`,
  `MatCheckboxModule`, `MatProgressSpinnerModule` removed). The SCSS lost the native input, `%`
  box and purple button rules; the total line uses `--ui-color-success-*` / `--ui-color-danger-*`,
  `--ui-color-border`, `--ui-radius-container` and the font tokens. `ui-alert` was not used: the
  line has no icon or title and keeps its shape.
- **No new texts.** Each weight is named by its row's label (`[aria-label]="labelFor(type)"`, the
  `ACTION_LABELS` text), not by a visible field label, which would repeat the checkbox text. The
  spinner's name is the kit's `loading` label from `provideUiLabels` (he `טוען`, en `Loading`):
  the client's `@@loading` id has three trans-units in `messages.he.xlf` with two sources
  (`Loading`, `Loading...`). No `src/languages/*.xlf` change; the build reports the same 14791
  "No translation found" as ticket 04.
- **Spec:** `action-weights-section.component.spec.ts`, 9 tests, all pass (0.3 s), with
  `UiCheckboxHarness`, `UiNumberInputHarness` (found by label) and `UiButtonHarness`: the loading
  spinner, toggling a row, typing a weight (remaining / over hints), an emptied weight is 0, auto
  calculation (17/17/17/17/16/16, and 0 for a row that is off), Save disabled until 100, Save
  loading and the mutation input plus the snackbar, reset. Written test-first; the builder accepts
  the tsconfig in `.scratch/client-pilot/` (it is in the worktree, gitignored).
  `npx ng` fails on `devEngines` (pnpm 11), so it ran as `node node_modules/@angular/cli/bin/ng.js
  test --ts-config=.scratch/client-pilot/tsconfig.action-weights.spec.json
  --include="src/app/pages/dashboard/apartment-changes-new/settings/action-weights-section/**/*.spec.ts"
  --watch=false --browsers=ChromeHeadlessCI --no-progress --source-map=false`.
- **Found in testing.** `MatSnackBarModule` in a standalone component's `imports` provides its own
  `MatSnackBar`, so a `MatSnackBar` stub in `TestBed` `providers` does not reach the component: the
  real snackbar opened and held the zone for its 3000 ms. The spec uses
  `TestBed.overrideProvider`. Not a kit issue.
- **Build.** `node node_modules/@angular/cli/bin/ng.js build -c production --localize`: exit 0
  (260 s) before the merge and again after it; the same 11 budget warnings as ticket 04, none from
  the kit or this section. `git diff --name-only master`: everything under `apartment-changes-new/`.
- **For the user to decide:** the `ui-number-input` steppers (−/+) are shown, so the field is
  `10rem` wide (the native input had browser arrows only on hover); `[steppers]="false"` would make
  it narrower. The valid/invalid borders are now the full success/danger colors, not the old pale
  ones.

**Manual browser check (the user).** Settings page as an admin,
`/he/<module>/<companyId>/project/<projectId>/apartments-changes-new/settings?section=action-weights`,
then the same under `/en/`:

1. he/RTL and en/LTR: rows, `%` on the end side of each field, total line and footer mirror; texts
   in Hebrew / English.
2. Collapsed: the header only; opening loads once; the deep link opens it already loaded.
3. Loading: a centered spinner (throttle the network to see it).
4. Totals under and over 100: red line with "Remaining …" / "Exceeds … by …"; at 100 green; Save
   disabled while not 100.
5. Turning a row off disables its weight and drops it from the total; auto calculation and Reset.
6. Saving: Save shows a spinner and cannot be clicked twice; the snackbar appears; reload keeps the
   values.
7. Keyboard: Tab goes checkbox → weight → next row → the three buttons; Space toggles a row;
   ArrowUp/Down change a weight; a screen reader names each weight by its row.
8. Look next to the other settings sections: fonts, sizes, colors and spacing fit; nothing else on
   the page or on other pages changed.

## Русский перевод

# 05: раздел action-weights на ките

**Статус:** сделано
**Зависит от:** 04

`apartment-changes-new/settings/action-weights-section/` в клиенте. Решения 1, 2, 4 и 7 спеки.
Поведение не меняется: те же данные, проверка, автоматический расчёт, сброс и сохранение.

- [x] Импорты из копии по относительному пути (`../../ui-kit/<entry>/public-api`).
  `<ui-embed-styles />` в шаблоне; `provideUiLabels` по `LOCALE_ID` (`he` → `UI_LABELS_HE`, иначе
  `UI_LABELS_EN`) в `providers` компонента.
- [x] `mat-checkbox` → `ui-checkbox`; числовое поле → `ui-number-input` (`min` 0, `step` 1, целые
  числа, `%` как suffix, отключено, когда строка выключена) внутри подписанного поля, чтобы у
  каждого поля было доступное имя (сейчас его нет).
- [x] Две `mat-stroked-button` → второстепенные `ui-button`; Save → основная `ui-button` с
  состоянием loading кита вместо вложенного `mat-spinner`; `mat-spinner` раздела → `ui-spinner`
  с подписью.
- [x] Строка итога: текст тот же, цвета «верно» и «неверно» из токенов кита; `ui-alert` — только
  если в браузере так читается лучше. Оставить `ngModel`, если Reactive не упрощает компонент.
- [x] Убрать импорты Material, которые больше не используются; обёртка `ac-settings-section` и
  `MatSnackBar` остаются.
- [x] Karma-спек рядом с компонентом, с harnesses кита из `testing` копии: включение строки, ввод
  веса, автоматический расчёт, Save недоступна, пока сумма не 100. Запуск через
  `.scratch/client-pilot/tsconfig.action-weights.spec.json` в клиенте (в `.gitignore`, по образцу
  `tsconfig.price-quotes.spec.json`) командой
  `npx ng test --ts-config=.scratch/client-pilot/tsconfig.action-weights.spec.json --include=…
  --watch=false --browsers=ChromeHeadlessCI`. Если builder не примет tsconfig там — сообщить, а не
  класть его в корень.
- [x] `npx ng build -c production --localize` проходит; diff с `master` по-прежнему только внутри
  `apartment-changes-new/`.
- [x] Браузер: he/RTL и en/LTR, свёрнуто и раскрыто, загрузка, неверная сумма, сохранение;
  клавиатура по строкам; вид рядом с остальными разделами настроек; другие страницы не меняются
  (токены только `--ui-*`). **Передано пользователю** (чек-лист ниже); агент это не проверял.
- [x] Коммит в клиенте, например `feat(ac-settings): action weights on @vplans/ui-kit`.

## Комментарии

**2026-10-18 - сделано.** Коммит клиента `33908a42b` `feat(ac-settings): action weights on
@vplans/ui-kit` в `feat/ui-kit-pilot-05` (worktree `C:\vplans\worktrees\client\ui-kit-pilot-05`,
ответвлён от `feat/ui-kit-pilot` на `6b270e1ab`), затем в него влит `feat/ui-kit-pilot`
(`4cce81c12`, с тикетом 06): `7c56747f9`. Не запушено, в `feat/ui-kit-pilot` не влито.

- **Компонент.** `ui-checkbox` (`[checked]` + `(checkedChange)`), `ui-number-input` в
  `ui-form-field` с `<span uiSuffix>%</span>` (`min="0" step="1" maxFractionDigits="0"
  [grouping]="false"`, `[disabled]`, когда строка выключена, `ngModel` оставлен), две
  второстепенные `ui-button`, Save — основная `ui-button` с `[disabled]="!isValid()"
  [loading]="saving()"`, и `<ui-spinner size="lg" />`. Из Material остался только
  `MatSnackBarModule` (`MatButtonModule`, `MatCheckboxModule`, `MatProgressSpinnerModule` убраны).
  Из SCSS ушли правила нативного поля, блока `%` и фиолетовых кнопок; строка итога на
  `--ui-color-success-*` / `--ui-color-danger-*`, `--ui-color-border`, `--ui-radius-container` и
  токенах шрифта. `ui-alert` не взят: у строки нет иконки и заголовка, её форма сохранена.
- **Новых текстов нет.** Каждое поле веса названо подписью своей строки
  (`[aria-label]="labelFor(type)"`, текст из `ACTION_LABELS`), а не видимым лейблом поля — он
  повторил бы текст галочки. Имя спиннера — метка кита `loading` из `provideUiLabels` (he `טוען`,
  en `Loading`): id `@@loading` клиента встречается в `messages.he.xlf` трижды с двумя source
  (`Loading`, `Loading...`). `src/languages/*.xlf` не менялись; сборка выдаёт те же 14791
  «No translation found», что и в тикете 04.
- **Спек:** `action-weights-section.component.spec.ts`, 9 тестов, все проходят (0,3 с), на
  `UiCheckboxHarness`, `UiNumberInputHarness` (поиск по подписи) и `UiButtonHarness`: спиннер
  загрузки, выключение строки, ввод веса (подсказки «осталось» / «превышает»), пустой вес = 0,
  автоматический расчёт (17/17/17/17/16/16 и 0 у выключенной строки), Save недоступна до 100,
  loading у Save, вход мутации и snackbar, сброс. Написан test-first; builder принимает tsconfig
  в `.scratch/client-pilot/` (лежит в worktree, в `.gitignore`). `npx ng` падает на `devEngines`
  (pnpm 11), поэтому запуск через `node node_modules/@angular/cli/bin/ng.js test
  --ts-config=.scratch/client-pilot/tsconfig.action-weights.spec.json
  --include="src/app/pages/dashboard/apartment-changes-new/settings/action-weights-section/**/*.spec.ts"
  --watch=false --browsers=ChromeHeadlessCI --no-progress --source-map=false`.
- **Найдено в тестах.** `MatSnackBarModule` в `imports` standalone-компонента даёт свой
  `MatSnackBar`, поэтому заглушка `MatSnackBar` в `providers` `TestBed` до компонента не доходит:
  открывался настоящий snackbar и держал зону свои 3000 мс. Спек использует
  `TestBed.overrideProvider`. Это не проблема кита.
- **Сборка.** `node node_modules/@angular/cli/bin/ng.js build -c production --localize`: код 0
  (260 с) до слияния и снова после; те же 11 предупреждений о бюджетах, что в тикете 04, ни одного
  от кита или раздела. `git diff --name-only master`: всё внутри `apartment-changes-new/`.
- **Решить пользователю:** у `ui-number-input` видны кнопки −/+, поэтому поле шириной `10rem`
  (у нативного поля стрелки браузера были только при наведении); `[steppers]="false"` сделает его
  уже. Рамки «верно»/«неверно» теперь полного цвета success/danger, а не прежние бледные.

**Ручная проверка в браузере (пользователь).** Страница настроек под админом,
`/he/<module>/<companyId>/project/<projectId>/apartments-changes-new/settings?section=action-weights`,
затем то же под `/en/`:

1. he/RTL и en/LTR: строки, `%` с конечной стороны каждого поля, строка итога и подвал зеркалятся;
   тексты на иврите / английском.
2. Свёрнуто: только заголовок; раскрытие грузит данные один раз; deep link открывает уже
   загруженным.
3. Загрузка: спиннер по центру (замедлить сеть, чтобы увидеть).
4. Сумма меньше и больше 100: красная строка с «Remaining …» / «Exceeds … by …»; при 100 зелёная;
   Save недоступна, пока не 100.
5. Выключение строки отключает её вес и убирает из суммы; автоматический расчёт и Reset.
6. Сохранение: на Save спиннер, второй клик не проходит; появляется snackbar; после перезагрузки
   значения те же.
7. Клавиатура: Tab идёт галочка → вес → следующая строка → три кнопки; Space переключает строку;
   ArrowUp/Down меняют вес; скринридер называет каждый вес по его строке.
8. Вид рядом с остальными разделами настроек: шрифты, размеры, цвета и отступы подходят; больше
   ничего на странице и на других страницах не изменилось.
