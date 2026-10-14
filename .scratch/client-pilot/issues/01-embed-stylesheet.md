# 01: embed stylesheet, its loader and host-CSS resistance

**Status:** ready-for-agent
**Blocked by:** None

A host app that already has its own base styles (the client: Bootstrap 4.6 reboot, Material theme,
`html {}` background) needs the kit's tokens and component styles without the kit's document
defaults, must be able to load them without touching its `angular.json`, and must not bend the
kit's components with its global rules. Spec decisions 4–5.

**Measured on 2026-10-14** (`../prototype/host-css-check.mjs`): the client's global CSS (built by
`../prototype/client-css.mjs` from bootstrap, `styles.scss`, `ol.css` and `ckeditor5.css`),
prepended to every story of the kit Storybook in light RTL, changed 266 of 306 stories:

- `body { text-align: left }` (reboot) is inherited by the components: in RTL the form-field hint
  and the submit button of a form move to the left edge. This breaks RTL.
- `label { margin-bottom: .5rem }` (reboot): 8px under the form-field and checkbox labels; table
  rows with selection grow and their checkboxes sit above the text.
- `svg { vertical-align: middle }` (reboot): icons shift by 1–2px.
- `body` color `#212529` and the client's `letter-spacing: -0.01em` are inherited where the kit does
  not set them (table and listbox text, `p`). Barely visible; it matches the rest of the app, so it
  may stay.
- Font sizes and line heights did not change: the components set their own. `ol.css` and
  `ckeditor5.css` are scoped to `.ol-*`/`.ck-*` and touch nothing. Not covered: dark theme, LTR,
  focus states (Bootstrap 4.6 has its own `button:focus` rules). The Storybook still had the kit's
  `_base` on `:root`; without it the components inherit more from the host `body`, so the list is a
  lower bound.

Before/after screenshots: `../prototype/*.png`.

- [ ] `styles/ui-kit-embed.scss`: the tokens and the layout classes. No `_base`, no
  `_typography`. Explicit `[data-theme='dark']` keeps working; the
  `@media (prefers-color-scheme: dark)` block is not in the embed output. Change the token
  generator (`tokens/build-tokens.mts`) rather than editing generated CSS, and keep `ui-kit.scss`
  unchanged.
- [ ] `ui-embed-styles` (`UiEmbedStyles`, in `@vplans/ui-kit/theme`): an unencapsulated component
  with no content whose `styleUrl` is the embed stylesheet, so the tokens reach `:root` and the
  overlays while a consumer renders it. Its stylesheet must compile from a copied location without
  `includePaths` (relative `@use` only).
- [ ] Component roots and overlay panels set `text-align: start`, so a host `text-align` does not
  leak in. Decide (and record) whether they also set `color` and `letter-spacing` or keep
  inheriting the host's.
- [ ] Every `label` element a kit component renders sets its own `margin` and `display`, so a host
  reboot does not move it. Cover at least form-field, checkbox, radio, switch, segmented and slider;
  grep the templates for `<label`.
- [ ] Every `svg` a kit component renders (icons, checkbox mark, spinner) sets its own
  `vertical-align`.
- [ ] `scripts/check-host-css.mjs` from `../prototype/host-css-check.mjs`: run every story with a
  host stylesheet prepended and fail on pixel or computed-style changes. The fixture is Bootstrap
  4.6 reboot plus the `html`/`body` rules of the client, checked into the kit (no read from the
  client at check time); add the bootstrap CSS as a devDependency or vendor the reboot part. Cover
  light RTL and light LTR, and a focused button. Add it to the `/phase-check` command. The rerun
  must show no changes except the accepted inherited `color`/`letter-spacing`, if kept.
- [ ] Existing visual baselines must not change.
- [ ] Docs: "Embedding into an existing app" on the Getting started MDX page (`<ui-embed-styles />`,
  what is left out and why, what a host rule can still reach), README exports, CHANGELOG; the
  gotcha in `.claude/rules/styles.md`.
- [ ] Commits `feat(styles): embed stylesheet for host apps` and
  `test(styles): host stylesheet check`.

## Русский перевод

# 01: встраиваемые стили, их загрузчик и устойчивость к CSS хоста

**Статус:** ready-for-agent
**Зависит от:** нет

