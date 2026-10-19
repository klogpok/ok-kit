# 16: a collapsed section makes the settings page scroll into empty space

**Spec:** [../spec.md](../spec.md), tickets 05 and 14

**Status:** done
**Blocked by:** None

**Facts:** the user's browser check (ticket 14) found that the `apartment-changes-new` settings page
scrolls far below its last card into empty space while the action weights section is collapsed.
The client's `ac-settings-section` collapses its body with `grid-template-rows: 0fr` and
`overflow: hidden`, and no ancestor up to the document is positioned. Each of the 9 weight fields is
a `ui-form-field`, and its empty error live region (`.ui-form-field__error--empty`) is visually
hidden with `position: absolute`. The field's host was not positioned, so the region's containing
block was the document: the clipping body did not clip it, and the last region kept the page as tall
as the expanded section. Measured in Edge: a field after a 2000px collapsed spacer made the page
2040px tall; `position: relative` on the field brought it back to the viewport height.

A browser audit of every story found the same pattern in three more places, not seen in the client
yet: the hidden step state of `ui-stepper` (`.ui-visually-hidden` in `.ui-stepper__header`), the
hidden label of a `ui-badge` count or dot, and a `ui-visually-hidden` caption or header text in
`table[ui-table]`. The user chose to fix them in this ticket.

- [x] A failing play story per component, `InCollapsedPanel`: the component at the end of a
  `200rem` collapsed panel with no positioned ancestor, and the page must not scroll. Red before
  the fix (page 3240–3291px for a 720px viewport), green after.
- [x] `position: relative` on the element that holds the hidden text: the `ui-form-field` and
  `ui-badge` hosts, `.ui-stepper__header`, `.ui-table`.
- [x] Visual baselines: no existing snapshot changes; the four new stories get baselines.
- [x] `/phase-check`.
- [x] Commit `fix(form-field): contain the hidden error region in a collapsed panel` (and the same
  for badge, stepper and table).
- [x] `pnpm sync:client` into `feat/ui-kit-pilot`, `--check` and `--verify`, and commit the copy
  there.
- [x] The user checks the settings page again (ticket 14).

## Comments

- 2026-10-19: Kit commits `23625da` (form-field), `082358e` (badge), `574ab25` (stepper),
  `60668c1` (table) and `d82852f` (baselines); client commit `e5ddbf58e` on
  `feat/ui-kit-pilot` (5 files: the four stylesheets and `SYNCED.md`).
  - **Baselines.** The four new stories are 24px tall in every mode: only the line above the
    collapsed panel. One existing snapshot changed: `table--wide-with-sticky-columns` light
    RTL/LTR (419 px, 0.12%). The status badges under the sticky column now render with grayscale
    instead of subpixel text antialiasing (a positioned badge gets its own layer there); the
    geometry is the same, checked on a 6× crop.
  - **`/phase-check`.** lint and format clean; 993 unit tests, coverage 98.68/83.55/94.49/98.68;
    playground 8; build and playground build (the known `ui-kit-embed.scss` 7 kB warning only);
    314 stories × 3 modes without axe violations; no visual changes after the update;
    `test-host-css` 716 captures, no kit element changed; stories `ngc` 0 errors.
  - **Client.** `sync:client --check` matches (237 files); `--verify`: `ngc` 0 errors in 41 entry
    points, 59/59 stylesheets. The client's production build was not rerun: the change is four
    `position: relative` lines.
- 2026-10-19: Verified by the user in the live app after `feat/ui-kit-pilot` was merged into `try/ui-kit-pilot` (`8d8195c68`): the page no longer scrolls into empty space.

## Русский перевод

# 16: свёрнутый раздел прокручивает страницу настроек в пустоту

**Спека:** [../spec.md](../spec.md), тикеты 05 и 14

**Статус:** сделано
**Заблокирован:** нет

