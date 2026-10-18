# 15: the next screen after the pilot

**Spec:** [../spec.md](../spec.md) → "Out of scope"

**Status:** needs-info

**Facts:** the spec's survey of `apartment-changes-new` ranks two screens after the pilot; they
wait for the pilot report (ticket 07). Both are Material dialogs (`MatDialogRef`,
`MAT_DIALOG_DATA`), so the next screen is the first one with a dialog, which the spec postponed:

- **`settings/project-quotes-section/create-quote-item-dialog`** (261 lines; template 117): two
  text inputs, a number input (unit price), three `vp-multi-select` (the client's own component in
  `src/app/shared/`, which stays; only this dialog's use of it would change), labels, a close
  button, Cancel and Confirm. Admin settings, next to the pilot screen.
- **`shared/deadline-dialog` → `shared/schedule-dialog`** (98 and 317 lines; templates 41 and 95):
  date inputs, checkboxes, a number input, buttons; both opened from `table-control`, the main
  table of the module, so more users see them. The kit's date picker would replace
  `type="date"`.

**The dialog shell:** the client's `src/styles.scss:688` sets `.cdk-overlay-pane { max-width:
unset !important; max-height: unset !important }` for every overlay. A kit `ui-dialog` keeps its side
margin through `max-inline-size` on its pane (`.ui-dialog-pane`), which that rule overrides, so on
a narrow screen a wide kit dialog would touch the screen edges. `styles.scss` is a
common file that the pilot does not change (spec decision 2). Keeping `MatDialog` as the shell and
putting kit controls inside avoids it; moving to `ui-dialog` needs either a kit-side workaround
(e.g. the margin kept on the dialog container instead of the pane) or a change to `styles.scss`.

**Options:**

1. `create-quote-item-dialog`, inside the `MatDialog` shell (recommended): the closest screen to
   the pilot (the same settings page and admin users), it exercises `ui-multi-select`,
   `ui-number-input` and form fields with real labels, and the shell question can wait for a
   screen that needs a kit dialog.
2. `create-quote-item-dialog` with a kit `ui-dialog` shell: also settles the `.cdk-overlay-pane`
   clash (a kit ticket first, measured with the host-CSS check plus that rule).
3. `deadline-dialog` → `schedule-dialog`, inside the `MatDialog` shell: more users, brings the kit
   date picker into the client, and it is two screens at once.

## Русский перевод

# 15: следующий экран после пилота

**Спека:** [../spec.md](../spec.md) → «Вне рамок»

**Статус:** needs-info

**Факты:** обзор `apartment-changes-new` в спеке ставит после пилота два экрана; они ждут отчёта
пилота (тикет 07). Оба — диалоги Material (`MatDialogRef`, `MAT_DIALOG_DATA`), так что следующий
экран — первый с диалогом, который спека отложила:

- **`settings/project-quotes-section/create-quote-item-dialog`** (261 строка; шаблон 117): два
  текстовых поля, числовое поле (цена за единицу), три `vp-multi-select` (собственный компонент
  клиента в `src/app/shared/`, он остаётся; изменилось бы только его использование в этом
  диалоге), лейблы, кнопка закрытия, Cancel и Confirm. Настройки администратора, рядом с экраном
  пилота.
- **`shared/deadline-dialog` → `shared/schedule-dialog`** (98 и 317 строк; шаблоны 41 и 95): поля
  даты, чекбоксы, числовое поле, кнопки; оба открываются из `table-control`, главной таблицы
  модуля, так что их видит больше пользователей. `type="date"` заменил бы датапикер кита.

**Оболочка диалога:** `src/styles.scss:688` клиента задаёт `.cdk-overlay-pane { max-width: unset
!important; max-height: unset !important }` для каждого оверлея. `ui-dialog` кита держит боковой
отступ через `max-inline-size` своего pane (`.ui-dialog-pane`), а это правило его перебивает, так
что на узком экране широкий диалог кита дошёл бы до краёв экрана. `styles.scss` — общий файл, который
пилот не меняет (решение 2 спеки). Если оставить оболочкой `MatDialog` и положить внутрь
контролы кита, проблемы нет; переход на `ui-dialog` требует либо обхода в ките (например, отступ
на контейнере диалога, а не на pane), либо правки `styles.scss`.

**Варианты:**

1. `create-quote-item-dialog` в оболочке `MatDialog` (рекомендую): ближайший к пилоту экран (та же
   страница настроек и администраторы), проверяет `ui-multi-select`, `ui-number-input` и поля
   формы с настоящими лейблами, а вопрос оболочки подождёт экрана, которому нужен диалог кита.
2. `create-quote-item-dialog` с оболочкой `ui-dialog` кита: заодно решает конфликт
   `.cdk-overlay-pane` (сначала тикет в ките, замер проверкой CSS хоста с этим правилом).
3. `deadline-dialog` → `schedule-dialog` в оболочке `MatDialog`: больше пользователей, приносит в
   клиент датапикер кита, но это сразу два экрана.
