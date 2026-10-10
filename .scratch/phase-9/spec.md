# Spec: infrastructure for teams (phase 9)

Status: ready-for-agent

## Problem Statement

The kit has its components, but the teams that build the VPlans app still lack the infrastructure around them.

- They cannot set kit-wide defaults for tooltips and pagination; every usage repeats the same inputs.
- Dialogs, drawers, toasts and popovers are sized against `100vw`, which includes the scrollbar, so on desktop they slide under it — on the left in the Hebrew (RTL) app.
- There is no shared vocabulary for breakpoints: each team picks its own widths, and the kit itself hardcodes one.
- There is no compact density. Dense screens such as filter panels and data tables cannot shrink controls without overriding component tokens one by one.
- There are no layout primitives, so each screen writes its own flex and grid rules for stacks, rows and card grids.
- Only some components have test harnesses, so tests for screens built with the rest have to query the kit's DOM, and break when that DOM changes.
- The only guide is the README. There is no browsable documentation for getting started, theming, RTL, forms or tokens next to the live components.
- Some leftovers from the phase 5 audit remain: magic multipliers in component styles, internal members of `UiOption` exposed as public API, and overlay positioning code copied between components.

## Solution

Phase 9 is delivered as five sub-phases, each with its own report and approval, in this order:

1. **9.1 — P3 leftovers.** Defaults providers for tooltip and pagination; overlays sized against the overlay container instead of `100vw`; size and duration multipliers moved into component tokens; `UiOption` internals hidden; shared overlay position presets and direction sync in core.
2. **9.2 — Breakpoints and density.** Four named breakpoints generated from the token source into SCSS and TypeScript; a compact density that any page region can opt into with `data-density="compact"`.
3. **9.3 — Layout utilities.** `.ui-stack`, `.ui-cluster`, `.ui-grid` and `.ui-container` classes with matching SCSS mixins and shared gap modifiers; the playground uses them.
4. **9.4 — Harnesses.** A harness for every remaining component that has state or behavior.
5. **9.5 — Documentation.** Storybook MDX pages: Getting started, Theming, RTL, Forms, Tokens and Contributing.

Terms follow [GLOSSARY.md](../../GLOSSARY.md) → Layout: **density** is a property of a page region, **size** is a property of one control, a **breakpoint** is a named viewport width.

## User Stories

### 9.1 — P3 leftovers

1. As an app developer, I want to set the default tooltip position, show delay and hide delay once for the app, so that I do not repeat them on every tooltip.
2. As an app developer, I want an input on a single tooltip to override the app-wide default, so that one tooltip can still differ.
3. As an app developer, I want to set the default page size, page size options, sibling count and first/last buttons for every paginator, so that all tables in the app page the same way.
4. As an app developer, I want an input on a single paginator to override the app-wide default, so that one table can still page differently.
5. As an app developer, I want the defaults providers to look and behave like the existing dialog and toast providers, so that I learn one pattern.
6. As an app user on desktop, I want a dialog never to slide under the vertical scrollbar, so that its edge and close button are visible.
7. As an app user in the Hebrew app, I want a drawer opened at the end (the left) to sit against the scrollbar, not under it, so that its content is not cut off.
8. As an app user, I want toasts and popovers to fit within the visible viewport width, so that their text is not hidden under the scrollbar.
9. As a theme author, I want the switch sm/lg track sizes, the avatar initials size, the spinner stroke width, the dialog enter scale and the animation durations of spinner, skeleton, progress and table to be component tokens, so that I can tune them without overriding component styles.
10. As a theme author, I want moving those values into tokens not to change how anything looks today, so that the change is safe.
11. As an app developer, I want the public API of `UiOption` to be only its inputs (`value`, `disabled`, `label`), so that I do not build on members the kit may change.
12. As a kit maintainer, I want the members that the option panel needs from an option to be marked internal with the `ɵ` prefix, so that their status is obvious.
13. As a kit maintainer, I want the overlay position presets and the direction sync in one place in core, so that a fix to overlay positioning is made once.
14. As an app user, I want select, autocomplete, datepicker, date-range-picker, time input, tooltip and popover to open exactly where they open today, so that the refactor changes nothing I see.

### 9.2 — Breakpoints and density