**Факты:** при проверке в браузере (тикет 14) пользователь заметил, что страница настроек
`apartment-changes-new` прокручивается далеко ниже последней карточки, в пустоту, пока раздел весов
действий свёрнут. `ac-settings-section` клиента сворачивает тело через `grid-template-rows: 0fr` и
`overflow: hidden`, и ни один предок вплоть до документа не позиционирован. Каждое из 9 полей веса —
`ui-form-field`, и его пустая live-область ошибки (`.ui-form-field__error--empty`) скрыта визуально
с `position: absolute`. Хост поля не был позиционирован, поэтому containing block области — документ:
обрезающее тело её не обрезало, и последняя область держала высоту страницы как у развёрнутого
раздела. Замер в Edge: поле после свёрнутого спейсера в 2000px делало страницу высотой 2040px;
`position: relative` на поле вернуло её к высоте окна.

Проверка всех stories в браузере нашла тот же шаблон ещё в трёх местах, в клиенте пока не
встречавшихся: скрытое состояние шага `ui-stepper` (`.ui-visually-hidden` в `.ui-stepper__header`),
скрытая подпись счётчика или точки `ui-badge` и подпись или текст заголовка с `ui-visually-hidden` в
`table[ui-table]`. Пользователь решил исправить их в этом тикете.

- [x] Падающая play story на каждый компонент, `InCollapsedPanel`: компонент в конце свёрнутой
  панели высотой `200rem` без позиционированного предка, страница не должна прокручиваться. Красная
  до исправления (страница 3240–3291px при окне 720px), зелёная после.
- [x] `position: relative` на элементе, который держит скрытый текст: хосты `ui-form-field` и
  `ui-badge`, `.ui-stepper__header`, `.ui-table`.
- [x] Визуальные эталоны: ни один существующий снимок не меняется; четыре новые stories получают
  эталоны.
- [x] Прогнать `/phase-check`.
- [x] Коммит `fix(form-field): contain the hidden error region in a collapsed panel` (и такие же для
  badge, stepper и table).
- [x] `pnpm sync:client` в `feat/ui-kit-pilot`, `--check` и `--verify`, и коммит копии там.
- [x] Пользователь заново проверяет страницу настроек (тикет 14).

## Комментарии

- 2026-10-19: Коммиты кита `23625da` (form-field), `082358e` (badge), `574ab25` (stepper),
  `60668c1` (table) и `d82852f` (эталоны); коммит клиента `e5ddbf58e` в `feat/ui-kit-pilot`
  (5 файлов: четыре таблицы стилей и `SYNCED.md`).
  - **Эталоны.** Четыре новые stories высотой 24px во всех режимах: только строка над свёрнутой
    панелью. Изменился один существующий снимок: `table--wide-with-sticky-columns` light RTL/LTR
    (419 px, 0.12%). Бейджи статуса под sticky-колонкой теперь сглаживают текст в оттенках серого,
    а не субпиксельно (позиционированный бейдж получает там свой слой); геометрия та же, проверено
    на увеличенном в 6 раз фрагменте.
  - **`/phase-check`.** lint и format чисто; 993 unit-теста, coverage 98.68/83.55/94.49/98.68;
    playground 8; сборка и сборка playground (только известное предупреждение 7 kB у
    `ui-kit-embed.scss`); 314 stories × 3 режима без нарушений axe; после обновления визуальных
    изменений нет; `test-host-css` 716 снимков, ни один элемент кита не изменился; `ngc` stories —
    0 ошибок.
  - **Клиент.** `sync:client --check` совпадает (237 файлов); `--verify`: `ngc` 0 ошибок в 41 entry
    point, 59/59 стилей. Production-сборку клиента заново не запускали: правка — четыре строки
    `position: relative`.
- 2026-10-19: Пользователь проверил в живом приложении после слияния `feat/ui-kit-pilot` в `try/ui-kit-pilot` (`8d8195c68`): страница больше не прокручивается в пустоту.
