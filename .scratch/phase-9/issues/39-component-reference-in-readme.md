# 39: Component reference stays in the README

**Spec:** [../spec.md](../spec.md) → 9.5, user story 58

**Status:** done

**Facts:** the spec moves "the guide sections" out of the README into the six docs pages. Ticket 21-23 moved Installation, Usage, Theming, Breakpoints, Layout, Density, RTL, i18n, the general part of Forms and the overlay direction notes. The component reference stayed in the README because no docs page is planned for it: Actions (button inputs), the per-control part of Forms (datepicker, number input, chip input, file upload, slider, segmented, range picker, time input, prefix and suffix), Overlays, Feedback, Data display (tables, tree) and Navigation, about 1000 lines. Each component already has an autodocs page in Storybook, which shows inputs but not this prose.

**Options:**

1. Keep it in the README: it is API reference next to the exports table, and the docs pages link to it (recommended; no text is written twice).
2. Move each component's section into its autodocs page (`parameters.docs.description.component` or an attached MDX per component); the README keeps only the exports table and the rules.
3. Add a seventh docs page, "Components", with the reference.

## Answer

Keep it in the README (option 1). Recorded in docs/DECISIONS.md (2026-10-11).

## Русский перевод

# 39: Справка по компонентам остаётся в README

**Спека:** [../spec.md](../spec.md) → 9.5, пользовательская история 58

**Статус:** сделано

**Факты:** спека переносит «разделы руководства» из README в шесть docs-страниц. Тикеты 21-23 перенесли Installation, Usage, Theming, Breakpoints, Layout, Density, RTL, i18n, общую часть Forms и заметки о направлении оверлеев. Справка по компонентам осталась в README, потому что docs-страницы для неё не запланировано: Actions (inputs кнопки), справка по отдельным контролам в Forms (datepicker, number input, chip input, file upload, slider, segmented, range picker, time input, prefix и suffix), Overlays, Feedback, Data display (таблицы, дерево) и Navigation — около 1000 строк. У каждого компонента уже есть autodocs-страница в Storybook, которая показывает inputs, но не этот текст.

**Варианты:**

1. Оставить в README: это справка по API рядом с таблицей exports, docs-страницы на неё ссылаются (рекомендую; ни один текст не написан дважды).
2. Перенести раздел каждого компонента в его autodocs-страницу (`parameters.docs.description.component` или прикреплённый MDX на компонент); README оставляет только таблицу exports и правила.
3. Добавить седьмую docs-страницу «Components» со справкой.

## Ответ

Оставить в README (вариант 1). Записано в docs/DECISIONS.md (2026-10-11).