15. As an app developer, I want named breakpoints sm (40rem), md (52rem), lg (64rem) and xl (80rem), so that all teams switch layouts at the same widths.
16. As an app developer, I want SCSS mixins that wrap styles in a media query from a breakpoint up or below a breakpoint, so that I do not write media queries by hand.
17. As an app developer, I want the breakpoints as a SCSS map, so that I can loop over them.
18. As an app developer, I want the breakpoints as TypeScript constants ready for the CDK breakpoint observer, so that component logic and styles switch at the same width.
19. As a kit maintainer, I want the breakpoints to come from the token source and be generated like the other tokens, so that there is one source of truth.
20. As a kit maintainer, I want the date-range-picker to decide between one and two months with the shared md breakpoint, so that the kit uses its own vocabulary.
21. As an app developer, I want to mark a region of a page `data-density="compact"`, so that its controls become denser without per-component overrides.
22. As an app developer, I want to put `data-density="compact"` on the root element, so that the whole app is compact.
23. As an app user in a compact region, I want controls to be shorter (sm 1.75rem, md 2rem, lg 2.5rem) with smaller inline padding and gaps, so that more fits on the screen.
24. As an app user in a compact region, I want font sizes to stay the same, so that Hebrew text stays readable.
25. As an app user in a compact region, I want select options, menu items and tree nodes to shrink along with the controls, so that lists match the controls that open them.
26. As an app user in a compact region, I want table cells to use the compact padding, so that dense data screens show more rows.
27. As an app developer, I want a table with no `density` input to follow the density of its region, so that I set density in one place.
28. As an app developer, I want an explicit `density` on a table to override the region, so that one table can differ from its surroundings.
29. As an app developer, I want page spacing outside controls to stay the same in a compact region, so that density does not reflow my layout.
30. As an app developer, I want overlays to follow the density set on the root element, so that an app-wide compact density also applies to dropdowns and dialogs.
31. As a reviewer, I want a Density switch in the Storybook toolbar, next to theme and direction, so that I can look at any component in compact density.
32. As a reviewer, I want a "Foundations/Density" story that shows the controls and a table in both densities, so that density is covered by visual baselines and axe.

### 9.3 — Layout utilities

33. As an app developer, I want a `.ui-stack` class that lays children out vertically with a gap, so that I do not write a flex column for every form.
34. As an app developer, I want a `.ui-cluster` class that lays children out in a wrapping row with a gap, so that toolbars and button rows need no custom CSS.
35. As an app developer, I want a `.ui-grid` class that fits as many columns as there is room for, each at least a minimum width (20rem by default, changeable through a custom property), so that card grids reflow without media queries.
36. As an app developer, I want a `.ui-container` class that centers content up to 80rem wide with inline padding, so that pages share one content width.
37. As an app developer, I want the gap to default to md and to change it with a shared `.ui-gap-*` modifier (3xs to 3xl from the spacing scale), so that one set of modifiers works with every layout class.
38. As an app developer, I want SCSS mixins with the same names that take the gap as an argument, so that I can apply the same layouts inside my component styles.
39. As an app user in the Hebrew app, I want layouts to use logical properties, so that they mirror correctly in RTL.
40. As a kit maintainer, I want the playground to use these classes instead of its own `.row`, `.stack` and `.grid`, so that the utilities are proven on a real consumer.
41. As a reviewer, I want a "Foundations/Layout" story with each utility and gap modifier, so that the utilities are covered by visual baselines.

### 9.4 — Harnesses

42. As an app developer, I want harnesses for accordion, alert, avatar, badge, breadcrumbs, datepicker, empty-state, form-field, menu, pagination, popover, progress, radio, switch, table, tabs, toast and tooltip, so that I can test any screen built with the kit without querying its DOM.
43. As an app developer, I want each harness to read what the user sees and perform what the user does, at the same depth as the existing harnesses, so that the API is consistent.
44. As an app developer, I want to find harnesses by their visible label or text where the component has one, so that tests read like the UI.
45. As an app developer, I want harnesses for overlays (menu, popover, tooltip, toast) to find their content wherever the overlay renders it, so that I do not have to know about the overlay container.
46. As an app developer, I want a table harness that reads rows and cells by column, sorts by a column, selects rows and expands row details, so that data screens are testable.
47. As an app developer, I want a pagination harness that reads the current page and page size and moves between pages, so that paging logic is testable.
48. As an app developer, I want a datepicker harness that reads and types the value and opens the calendar, consistent with the existing date-range-picker harness, so that both date controls test the same way.
49. As an app developer, I want a form-field harness that reads the label, hint and error and returns the control harness inside, so that validation messages are testable.
50. As a kit maintainer, I want the README rule to say that a harness is required for a component with state or behavior, so that purely visual components (divider, skeleton, spinner, icon, card) are not required to have one.

### 9.5 — Documentation

51. As a new app developer, I want a Getting started page in Storybook, so that I can add the kit to a screen without reading the source.
52. As an app developer, I want a Theming page that explains tokens, light/dark and theme scopes, so that I can theme a region correctly.
53. As an app developer, I want an RTL page that explains direction, logical properties and the mirrored behavior of overlays, so that my screens work in Hebrew.
54. As an app developer, I want a Forms page that explains Reactive and template forms, `ControlValueAccessor`, form-field and validation, so that I wire controls the supported way.
55. As an app developer, I want a Tokens page with the live token galleries, density and breakpoints, so that I can pick tokens while I read.
56. As a contributor, I want a Contributing page that points to the README rules, so that there is one set of rules.
57. As a reader, I want the examples on these pages to be the live stories, so that they cannot drift from the components.
58. As a kit maintainer, I want the README to keep the exports table and the contribution rules and to link to the MDX pages for the guide, so that nothing is written twice.

## Implementation Decisions

### 9.1 — P3 leftovers

