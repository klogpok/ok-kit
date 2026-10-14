# 01: embed stylesheet, its loader and host-CSS resistance

**Status:** done
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

- [x] `styles/ui-kit-embed.scss`: the tokens and the layout classes. No `_base`, no
  `_typography`. Explicit `[data-theme='dark']` keeps working; the
  `@media (prefers-color-scheme: dark)` block is not in the embed output. Change the token
  generator (`tokens/build-tokens.mts`) rather than editing generated CSS, and keep `ui-kit.scss`
  unchanged.
- [x] `ui-embed-styles` (`UiEmbedStyles`, in `@vplans/ui-kit/theme`): an unencapsulated component
  with no content whose `styleUrl` is the embed stylesheet, so the tokens reach `:root` and the
  overlays while a consumer renders it. Its stylesheet must compile from a copied location without
  `includePaths` (relative `@use` only).
- [x] Component roots and overlay panels set `text-align: start`, so a host `text-align` does not
  leak in. Decide (and record) whether they also set `color` and `letter-spacing` or keep
  inheriting the host's.
- [x] Every `label` element a kit component renders sets its own `margin` and `display`, so a host
  reboot does not move it. Cover at least form-field, checkbox, radio, switch, segmented and slider;
  grep the templates for `<label`.
- [x] Every `svg` a kit component renders (icons, checkbox mark, spinner) sets its own
  `vertical-align`.
- [x] `scripts/check-host-css.mjs` from `../prototype/host-css-check.mjs`: run every story with a
  host stylesheet prepended and fail on pixel or computed-style changes. The fixture is Bootstrap
  4.6 reboot plus the `html`/`body` rules of the client, checked into the kit (no read from the
  client at check time); add the bootstrap CSS as a devDependency or vendor the reboot part. Cover
  light RTL and light LTR, and a focused button. Add it to the `/phase-check` command. The rerun
  must show no changes except the accepted inherited `color`/`letter-spacing`, if kept.
- [x] Existing visual baselines must not change.
- [x] Docs: "Embedding into an existing app" on the Getting started MDX page (`<ui-embed-styles />`,
  what is left out and why, what a host rule can still reach), README exports, CHANGELOG; the
  gotcha in `.claude/rules/styles.md`.
- [x] Commits `feat(styles): embed stylesheet for host apps` and
  `test(styles): host stylesheet check`.

## Comments

**2026-10-14 - done.** Commits `feat(styles): embed stylesheet for host apps` and
`test(styles): host stylesheet check`.

- **Embed stylesheet.** `build-tokens.mts` writes `styles/_tokens-embed.scss` (the tokens without the
  `prefers-color-scheme: dark` block); `tokens.css`, `_tokens.scss` and `ui-kit.scss` are byte for
  byte unchanged. `styles/ui-kit-embed.scss` is that file plus `_layout-classes`. Compiled with
  `sass` from a copy outside the repo, without `includePaths`: no `prefers-color-scheme`, no `body`
  rule, no typography classes, `[data-theme='dark']` present.
- **`UiEmbedStyles`** (`theme/embed-styles.ts`): `ViewEncapsulation.None`, empty template, `hidden`
  host, `styleUrl: '../styles/ui-kit-embed.scss'`. A spec; no story (it draws nothing).
- **Decision on `color` and `letter-spacing` (for the user to confirm): they stay inherited from
  the host.** Kit text that has no color of its own (plain option text, projected text) then
  matches the host's text around it; many components already set their own color (checkbox, radio,
  switch, tabs, table, tree…), and `ui-icon`/`ui-spinner` must keep `currentColor`, so a blanket
  `color` on every root would break them. The check applies the host body's `color` and
  `letter-spacing` to both captures; `--strict` reports them too.
