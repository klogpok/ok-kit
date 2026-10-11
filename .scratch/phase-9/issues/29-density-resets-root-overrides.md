# 29: Component token overrides on `:root` reset inside a density region

**Spec:** [../spec.md](../spec.md) → 9.2, "Density"

**Status:** done

**Facts:** component tokens that alias control heights (option, menu item, tree node and so on) must be re-declared inside `[data-density='compact']`, or they would keep the default heights computed on `:root`. Ticket 09 therefore added `[data-density]` to the selectors that re-declare component tokens and to `ui.$theme-scopes`. Side effect: if an app overrides a component token only on `:root`, the override is reset inside any `data-density` region. The same already happens inside `[data-theme]` and `.ui-theme-scope`, and the README says to override through `ui.$theme-scopes`. The CHANGELOG lists it under Added, not Breaking. The VPlans app overrides no component tokens today.

**Options:**

1. Accept: same rule as theme scopes, documented (recommended).
2. Also list it as a breaking change in the CHANGELOG.
3. Re-declare only the tokens density changes inside `[data-density]`, so other overrides survive (the generator has to track which component tokens alias control tokens).

## Answer

Accept as is: the same rule as theme scopes. Recorded in docs/DECISIONS.md (2026-10-10).

## Русский перевод

# 29: Переопределения component-токенов на `:root` сбрасываются внутри области density

**Спека:** [../spec.md](../spec.md) → 9.2, «Density»

**Статус:** сделано

**Факты:** component-токены, которые ссылаются на высоты контролов (option, пункт меню, узел tree и другие), нужно заново объявить внутри `[data-density='compact']`, иначе они сохранят высоты по умолчанию, вычисленные на `:root`. Поэтому тикет 09 добавил `[data-density]` в селекторы, которые заново объявляют component-токены, и в `ui.$theme-scopes`. Побочный эффект: если приложение переопределяет component-токен только на `:root`, внутри любой области с `data-density` это переопределение сбрасывается. То же уже происходит внутри `[data-theme]` и `.ui-theme-scope`, и README велит переопределять через `ui.$theme-scopes`. CHANGELOG записывает это в Added, а не в Breaking. Приложение VPlans сейчас не переопределяет component-токены.

**Варианты:**

1. Принять: то же правило, что и для областей темы, оно задокументировано (рекомендую).
2. Дополнительно записать это в CHANGELOG как ломающее изменение.
3. Внутри `[data-density]` заново объявлять только те токены, которые меняет density, чтобы остальные переопределения сохранялись (генератору придётся отслеживать, какие component-токены ссылаются на токены контролов).

## Ответ

Принять как есть: то же правило, что и для областей темы. Записано в docs/DECISIONS.md (2026-10-10).