- **Defaults providers.** `provideUiTooltip(defaults)` in the tooltip entry point (position, show delay, hide delay) and `provideUiPagination(defaults)` in the pagination entry point (page size, page size options, sibling count, show first/last). Each is an injection token with partial defaults, merged over the current built-in defaults, following `provideUiDialog`. An input bound on the component wins over the provider. There is no table provider: table density follows the region density instead (see 9.2).
- **Overlay width.** Every `min(…, 100vw …)` in the dialog, drawer, toast and popover styles is measured against the overlay container (`100%`), which spans the visible viewport without the scrollbar. Dialog height keeps `100dvh`.
- **Multipliers to tokens.** New component tokens for: the switch sm and lg track scale, the avatar initials size ratio, the spinner stroke width, the dialog enter scale, and the animation durations of spinner, skeleton, progress bar and table. Each defaults to today's value through a reference, so visual baselines do not change. Geometry stays in SCSS: `* 2`, `* -1`, the calendar's seven columns, and the `0.875em` in typography.
- **`UiOption` internals.** Computed states read only by the option's own template (`active`, `selected`, `indeterminate`, `filteredOut`, `unavailable`) become `protected`. Members the option panel reads (`id`, `getLabel`, `disabled` getter) get the `ɵ` prefix. `setActiveStyles` and `setInactiveStyles` stay public because CDK `Highlightable` requires them. Harnesses and specs that read these members change with them. The CHANGELOG records the rename.
- **Overlay helpers in core.** A core overlay module holds the shared position presets: the dropdown pair (start-bottom, start-top), the dropdown with an end-bottom fallback, and the four sides with their opposites used by tooltip and popover. It also holds one function that syncs an overlay's direction from its host through `resolveDirection`. Select, time input, datepicker, date-range-picker, tooltip and popover use them. Escape handling and the `cdkConnectedOverlay` template bindings are not touched. Menu keeps its own map over the CDK dropdown positions.

### 9.2 — Breakpoints and density

- **Breakpoints** live in the token source as sm 40rem, md 52rem, lg 64rem, xl 80rem. The token generator emits:
  - a SCSS map `$breakpoints`;
  - the mixins `up($name)` (min-width) and `down($name)` (below that width, without overlap with `up`), forwarded through the kit's SCSS API next to the existing mixins;
  - a TypeScript constant exported from core with a media query per breakpoint, for the CDK `BreakpointObserver`.
  No CSS custom properties are emitted, because they cannot be used in media queries.
- The date-range-picker's two-month query uses the md constant instead of its own literal.
- **Density** is a region attribute `data-density="compact"`, valid on any element. In it:
  - semantic control tokens change: height sm/md/lg → 1.75/2/2.5rem; control inline padding and gap one step smaller;
  - the table cell block padding token takes its compact value.
  Component tokens that alias control heights (option, menu item, tree node, calendar cell, tabs, pagination and so on) follow automatically. Font sizes and the page spacing scale do not change. Exact values are confirmed against the visual baselines.
- Density is resolved by CSS cascade: overlays render outside the region, so only density on the root element reaches them.
- The table's `density` input becomes `'default' | 'compact' | undefined`, with `undefined` as the default. `undefined` adds no density class and follows the region; an explicit value overrides the region in both directions.
- Storybook gets a Density global in the toolbar that sets the attribute on the preview root. A "Foundations/Density" story renders a set of controls and a table in default and compact side by side; it is the only story added to the baselines for density.

### 9.3 — Layout utilities

- Global classes in the kit stylesheet: `.ui-stack` (vertical), `.ui-cluster` (wrapping row, centered items), `.ui-grid` (`repeat(auto-fit, minmax(min(var(--ui-grid-min, 20rem), 100%), 1fr))`), `.ui-container` (max inline size 80rem, centered, inline padding lg).
- Gap: the layout classes read one custom property for the gap, defaulting to the md spacing token; `.ui-gap-3xs` … `.ui-gap-3xl` set it from the spacing scale.
- Mixins `stack($gap)`, `cluster($gap)`, `grid($min, $gap)`, `container()` in the kit's SCSS API produce the same rules.
- Only logical properties.
- The playground drops its local `.row`, `.toolbar`, `.stack` and `.grid` and uses the kit classes. One-off grids such as `3fr 2fr` stay local.

### 9.4 — Harnesses

- 18 new harnesses in the testing entry point, built on the existing `UiHarness` base, one commit each with its own spec: accordion, alert, avatar, badge, breadcrumbs, datepicker, empty-state, form-field, menu, pagination, popover, progress, radio, switch, table, tabs, toast, tooltip.
- Depth matches the existing harnesses: readable state and the user's main actions; label or text filters where the component has them.
- Harnesses for overlay content (menu panel, popover panel, tooltip, toast) are looked up from the document root.
- The table harness covers rows, cells by column, sorting, row selection and row expansion.
- Existing component specs are not migrated to harnesses.
- The README rule changes from "a new component has a harness" to "a component with state or behavior has a harness"; divider, skeleton, spinner, icon and card are exempt.

### 9.5 — Documentation

