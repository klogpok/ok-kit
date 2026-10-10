# 01: Chip appearance, size, tone and filter icons

**What to build:** the user does not like how chips look today. The new default is the **outline** chip: rectangular with a small radius, a border on a surface background, and a selected filter chip filled with the text color (dark in light mode, light in dark mode), so the selection reads at a glance. Today's look (gray pill display chips, outlined pill filter chips with a blue tint when selected) stays available as `appearance="soft"`. Along with it the chips get a compact size, color tones for tags and statuses, and icons in filter chips.

The prototype the user chose from (variant B is the new default, variant A is `soft`, variant E shows the `sm` size, the "Статусы" row shows tones): https://claude.ai/artifact/NX8qAnJYCvStWri3Wc3RG7

**Blocked by:** None (can start immediately)

**Status:** done

## Decisions taken with the user

- `appearance: 'outline' | 'soft'` on `ui-chip` and `button[ui-filter-chip]`. The default is `outline`.
- The appearance is resolved in this order: the input on the chip, then the input on the surrounding `ui-chip-set`, then `provideUiChip({ appearance })` for the app, then `outline`. The provider follows `provideUiDialog` (injection token with partial defaults).
- `size: 'sm' | 'md'` (default `md`), resolved the same way as the appearance. `sm` is the compact chip for tables and cards (about 22px for a display chip, 26px for a filter chip, font size xs). Phase 9 calls size a property of one control and density a property of a region; `sm` does not depend on `data-density`.
- `tone` on `ui-chip` only: `neutral | primary | info | success | warning | danger`, the same names as `ui-badge`. A toned chip has a tinted background and the tone's text color, without a border, in either appearance. With no tone the chip follows its appearance.
- Filter chips keep the `[uiChipIcon]` slot (it is already in the template) and it becomes a documented feature: the icon takes the primary color, and when the chip is selected the check mark takes the icon's place instead of standing next to it.
- `ui-chip-input` and the chips of `ui-multi-select` follow the app default like any other chip.

## Notes

- Tokens: split the chip tokens in `tokens.json` into shared ones (text, icon, font sizes, paddings, gap, set gap) and per-appearance groups `chip.outline.*` and `chip.soft.*` (radius, bg, border, filter bg/border/hover, filter selected bg/border/text), plus `chip.<tone>.bg/text` over the semantic `*-subtle` / `*-text` colors. Outline: radius `{radius.control}`, border `{color.border-control}`, selected `{color.text}` on `{color.text-inverse}`. Soft keeps today's values, so `appearance="soft"` matches the current baselines.
- The set passes its appearance and size to the chips through the internal `UiChipSetParent`, not through public API.
- The default changes from today's look to outline, so every chip in the app changes. Record it in the CHANGELOG as a visual breaking change and in `docs/DECISIONS.md`.

## Acceptance

- [x] `appearance`, `size` and `tone` inputs on the chips, `appearance` and `size` on `ui-chip-set`, and `provideUiChip` exported from the chip entry point
- [x] Specs show the resolution order: chip input over set input over provider over the built-in `outline`, for appearance and size
- [x] A selected filter chip with an icon shows the check mark instead of the icon
- [x] Stories: Appearances (outline and soft side by side), Sizes, Tones, Filters with icons; existing stories show the new default
- [x] `soft` looks the same as today's chips in the browser; visual baselines updated and reviewed in light, dark and RTL
- [x] Contrast: text, the selected filter and every tone meet AA in light and dark; forced colors still show the chip border and the selected state
- [x] README (chip section), CHANGELOG and `docs/DECISIONS.md` updated
- [x] The full check of the `/phase-check` skill passes

## Русский перевод

# 01: Вид, размер, тон чипсов и иконки в фильтрах

**Что сделать:** пользователю не нравится, как сейчас выглядят чипсы. Новый вид по умолчанию — **outline** (контурный): прямоугольник с небольшим скруглением, рамка на фоне поверхности, а выбранный фильтр залит цветом текста (тёмным в светлой теме, светлым в тёмной), так что выбор виден сразу. Нынешний вид (серые чипсы-«таблетки» для отображения, обведённые «таблетки» для фильтров с голубой заливкой у выбранного) остаётся доступен как `appearance="soft"`. Вместе с этим у чипсов появляются компактный размер, цветные тона для тегов и статусов и иконки в фильтрах.