- **Host-CSS resistance.** `text-align: start` on every component root (`:host`, or the root class of
  the unencapsulated icon, table, menu, dialog and drawer), the table viewport and every overlay
  panel; `a[ui-button]`/`button[ui-button]` get `center`, the browser's value for a button. `margin:
  0` on the labels of form-field (also `display: block`), checkbox, radio, switch and segment (the
  only `<label` in kit templates; slider has none of its own). `vertical-align: baseline` on the
  icon, checkbox, spinner and tree SVGs and on the avatar image. Found by the check and fixed too:
  `font: inherit` on the native inputs of checkbox, radio, switch, segment and slider and on the
  icon buttons of chip, number-input, file-upload and select (Bootstrap's `button, input { font:
  inherit }` changed them), and the table caption keeps `caption-side: top`, no extra padding and
  the table's color (Bootstrap moved it to the bottom in gray).
- **Not resistible by the kit:** where a component sits in the host's own markup. In the first
  measurement the submit button of a form moved left because the story's `form` took
  `text-align: left`; any inline element of the host moves the same way.
- **Check.** `pnpm test-host-css` (`scripts/check-host-css.mjs`, fixture `scripts/host-css/`:
  Bootstrap 4.6.2 `bootstrap.min.css` vendored unchanged with its MIT header, as the client loads it,
  and the client's html/body rules). Light RTL, light LTR, focus RTL (the first `.ui-button`
  focused with `focusVisible`, stories without a play function): 700 captures. It fails on a
  computed-style change of a kit element (44 properties) or on the pixels of an outermost kit
  element, cut out of both captures, so a component that only moves with the story's markup does
  not count; for the pixels the host's `text-align` is taken back, its leaks are caught by the
  computed `text-align`. Three stories whose own markup inside a component changes are listed with
  a reason in `STORY_MARKUP` (expandable rows: the story's `<dt>` turns bold; stepper default and
  vertical: the story's `<p>` margins). Before the fixes the first full run failed 695 of 700
  captures; now 0, with 9 known captures of those three stories. Added to `/phase-check`.
- Visual baselines: unchanged (`pnpm test-visual`).
- **Open:** `pnpm build:playground` fails on the 8 kB `anyComponentStyle` budget, because the
  playground imports `@vplans/ui-kit/theme` and so compiles the 41 kB embed stylesheet; options in
  ticket 08. The `color`/`letter-spacing` decision is ticket 09.

## Русский перевод

# 01: встраиваемые стили, их загрузчик и устойчивость к CSS хоста

**Статус:** сделано
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

- [x] `styles/ui-kit-embed.scss`: токены и layout-классы. Без `_base` и `_typography`. Явный
  `[data-theme='dark']` продолжает работать; блока `@media (prefers-color-scheme: dark)` во
  встраиваемом выходе нет. Менять генератор токенов (`tokens/build-tokens.mts`), а не
  сгенерированный CSS; `ui-kit.scss` не меняется.
- [x] `ui-embed-styles` (`UiEmbedStyles`, в `@vplans/ui-kit/theme`): компонент без инкапсуляции и
  без содержимого, его `styleUrl` — встраиваемые стили, поэтому токены доходят до `:root` и
  оверлеев, пока потребитель его рисует. Его стили должны собираться из скопированного места без
  `includePaths` (только относительные `@use`).
- [x] Корни компонентов и панели оверлеев задают `text-align: start`, чтобы `text-align` хоста не
  просачивался. Решить (и записать), задают ли они ещё `color` и `letter-spacing` или продолжают
  наследовать их от хоста.
- [x] Каждый `label`, который рисует компонент кита, сам задаёт `margin` и `display`, чтобы reboot
  хоста его не сдвигал. Покрыть как минимум form-field, checkbox, radio, switch, segmented и
  slider; найти `<label` в шаблонах.
- [x] Каждый `svg`, который рисует компонент кита (иконки, галочка checkbox, spinner), сам задаёт
  `vertical-align`.
- [x] Скрипт `scripts/check-host-css.mjs` на основе `../prototype/host-css-check.mjs`: каждая story
  с подключённым первым CSS хоста, падение при изменении пикселей или вычисленных стилей. Фикстура —
  Bootstrap 4.6 reboot и правила `html`/`body` клиента, лежит в ките (при проверке клиент не
  читается); bootstrap CSS — devDependency или вендорная часть reboot. Покрыть светлую RTL и
  светлую LTR и кнопку в фокусе. Добавить в команду `/phase-check`. Повторный прогон не должен
  показывать изменений, кроме принятого наследования `color`/`letter-spacing`, если его оставят.
- [x] Существующие базовые снимки не меняются.
- [x] Документация: раздел «Embedding into an existing app» на MDX-странице Getting started
  (`<ui-embed-styles />`, что исключено и почему, что правило хоста ещё может задеть), exports в
  README, CHANGELOG; gotcha в `.claude/rules/styles.md`.
- [x] Коммиты `feat(styles): embed stylesheet for host apps` и
  `test(styles): host stylesheet check`.

## Комментарии

**2026-10-14 - сделано.** Коммиты `feat(styles): embed stylesheet for host apps` и
`test(styles): host stylesheet check`.

- **Встраиваемые стили.** `build-tokens.mts` пишет `styles/_tokens-embed.scss` (токены без блока
  `prefers-color-scheme: dark`); `tokens.css`, `_tokens.scss` и `ui-kit.scss` не изменились ни на
  байт. `styles/ui-kit-embed.scss` — этот файл плюс `_layout-classes`. Скомпилирован `sass` из копии
  вне репозитория без `includePaths`: нет `prefers-color-scheme`, нет правила `body`, нет классов
  типографики, `[data-theme='dark']` на месте.
- **`UiEmbedStyles`** (`theme/embed-styles.ts`): `ViewEncapsulation.None`, пустой шаблон, хост
  `hidden`, `styleUrl: '../styles/ui-kit-embed.scss'`. Есть spec; story нет (он ничего не рисует).
- **Решение по `color` и `letter-spacing` (подтвердить пользователю): остаются унаследованными от
  хоста.** Текст кита без своего цвета (простой текст опции, проецируемый текст) совпадает с
  текстом хоста вокруг; многие компоненты уже задают свой цвет (checkbox, radio, switch, tabs,
  table, tree…), а `ui-icon`/`ui-spinner` должны сохранять `currentColor`, так что `color` на всех
  корнях их сломал бы. Проверка применяет `color` и `letter-spacing` body хоста к обоим снимкам;
  `--strict` показывает и их.
- **Устойчивость к CSS хоста.** `text-align: start` на корне каждого компонента (`:host` или
  корневой класс неинкапсулированных icon, table, menu, dialog и drawer), на viewport таблицы и на
  каждой панели оверлея; `a[ui-button]`/`button[ui-button]` получают `center` — значение браузера
  для кнопки. `margin: 0` у лейблов form-field (ещё `display: block`), checkbox, radio, switch и
  segment (это все `<label` в шаблонах кита; у slider своего нет). `vertical-align: baseline` у SVG
  icon, checkbox, spinner и tree и у картинки avatar. Найдено проверкой и тоже исправлено:
  `font: inherit` у нативных input в checkbox, radio, switch, segment и slider и у иконочных кнопок
  chip, number-input, file-upload и select (их менял `button, input { font: inherit }` из
  Bootstrap), а caption таблицы остаётся сверху (`caption-side: top`), без лишних отступов и с цветом
  таблицы (Bootstrap уносил его вниз и красил серым).
- **Чему кит помешать не может:** где компонент стоит в разметке самого хоста. В первом замере
  кнопка отправки формы уезжала влево, потому что `form` story наследовала `text-align: left`; любой
  inline-элемент хоста сдвигается так же.
- **Проверка.** `pnpm test-host-css` (`scripts/check-host-css.mjs`, фикстура `scripts/host-css/`:
  `bootstrap.min.css` Bootstrap 4.6.2 без изменений, с заголовком MIT, как его подключает клиент, и
  правила html/body клиента). Светлая RTL, светлая LTR, фокус RTL (первая `.ui-button` в фокусе
  через `focusVisible`, stories без play-функции): 700 снимков. Падает при изменении вычисленного
  стиля элемента кита (44 свойства) или пикселей внешнего элемента кита, вырезанного из обоих
  снимков, так что компонент, который только сдвинулся вместе с разметкой story, не считается; для
  пикселей `text-align` хоста возвращается назад, его утечки ловит вычисленный `text-align`. Три
  story, чья собственная разметка внутри компонента меняется, перечислены с причиной в
  `STORY_MARKUP` (expandable rows: `<dt>` story становится жирным; stepper default и vertical:
  отступы `<p>` story). До исправлений первый полный прогон падал на 695 из 700 снимков; теперь 0,
  и 9 известных снимков этих трёх story. Добавлено в `/phase-check`.
- Базовые снимки не изменились (`pnpm test-visual`).
- **Открыто:** `pnpm build:playground` падает на бюджете `anyComponentStyle` 8 kB: playground
  импортирует `@vplans/ui-kit/theme` и поэтому компилирует встраиваемые стили на 41 kB; варианты —
  в тикете 08. Решение по `color`/`letter-spacing` — тикет 09.