- Pages in English as Storybook MDX: Getting started, Theming, RTL, Forms, Tokens, Contributing.
- MDX holds the consumer guide. The README keeps the exports table and the contribution rules (the source the agent and contributors follow) and links to the MDX pages; the guide sections move out of the README. The Contributing page summarizes and links to the README rules, without copying them.
- Examples embed existing stories with `<Canvas of>`: the token galleries, Foundations/Density and Foundations/Layout, and component stories. Anything else is a code block.

## Testing Decisions

- A good test checks external behavior: what a user of the component sees or does, or what a consumer of an API gets. It does not check internal members, generated class names or private state.
- **Component specs in TestBed with a host template** are the main point of testing:
  - tooltip and pagination: a provider changes the default, an input overrides the provider. Prior art: the dialog spec with `provideUiDialog`;
  - select, autocomplete and multi-select keep passing after the `UiOption` change;
  - popover, tooltip, datepicker, date-range-picker and time input keep passing after the overlay helper change;
  - table: with no `density` input it follows the region; an explicit input wins;
  - date-range-picker: it switches between one and two months on the md breakpoint.
- **Visual baselines** (`pnpm test-visual`):
  - they must not change for 9.1 (tokens and overlay helpers);
  - 9.2 adds Foundations/Density and 9.3 adds Foundations/Layout;
  - the 100vw change is also checked in the browser, with a visible scrollbar, in LTR and RTL.
- **Story checks** (`pnpm test-storybook`, axe in three modes) cover the new stories. MDX pages are docs entries; the story scripts skip them, so the Storybook build is their check.
- **Harness specs**, one per harness, follow the existing harness specs in the testing entry point. Coverage thresholds stay as they are.
- Each sub-phase ends with the `/phase-check` skill.

## Out of Scope

- Migrating existing component specs to harnesses.
- Harnesses for divider, skeleton, spinner, icon and card.
- A twelve-column grid or responsive span classes.
- Density that changes font sizes or the page spacing scale; a density for overlays that differs from the root element's.
- A defaults provider for table density.
- Breakpoints as CSS custom properties.
- A shared overlay directive, or shared Escape handling.
- MDX pages in Hebrew or Russian; docs-only stories made just for the MDX pages.
- A visual baseline mode for compact density.

## Further Notes

- Each sub-phase follows the per-phase workflow in CLAUDE.md: one commit per component or harness, report, wait for approval.
- Breaking changes to record in the CHANGELOG: the `UiOption` member renames and the new `undefined` default of the table's `density`.
- The current component style warning (7 kB) and bundle budgets stay; report any overrun.

## Русский перевод

# Спека: инфраструктура для команд (фаза 9)

Статус: ready-for-agent

## Постановка проблемы

Компоненты в ките есть, но командам, которые строят приложение VPlans, по-прежнему не хватает инфраструктуры вокруг них.

- Нельзя задать умолчания для всего кита для подсказок и пагинации; каждое использование повторяет одни и те же входы.
- Размер диалогов, drawer, toast и popover считается от `100vw`, а это включает полосу прокрутки, поэтому на десктопе они заезжают под неё — в ивритском (RTL) приложении слева.
- Нет общего словаря брейкпоинтов: каждая команда выбирает свои ширины, и сам кит зашивает одну.
- Нет компактной плотности. Плотные экраны вроде панелей фильтров и таблиц данных не могут уменьшить контролы, не перекрывая component-токены по одному.
- Нет layout-примитивов, поэтому каждый экран пишет свои flex- и grid-правила для стопок, строк и сеток карточек.
- Harnesses есть только у части компонентов, так что тесты экранов на остальных компонентах лезут в DOM кита и ломаются, когда этот DOM меняется.
- Единственное руководство — README. Нет документации, которую можно листать рядом с живыми компонентами: начало работы, темы, RTL, формы, токены.
- Остались хвосты аудита фазы 5: магические множители в стилях компонентов, внутренние члены `UiOption` в публичном API и код позиционирования оверлеев, скопированный между компонентами.

## Решение

Фаза 9 сдаётся пятью подфазами, у каждой свой отчёт и одобрение, в таком порядке:

1. **9.1 — хвосты P3.** Defaults-провайдеры для tooltip и pagination; размер оверлеев от контейнера оверлея вместо `100vw`; множители размеров и длительностей — в component-токены; внутренности `UiOption` скрыты; общие пресеты позиций оверлеев и синхронизация направления в core.
2. **9.2 — брейкпоинты и плотность.** Четыре именованных брейкпоинта генерируются из источника токенов в SCSS и TypeScript; компактная плотность, которую любой участок страницы включает через `data-density="compact"`.
3. **9.3 — layout-утилиты.** Классы `.ui-stack`, `.ui-cluster`, `.ui-grid` и `.ui-container` с одноимёнными SCSS-миксинами и общими модификаторами отступа; playground их использует.
4. **9.4 — harnesses.** Harness для каждого оставшегося компонента, у которого есть состояние или поведение.
5. **9.5 — документация.** MDX-страницы Storybook: Getting started, Theming, RTL, Forms, Tokens и Contributing.