Прототип, по которому пользователь выбирал (вариант B — новый вид по умолчанию, вариант A — `soft`, вариант E показывает размер `sm`, строка «Статусы» — тона): https://claude.ai/artifact/NX8qAnJYCvStWri3Wc3RG7

**Заблокировано:** Нет (можно начинать сразу)

**Статус:** сделано

## Решения, принятые с пользователем

- `appearance: 'outline' | 'soft'` у `ui-chip` и `button[ui-filter-chip]`. По умолчанию `outline`.
- Вид определяется в таком порядке: вход на самом чипсе, затем вход на окружающем `ui-chip-set`, затем `provideUiChip({ appearance })` для всего приложения, затем `outline`. Провайдер сделан по образцу `provideUiDialog` (injection token с частичными умолчаниями).
- `size: 'sm' | 'md'` (по умолчанию `md`) определяется так же, как вид. `sm` — компактный чипс для таблиц и карточек (около 22px у чипса для отображения, 26px у фильтра, шрифт xs). В фазе 9 size — свойство одного контрола, а density — свойство области страницы; `sm` не зависит от `data-density`.
- `tone` только у `ui-chip`: `neutral | primary | info | success | warning | danger`, те же имена, что у `ui-badge`. Чипс с тоном получает подкрашенный фон и цвет текста тона, без рамки, при любом виде. Без тона чипс выглядит согласно своему виду.
- У фильтров остаётся слот `[uiChipIcon]` (он уже есть в шаблоне), и он становится документированной возможностью: иконка окрашена в основной цвет, а у выбранного фильтра галочка встаёт на место иконки, а не рядом с ней.
- `ui-chip-input` и чипсы `ui-multi-select` берут умолчание приложения, как любые другие чипсы.

## Заметки

- Токены: разделить токены чипсов в `tokens.json` на общие (текст, иконка, размеры шрифта, отступы, gap, gap набора) и группы по виду `chip.outline.*` и `chip.soft.*` (скругление, фон, рамка, фон/рамка/hover фильтра, фон/рамка/текст выбранного фильтра), плюс `chip.<tone>.bg/text` поверх семантических цветов `*-subtle` / `*-text`. Outline: скругление `{radius.control}`, рамка `{color.border-control}`, выбранный — `{color.text}` с текстом `{color.text-inverse}`. Soft сохраняет нынешние значения, поэтому `appearance="soft"` совпадает с текущими визуальными снимками.
- Набор передаёт вид и размер чипсам через внутренний `UiChipSetParent`, а не через публичный API.
- Умолчание меняется с нынешнего вида на outline, поэтому поменяются все чипсы в приложении. Записать это в CHANGELOG как визуальное ломающее изменение и в `docs/DECISIONS.md`.

## Приёмка

- [x] Входы `appearance`, `size` и `tone` у чипсов, `appearance` и `size` у `ui-chip-set`, `provideUiChip` экспортируется из entry point chip
- [x] Спеки показывают порядок: вход чипса сильнее входа набора, тот сильнее провайдера, тот сильнее встроенного `outline` — для вида и размера
- [x] Выбранный фильтр с иконкой показывает галочку вместо иконки
- [x] Stories: Appearances (outline и soft рядом), Sizes, Tones, фильтры с иконками; существующие stories показывают новое умолчание
- [x] `soft` в браузере выглядит так же, как нынешние чипсы; визуальные снимки обновлены и просмотрены в light, dark и RTL
- [x] Контраст: текст, выбранный фильтр и каждый тон проходят AA в светлой и тёмной теме; в forced colors видны рамка чипса и выбранное состояние
- [x] README (раздел chip), CHANGELOG и `docs/DECISIONS.md` обновлены
- [x] Полный чеклист скилла `/phase-check` проходит
