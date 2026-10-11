# 40: Markdown tables and Prettier for the docs pages

**Spec:** [../spec.md](../spec.md) → 9.5

**Status:** needs-info

**Facts:** Storybook 10's docs addon compiles MDX without `remark-gfm`, so a Markdown table renders as plain text. The pages write their tables as JSX (`<table>`), and the generated density table in `docs/tokens.mdx` is JSX too; this is harder to read and edit than a Markdown table. The `format` / `format:check` globs and the pre-commit hook do not cover `.mdx`, so the pages are not formatted by tooling; `pnpm build-storybook` is their only check. Prettier 3 formats MDX without a new dependency.

**Options:**

1. Keep both as they are: JSX tables, MDX outside Prettier (recommended for now; no new dependency, the pages are few).
2. Add `remark-gfm` as a dev dependency and pass it through the docs addon's `mdxPluginOptions`, then rewrite the tables as Markdown.
3. Add `mdx` to the Prettier globs and the pre-commit hook (independent of option 2).

## Русский перевод

# 40: Markdown-таблицы и Prettier для docs-страниц

**Спека:** [../spec.md](../spec.md) → 9.5

**Статус:** needs-info

**Факты:** docs-аддон Storybook 10 компилирует MDX без `remark-gfm`, поэтому Markdown-таблица выводится простым текстом. Страницы пишут таблицы на JSX (`<table>`), сгенерированная таблица density в `docs/tokens.mdx` тоже JSX; такие таблицы читать и править труднее, чем Markdown. Globs `format` / `format:check` и pre-commit хук не охватывают `.mdx`, поэтому страницы не форматируются инструментами; их единственная проверка — `pnpm build-storybook`. Prettier 3 форматирует MDX без новой зависимости.

**Варианты:**

1. Оставить как есть: JSX-таблицы, MDX вне Prettier (рекомендую пока; без новой зависимости, страниц мало).
2. Добавить `remark-gfm` в dev-зависимости и передать через `mdxPluginOptions` docs-аддона, затем переписать таблицы на Markdown.
3. Добавить `mdx` в globs Prettier и в pre-commit хук (независимо от варианта 2).