Термины — по [GLOSSARY.md](../../GLOSSARY.md) → Layout: **density** (плотность) — свойство участка страницы, **size** (размер) — свойство одного контрола, **breakpoint** — именованная ширина viewport.

## Пользовательские истории

### 9.1 — хвосты P3

1. Как разработчик приложения, я хочу один раз задать для приложения позицию подсказки по умолчанию, задержку показа и скрытия, чтобы не повторять их на каждой подсказке.
2. Как разработчик приложения, я хочу, чтобы вход отдельной подсказки перекрывал умолчание приложения, чтобы одна подсказка всё же могла отличаться.
3. Как разработчик приложения, я хочу задать для всех пагинаторов размер страницы, варианты размера, число соседних страниц и кнопки первая/последняя по умолчанию, чтобы все таблицы приложения листались одинаково.
4. Как разработчик приложения, я хочу, чтобы вход отдельного пагинатора перекрывал умолчание приложения, чтобы одна таблица всё же могла листаться иначе.
5. Как разработчик приложения, я хочу, чтобы defaults-провайдеры выглядели и вели себя как существующие провайдеры диалога и toast, чтобы учить один паттерн.
6. Как пользователь приложения на десктопе, я хочу, чтобы диалог никогда не заезжал под вертикальную полосу прокрутки, чтобы его край и кнопка закрытия были видны.
7. Как пользователь ивритского приложения, я хочу, чтобы drawer, открытый с конца (слева), прилегал к полосе прокрутки, а не уходил под неё, чтобы его содержимое не обрезалось.
8. Как пользователь приложения, я хочу, чтобы toast и popover помещались в видимую ширину viewport, чтобы их текст не прятался под полосой прокрутки.
9. Как автор темы, я хочу, чтобы размеры дорожки switch sm/lg, размер инициалов avatar, толщина обводки spinner, масштаб появления диалога и длительности анимаций spinner, skeleton, progress и table были component-токенами, чтобы настраивать их, не перекрывая стили компонентов.
10. Как автор темы, я хочу, чтобы перенос этих значений в токены не менял того, как всё выглядит сейчас, чтобы изменение было безопасным.
11. Как разработчик приложения, я хочу, чтобы публичным API `UiOption` были только его входы (`value`, `disabled`, `label`), чтобы не опираться на члены, которые кит может изменить.
12. Как мейнтейнер кита, я хочу, чтобы члены опции, нужные панели опций, были помечены как внутренние префиксом `ɵ`, чтобы их статус был очевиден.
13. Как мейнтейнер кита, я хочу держать пресеты позиций оверлеев и синхронизацию направления в одном месте в core, чтобы исправление позиционирования делалось один раз.
14. Как пользователь приложения, я хочу, чтобы select, autocomplete, datepicker, date-range-picker, time input, tooltip и popover открывались ровно там же, где сейчас, чтобы рефакторинг ничего не менял в том, что я вижу.

### 9.2 — брейкпоинты и плотность

15. Как разработчик приложения, я хочу именованные брейкпоинты sm (40rem), md (52rem), lg (64rem) и xl (80rem), чтобы все команды переключали раскладку на одних и тех же ширинах.
16. Как разработчик приложения, я хочу SCSS-миксины, которые оборачивают стили в media-запрос от брейкпоинта и выше или ниже брейкпоинта, чтобы не писать media-запросы руками.
17. Как разработчик приложения, я хочу брейкпоинты в виде SCSS-map, чтобы проходить по ним циклом.
18. Как разработчик приложения, я хочу брейкпоинты в виде TypeScript-констант, готовых для CDK breakpoint observer, чтобы логика компонентов и стили переключались на одной ширине.
19. Как мейнтейнер кита, я хочу, чтобы брейкпоинты брались из источника токенов и генерировались как остальные токены, чтобы был один источник правды.
20. Как мейнтейнер кита, я хочу, чтобы date-range-picker выбирал между одним и двумя месяцами по общему брейкпоинту md, чтобы кит пользовался своим же словарём.
21. Как разработчик приложения, я хочу пометить участок страницы `data-density="compact"`, чтобы его контролы стали плотнее без переопределений по компонентам.
22. Как разработчик приложения, я хочу поставить `data-density="compact"` на корневой элемент, чтобы всё приложение стало компактным.
23. Как пользователь приложения в компактном участке, я хочу, чтобы контролы были ниже (sm 1.75rem, md 2rem, lg 2.5rem), с меньшими внутренними отступами и промежутками, чтобы на экран помещалось больше.
24. Как пользователь приложения в компактном участке, я хочу, чтобы размеры шрифтов не менялись, чтобы ивритский текст оставался читаемым.
25. Как пользователь приложения в компактном участке, я хочу, чтобы опции select, пункты меню и узлы дерева уменьшались вместе с контролами, чтобы списки соответствовали контролам, которые их открывают.
26. Как пользователь приложения в компактном участке, я хочу, чтобы ячейки таблицы использовали компактный отступ, чтобы плотные экраны данных показывали больше строк.
27. Как разработчик приложения, я хочу, чтобы таблица без входа `density` следовала плотности своего участка, чтобы задавать плотность в одном месте.
28. Как разработчик приложения, я хочу, чтобы явный `density` у таблицы перекрывал участок, чтобы одна таблица могла отличаться от окружения.
29. Как разработчик приложения, я хочу, чтобы отступы страницы вне контролов в компактном участке не менялись, чтобы плотность не перестраивала мою раскладку.
30. Как разработчик приложения, я хочу, чтобы оверлеи следовали плотности, заданной на корневом элементе, чтобы компактная плотность на всё приложение действовала и на выпадающие списки, и на диалоги.
31. Как ревьюер, я хочу переключатель Density в тулбаре Storybook рядом с темой и направлением, чтобы смотреть любой компонент в компактной плотности.
32. Как ревьюер, я хочу story «Foundations/Density» с контролами и таблицей в обеих плотностях, чтобы плотность была покрыта визуальными снимками и axe.

