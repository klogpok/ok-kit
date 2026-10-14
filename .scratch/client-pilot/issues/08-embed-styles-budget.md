# 08: the embed stylesheet breaks the playground's component style budget

**Spec:** [../spec.md](../spec.md) → decision 5, ticket 01

**Status:** needs-info

**Facts:** `UiEmbedStyles` lives in `@vplans/ui-kit/theme`, as decision 5 and ticket 01 say. Its
stylesheet is the tokens plus the layout classes: about 41 kB compiled, and it cannot get much
smaller (the tokens alone are about 40 kB). The playground imports `@vplans/ui-kit/theme` for
`ThemeService` and `provideUiTheme`, so Angular compiles `UiEmbedStyles` there too, even though the
playground never renders it, and checks its stylesheet against the `anyComponentStyle` budget:
`pnpm build:playground` fails with "ui-kit-embed.scss exceeded maximum budget. Budget 8.00 kB was
not met by 33.11 kB". The budgets are the user's (`docs/DECISIONS.md`, phase 2 review: warning
7 kB, error 8 kB). Every other step of `/phase-check` passes. The client has only a 7 kB
`anyComponentStyle` warning, no error, so its build will warn once for `ui-embed-styles` and pass.

**Options:**

1. Move `UiEmbedStyles` to its own entry point, `@vplans/ui-kit/embed` (recommended). Only an app
   that embeds the kit imports it, so the playground and the monorepo apps never compile the 41 kB
   stylesheet, and the 8 kB budget keeps guarding every real component style. It changes decision
   5 and ticket 01 ("in `@vplans/ui-kit/theme`") and the import in the docs; ticket 03 copies the
   new entry point like any other.
2. Keep it in `theme` and raise the playground's `anyComponentStyle` error to 48 kB (warning stays
   7 kB). One line in `angular.json`, but the error then no longer catches a component style
   between 8 and 48 kB.
3. Keep it in `theme` and load the CSS without `styleUrl` (a generated TypeScript string inserted
   at run time). No budget applies, but it is not the `styleUrl` that ticket 01 asks for, needs a
   `<style>` element of its own (CSP) and duplicates what Angular already does.

## Русский перевод

# 08: встраиваемые стили ломают бюджет стилей компонента в playground

**Спека:** [../spec.md](../spec.md) → решение 5, тикет 01

**Статус:** needs-info

**Факты:** `UiEmbedStyles` лежит в `@vplans/ui-kit/theme`, как сказано в решении 5 и тикете 01.
Его стили — токены и layout-классы: около 41 kB после компиляции, и сильно меньше они не станут
(одни токены — около 40 kB). Playground импортирует `@vplans/ui-kit/theme` ради `ThemeService` и
`provideUiTheme`, поэтому Angular компилирует там и `UiEmbedStyles`, хотя playground его не
рисует, и сверяет его стили с бюджетом `anyComponentStyle`: `pnpm build:playground` падает с
«ui-kit-embed.scss exceeded maximum budget. Budget 8.00 kB was not met by 33.11 kB». Бюджеты
выбрал пользователь (`docs/DECISIONS.md`, ревью фазы 2: предупреждение 7 kB, ошибка 8 kB).
Остальные шаги `/phase-check` проходят. У клиента для `anyComponentStyle` есть только
предупреждение 7 kB, без ошибки, так что его сборка один раз предупредит про `ui-embed-styles` и
пройдёт.

**Варианты:**

1. Перенести `UiEmbedStyles` в отдельный entry point `@vplans/ui-kit/embed` (рекомендую). Его
   импортирует только приложение, которое встраивает кит, так что playground и приложения монорепо
   никогда не компилируют стили на 41 kB, а бюджет 8 kB продолжает сторожить настоящие стили
   компонентов. Меняет решение 5 и тикет 01 («в `@vplans/ui-kit/theme`») и импорт в документации;
   тикет 03 копирует новый entry point как любой другой.
2. Оставить в `theme` и поднять ошибку `anyComponentStyle` в playground до 48 kB (предупреждение
   остаётся 7 kB). Одна строка в `angular.json`, но ошибка перестаёт ловить стили компонента от 8
   до 48 kB.
3. Оставить в `theme` и загружать CSS без `styleUrl` (сгенерированная строка TypeScript,
   вставляемая в рантайме). Бюджет не применяется, но это не тот `styleUrl`, который просит тикет
   01, нужен свой элемент `<style>` (CSP), и это повторяет то, что Angular уже делает сам.