Приложению-хосту, у которого уже есть свои базовые стили (у клиента: Bootstrap 4.6 reboot, тема
Material, фон на `html {}`), нужны токены и стили компонентов кита без его стилей документа.
Подключить их надо, не трогая его `angular.json`, а его глобальные правила не должны гнуть
компоненты кита. Решения 4–5 спеки.

**Замер 2026-10-14** (`../prototype/host-css-check.mjs`): глобальный CSS клиента (собран
`../prototype/client-css.mjs` из bootstrap, `styles.scss`, `ol.css` и `ckeditor5.css`), подключённый
первым к каждой story Storybook кита в светлой теме RTL, изменил 266 из 306 stories:

- `body { text-align: left }` (reboot) наследуется компонентами: в RTL подсказка под полем и
  кнопка отправки формы уезжают к левому краю. Это ломает RTL.
- `label { margin-bottom: .5rem }` (reboot): +8px под лейблами form-field и checkbox; строки
  таблицы с выбором становятся выше, галочки — выше текста.
- `svg { vertical-align: middle }` (reboot): иконки сдвигаются на 1–2px.
- Цвет `body` `#212529` и `letter-spacing: -0.01em` клиента наследуются там, где кит их не задаёт
  (текст таблицы и списка, `p`). Почти незаметно и совпадает с остальным приложением, поэтому
  можно оставить.
- Размеры шрифта и line-height не изменились: компоненты задают их сами. `ol.css` и
  `ckeditor5.css` ограничены `.ol-*`/`.ck-*` и ничего не задевают. Не покрыто: тёмная тема, LTR,
  фокус (у Bootstrap 4.6 свои правила `button:focus`). В Storybook оставался `_base` кита на
  `:root`; без него компоненты сильнее наследуют `body` хоста, так что список — нижняя граница.

Снимки до и после: `../prototype/*.png`.

- [ ] `styles/ui-kit-embed.scss`: токены и layout-классы. Без `_base` и `_typography`. Явный
  `[data-theme='dark']` продолжает работать; блока `@media (prefers-color-scheme: dark)` во
  встраиваемом выходе нет. Менять генератор токенов (`tokens/build-tokens.mts`), а не
  сгенерированный CSS; `ui-kit.scss` не меняется.
- [ ] `ui-embed-styles` (`UiEmbedStyles`, в `@vplans/ui-kit/theme`): компонент без инкапсуляции и
  без содержимого, его `styleUrl` — встраиваемые стили, поэтому токены доходят до `:root` и
  оверлеев, пока потребитель его рисует. Его стили должны собираться из скопированного места без
  `includePaths` (только относительные `@use`).
- [ ] Корни компонентов и панели оверлеев задают `text-align: start`, чтобы `text-align` хоста не
  просачивался. Решить (и записать), задают ли они ещё `color` и `letter-spacing` или продолжают
  наследовать их от хоста.
- [ ] Каждый `label`, который рисует компонент кита, сам задаёт `margin` и `display`, чтобы reboot
  хоста его не сдвигал. Покрыть как минимум form-field, checkbox, radio, switch, segmented и
  slider; найти `<label` в шаблонах.
- [ ] Каждый `svg`, который рисует компонент кита (иконки, галочка checkbox, spinner), сам задаёт
  `vertical-align`.
- [ ] Скрипт `scripts/check-host-css.mjs` на основе `../prototype/host-css-check.mjs`: каждая story
  с подключённым первым CSS хоста, падение при изменении пикселей или вычисленных стилей. Фикстура —
  Bootstrap 4.6 reboot и правила `html`/`body` клиента, лежит в ките (при проверке клиент не
  читается); bootstrap CSS — devDependency или вендорная часть reboot. Покрыть светлую RTL и
  светлую LTR и кнопку в фокусе. Добавить в команду `/phase-check`. Повторный прогон не должен
  показывать изменений, кроме принятого наследования `color`/`letter-spacing`, если его оставят.
- [ ] Существующие базовые снимки не меняются.
- [ ] Документация: раздел «Embedding into an existing app» на MDX-странице Getting started
  (`<ui-embed-styles />`, что исключено и почему, что правило хоста ещё может задеть), exports в
  README, CHANGELOG; gotcha в `.claude/rules/styles.md`.
- [ ] Коммиты `feat(styles): embed stylesheet for host apps` и
  `test(styles): host stylesheet check`.