### 9.3 — layout-утилиты

33. Как разработчик приложения, я хочу класс `.ui-stack`, который раскладывает детей вертикально с промежутком, чтобы не писать flex-колонку для каждой формы.
34. Как разработчик приложения, я хочу класс `.ui-cluster`, который раскладывает детей в переносящуюся строку с промежутком, чтобы тулбарам и рядам кнопок не нужен был свой CSS.
35. Как разработчик приложения, я хочу класс `.ui-grid`, который вмещает столько колонок, сколько помещается, каждая не уже минимальной ширины (по умолчанию 20rem, меняется через custom property), чтобы сетки карточек перестраивались без media-запросов.
36. Как разработчик приложения, я хочу класс `.ui-container`, который центрирует содержимое шириной до 80rem с внутренними отступами по бокам, чтобы у страниц была одна ширина контента.
37. Как разработчик приложения, я хочу, чтобы промежуток по умолчанию был md и менялся общим модификатором `.ui-gap-*` (от 3xs до 3xl по шкале отступов), чтобы один набор модификаторов работал с любым layout-классом.
38. Как разработчик приложения, я хочу одноимённые SCSS-миксины, принимающие промежуток аргументом, чтобы применять те же раскладки в стилях своих компонентов.
39. Как пользователь ивритского приложения, я хочу, чтобы раскладки использовали логические свойства, чтобы они правильно зеркалились в RTL.
40. Как мейнтейнер кита, я хочу, чтобы playground использовал эти классы вместо своих `.row`, `.stack` и `.grid`, чтобы утилиты были проверены на реальном потребителе.
41. Как ревьюер, я хочу story «Foundations/Layout» с каждой утилитой и модификатором промежутка, чтобы утилиты были покрыты визуальными снимками.

### 9.4 — harnesses

42. Как разработчик приложения, я хочу harnesses для accordion, alert, avatar, badge, breadcrumbs, datepicker, empty-state, form-field, menu, pagination, popover, progress, radio, switch, table, tabs, toast и tooltip, чтобы тестировать любой экран на ките, не лазая в его DOM.
43. Как разработчик приложения, я хочу, чтобы каждый harness читал то, что видит пользователь, и делал то, что делает пользователь, на той же глубине, что существующие harnesses, чтобы API был единообразным.
44. Как разработчик приложения, я хочу находить harnesses по видимой подписи или тексту, где они есть у компонента, чтобы тесты читались как интерфейс.
45. Как разработчик приложения, я хочу, чтобы harnesses оверлеев (menu, popover, tooltip, toast) находили своё содержимое там, где его рендерит оверлей, чтобы мне не нужно было знать про контейнер оверлея.
46. Как разработчик приложения, я хочу harness таблицы, который читает строки и ячейки по колонке, сортирует по колонке, выбирает строки и раскрывает детали строк, чтобы экраны данных были тестируемыми.
47. Как разработчик приложения, я хочу harness пагинации, который читает текущую страницу и размер страницы и переходит между страницами, чтобы логика листания была тестируемой.
48. Как разработчик приложения, я хочу harness datepicker, который читает и вводит значение и открывает календарь, согласованный с существующим harness date-range-picker, чтобы оба контрола дат тестировались одинаково.
49. Как разработчик приложения, я хочу harness form-field, который читает подпись, подсказку и ошибку и возвращает harness контрола внутри, чтобы сообщения валидации были тестируемыми.
50. Как мейнтейнер кита, я хочу, чтобы правило в README говорило, что harness обязателен для компонента с состоянием или поведением, чтобы чисто визуальные компоненты (divider, skeleton, spinner, icon, card) были от него освобождены.

### 9.5 — документация

