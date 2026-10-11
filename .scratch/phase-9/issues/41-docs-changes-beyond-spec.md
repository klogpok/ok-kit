# 41: Docs changes beyond the spec

**Spec:** [../spec.md](../spec.md) → 9.5

**Status:** needs-info

**Facts:** phase 9.5 made changes the spec did not ask for:

- `storySort` in `.storybook/preview.ts` puts Docs first and also fixes the order of the other groups: Foundations, Actions, Forms, Layout, Navigation, Overlays, Feedback, Data display. Before, the order was the file discovery order.
- The story export `SignalForms` in `form-field.stories.ts` is renamed `AccountForm` (its display name was already "Account form"), so the Forms page does not name a removed API; its three baselines were moved with `git mv`.
- Docs pages follow the toolbar theme and direction: `.storybook/preview.scss` paints the docs wrapper, canvases and prose with the kit tokens, and a channel listener in `preview.ts` sets `data-theme`/`dir` on pages without a story. The English prose stays LTR under the RTL toolbar; only the canvases turn RTL. Before, in dark mode the canvases stayed white with light text, and autodocs pages had the same problem.
- Storybook's own "Copy code" button under a code block keeps its low contrast in dark mode.

**Options:**

1. Keep all of it (recommended).
2. Revert some of it: name which.

## Русский перевод

# 41: Изменения docs сверх спеки

**Спека:** [../spec.md](../spec.md) → 9.5

**Статус:** needs-info

**Факты:** фаза 9.5 сделала изменения, которых спека не просила:

- `storySort` в `.storybook/preview.ts` ставит Docs первым и заодно фиксирует порядок остальных групп: Foundations, Actions, Forms, Layout, Navigation, Overlays, Feedback, Data display. Раньше порядок был порядком обнаружения файлов.
- Export story `SignalForms` в `form-field.stories.ts` переименован в `AccountForm` (отображаемое имя уже было «Account form»), чтобы страница Forms не называла удалённый API; три его baseline перенесены через `git mv`.
- Docs-страницы следуют теме и направлению из toolbar: `.storybook/preview.scss` красит обёртку docs, canvases и текст токенами кита, а слушатель канала в `preview.ts` ставит `data-theme`/`dir` на страницах без story. Английский текст остаётся LTR при RTL в toolbar; в RTL переходят только canvases. Раньше в тёмной теме canvases оставались белыми со светлым текстом, и у autodocs-страниц была та же проблема.
- Собственная кнопка Storybook «Copy code» под блоком кода остаётся низкоконтрастной в тёмной теме.

**Варианты:**

1. Оставить всё (рекомендую).
2. Откатить часть: назовите что.