51. Как новый разработчик приложения, я хочу страницу Getting started в Storybook, чтобы добавить кит на экран, не читая исходники.
52. Как разработчик приложения, я хочу страницу Theming, которая объясняет токены, light/dark и области темы, чтобы правильно тематизировать участок.
53. Как разработчик приложения, я хочу страницу RTL, которая объясняет направление, логические свойства и зеркальное поведение оверлеев, чтобы мои экраны работали на иврите.
54. Как разработчик приложения, я хочу страницу Forms, которая объясняет реактивные и шаблонные формы, `ControlValueAccessor`, form-field и валидацию, чтобы подключать контролы поддерживаемым способом.
55. Как разработчик приложения, я хочу страницу Tokens с живыми галереями токенов, плотностью и брейкпоинтами, чтобы выбирать токены по ходу чтения.
56. Как контрибьютор, я хочу страницу Contributing, которая ссылается на правила в README, чтобы набор правил был один.
57. Как читатель, я хочу, чтобы примеры на этих страницах были живыми stories, чтобы они не расходились с компонентами.
58. Как мейнтейнер кита, я хочу, чтобы README сохранил таблицу exports и правила вклада и ссылался на MDX-страницы как на руководство, чтобы ничего не было написано дважды.

## Реализационные решения

### 9.1 — хвосты P3

- **Defaults-провайдеры.** `provideUiTooltip(defaults)` в entry point tooltip (позиция, задержка показа, задержка скрытия) и `provideUiPagination(defaults)` в entry point pagination (размер страницы, варианты размера, число соседних страниц, кнопки первая/последняя). Каждый — injection token с частичными умолчаниями поверх текущих встроенных, по образцу `provideUiDialog`. Привязанный вход компонента сильнее провайдера. Провайдера таблицы нет: плотность таблицы вместо этого следует плотности участка (см. 9.2).
- **Ширина оверлеев.** Каждое `min(…, 100vw …)` в стилях dialog, drawer, toast и popover считается от контейнера оверлея (`100%`), который занимает видимый viewport без полосы прокрутки. Высота диалога остаётся `100dvh`.
- **Множители в токены.** Новые component-токены: масштаб дорожки switch для sm и lg, доля размера инициалов avatar, толщина обводки spinner, масштаб появления диалога, длительности анимаций spinner, skeleton, progress bar и table. Каждый по умолчанию ссылается на сегодняшнее значение, так что визуальные снимки не меняются. Геометрия остаётся в SCSS: `* 2`, `* -1`, семь колонок календаря и `0.875em` в типографике.
- **Внутренности `UiOption`.** Вычисляемые состояния, которые читает только шаблон самой опции (`active`, `selected`, `indeterminate`, `filteredOut`, `unavailable`), становятся `protected`. Члены, которые читает панель опций (`id`, `getLabel`, геттер `disabled`), получают префикс `ɵ`. `setActiveStyles` и `setInactiveStyles` остаются публичными: их требует CDK `Highlightable`. Harnesses и спеки, читающие эти члены, меняются вместе с ними. CHANGELOG фиксирует переименование.
- **Хелперы оверлеев в core.** Модуль оверлеев в core хранит общие пресеты позиций: пару dropdown (start-bottom, start-top), dropdown с запасным end-bottom и четыре стороны с противоположными, которые используют tooltip и popover. Там же одна функция, которая синхронизирует направление оверлея с хостом через `resolveDirection`. Ими пользуются select, time input, datepicker, date-range-picker, tooltip и popover. Обработку Escape и привязки шаблона `cdkConnectedOverlay` не трогаем. Menu сохраняет свою карту поверх dropdown-позиций CDK.

### 9.2 — брейкпоинты и плотность

- **Брейкпоинты** лежат в источнике токенов: sm 40rem, md 52rem, lg 64rem, xl 80rem. Генератор токенов выдаёт:
  - SCSS-map `$breakpoints`;
  - миксины `up($name)` (min-width) и `down($name)` (ниже этой ширины, без пересечения с `up`), доступные через SCSS API кита рядом с существующими миксинами;
  - TypeScript-константу, экспортируемую из core, с media-запросом на каждый брейкпоинт для CDK `BreakpointObserver`.
  CSS custom properties не генерируются: их нельзя использовать в media-запросах.
- Запрос двух месяцев в date-range-picker использует константу md вместо своего литерала.
- **Плотность** — атрибут участка `data-density="compact"`, допустимый на любом элементе. Внутри него:
  - меняются семантические токены контролов: высота sm/md/lg → 1.75/2/2.5rem; внутренний отступ и промежуток контрола на шаг меньше;
  - токен вертикального отступа ячейки таблицы берёт компактное значение.
  Component-токены, ссылающиеся на высоты контролов (option, пункт меню, узел дерева, ячейка календаря, tabs, pagination и т. д.), следуют автоматически. Размеры шрифтов и шкала отступов страницы не меняются. Точные значения подтверждаются по визуальным снимкам.
- Плотность разрешается каскадом CSS: оверлеи рендерятся вне участка, поэтому до них доходит только плотность на корневом элементе.
- Вход `density` у таблицы становится `'default' | 'compact' | undefined`, по умолчанию `undefined`. `undefined` не добавляет класс плотности и следует участку; явное значение перекрывает участок в обе стороны.
- В Storybook появляется глобальный параметр Density в тулбаре, который ставит атрибут на корень превью. Story «Foundations/Density» показывает набор контролов и таблицу в обычной и компактной плотности рядом; это единственная story, добавленная в снимки ради плотности.

### 9.3 — layout-утилиты

- Глобальные классы в стилях кита: `.ui-stack` (вертикально), `.ui-cluster` (переносящаяся строка, элементы по центру), `.ui-grid` (`repeat(auto-fit, minmax(min(var(--ui-grid-min, 20rem), 100%), 1fr))`), `.ui-container` (максимальная inline-ширина 80rem, по центру, inline-отступ lg).
- Промежуток: layout-классы читают одну custom property для промежутка, по умолчанию spacing-токен md; `.ui-gap-3xs` … `.ui-gap-3xl` задают её по шкале отступов.
- Миксины `stack($gap)`, `cluster($gap)`, `grid($min, $gap)`, `container()` в SCSS API кита выдают те же правила.
- Только логические свойства.
- Playground убирает свои локальные `.row`, `.toolbar`, `.stack` и `.grid` и использует классы кита. Разовые сетки вроде `3fr 2fr` остаются локальными.

### 9.4 — harnesses

- 18 новых harnesses в entry point testing на существующей базе `UiHarness`, по одному коммиту на каждый со своим спеком: accordion, alert, avatar, badge, breadcrumbs, datepicker, empty-state, form-field, menu, pagination, popover, progress, radio, switch, table, tabs, toast, tooltip.
- Глубина как у существующих harnesses: читаемое состояние и основные действия пользователя; фильтры по подписи или тексту, где они есть у компонента.
- Harnesses содержимого оверлеев (панель меню, панель popover, tooltip, toast) ищутся от корня документа.
- Harness таблицы покрывает строки, ячейки по колонке, сортировку, выбор строк и раскрытие строк.
- Существующие спеки компонентов на harnesses не переводятся.
- Правило README меняется с «у нового компонента есть harness» на «у компонента с состоянием или поведением есть harness»; divider, skeleton, spinner, icon и card освобождены.

### 9.5 — документация

- Страницы на английском в Storybook MDX: Getting started, Theming, RTL, Forms, Tokens, Contributing.
- MDX содержит руководство для потребителя. README сохраняет таблицу exports и правила вклада (источник, которому следуют агент и контрибьюторы) и ссылается на MDX-страницы; разделы руководства уходят из README. Страница Contributing кратко пересказывает правила README и ссылается на них, не копируя.
- Примеры встраивают существующие stories через `<Canvas of>`: галереи токенов, Foundations/Density и Foundations/Layout, stories компонентов. Всё остальное — блоки кода.

## Решения по тестированию

- Хороший тест проверяет внешнее поведение: что видит или делает пользователь компонента, или что получает потребитель API. Он не проверяет внутренние члены, сгенерированные имена классов или приватное состояние.
- **Спеки компонентов в TestBed с хост-шаблоном** — основная точка проверки:
  - tooltip и pagination: провайдер меняет умолчание, вход перекрывает провайдер. Образец: спек диалога с `provideUiDialog`;
  - select, autocomplete и multi-select продолжают проходить после изменения `UiOption`;
  - popover, tooltip, datepicker, date-range-picker и time input продолжают проходить после изменения хелпера оверлеев;
  - table: без входа `density` следует участку; явный вход сильнее;
  - date-range-picker: переключается между одним и двумя месяцами на брейкпоинте md.
- **Визуальные снимки** (`pnpm test-visual`):
  - для 9.1 (токены и хелперы оверлеев) они не должны меняться;
  - 9.2 добавляет Foundations/Density, 9.3 — Foundations/Layout;
  - замена 100vw дополнительно проверяется в браузере с видимой полосой прокрутки, в LTR и RTL.
- **Проверки stories** (`pnpm test-storybook`, axe в трёх режимах) покрывают новые stories. MDX-страницы — это docs-записи; скрипты stories их пропускают, так что их проверка — сборка Storybook.
- **Спеки harnesses**, по одному на harness, следуют существующим спекам harnesses в entry point testing. Пороги coverage не меняются.
- Каждая подфаза завершается скиллом `/phase-check`.

## Вне рамок

- Перевод существующих спеков компонентов на harnesses.
- Harnesses для divider, skeleton, spinner, icon и card.
- Двенадцатиколоночная сетка или адаптивные span-классы.
- Плотность, меняющая размеры шрифтов или шкалу отступов страницы; плотность оверлеев, отличная от плотности корневого элемента.
- Defaults-провайдер для плотности таблицы.
- Брейкпоинты как CSS custom properties.
- Общая директива оверлея или общая обработка Escape.
- MDX-страницы на иврите или русском; docs-only stories, сделанные только для MDX-страниц.
- Режим визуальных снимков для компактной плотности.

## Дополнительные замечания

- Каждая подфаза идёт по workflow фазы из CLAUDE.md: один коммит на компонент или harness, отчёт, ожидание одобрения.
- Ломающие изменения для CHANGELOG: переименование членов `UiOption` и новое умолчание `undefined` у входа `density` таблицы.
- Текущий порог предупреждения стиля компонента (7 kB) и бюджеты бандла остаются; о превышении сообщать в отчёте.
