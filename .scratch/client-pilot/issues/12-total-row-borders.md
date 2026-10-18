# 12: the border color of the action weights total line

**Spec:** [../spec.md](../spec.md) → decision 1, ticket 05

**Status:** needs-info

**Facts:** the total line under the action weights ("total = 100%") is green when the weights add
up to 100 and red otherwise. Ticket 05 moved its colors to kit tokens:

| | old (client `master`) | now |
| --- | --- | --- |
| valid text / background / border | `#2e7d32` / `#f1f8f2` / `#b7dfb9` | `--ui-color-success-text` / `-subtle` / `--ui-color-success` (`#008752`) |
| invalid text / background / border | `#d64545` / `#fdf3f3` / `#f0c2c2` | `--ui-color-danger-text` / `-subtle` / `--ui-color-danger` (`#dc2626`) |

So the border is now the full success or danger color, where it used to be a pale tint. The kit
has no semantic "pale border" token; its palette has `--ui-ref-color-green-200` (`#95d6b4`) and
`--ui-ref-color-red-200` (`#fecaca`), which are close to the old values. `ui-alert` uses the same
full-color border (`--ui-alert-success-border` / `--ui-alert-danger-border`) for its success and danger variants. Any change is in the client's SCSS inside
`apartment-changes-new/`.

**Options:**

1. Keep the full colors (recommended): the line reads like the kit's `ui-alert` and every value
   is a semantic token, so a theme change reaches it.
2. Pale borders through the reference tokens `--ui-ref-color-green-200` / `--ui-ref-color-red-200`:
   the old look, but the Theming page says primitive `--ui-ref-*`
   tokens are never used in components or apps.
3. A neutral `--ui-color-border` border, with only the text and background colored.

## Русский перевод

# 12: цвет рамки строки итога весов действий

**Спека:** [../spec.md](../spec.md) → решение 1, тикет 05

**Статус:** needs-info

**Факты:** строка итога под весами («итог = 100%») зелёная, когда сумма равна 100, и красная в
остальных случаях. Тикет 05 перевёл её цвета на токены кита:

| | раньше (`master` клиента) | сейчас |
| --- | --- | --- |
| верно: текст / фон / рамка | `#2e7d32` / `#f1f8f2` / `#b7dfb9` | `--ui-color-success-text` / `-subtle` / `--ui-color-success` (`#008752`) |
| неверно: текст / фон / рамка | `#d64545` / `#fdf3f3` / `#f0c2c2` | `--ui-color-danger-text` / `-subtle` / `--ui-color-danger` (`#dc2626`) |

То есть рамка теперь полного цвета success или danger, а раньше была бледной. Семантического токена
«бледная рамка» в ките нет; в палитре есть `--ui-ref-color-green-200` (`#95d6b4`) и
`--ui-ref-color-red-200` (`#fecaca`), близкие к старым значениям. `ui-alert` в вариантах success и
danger рисует такую же рамку полного цвета. Любая правка — в SCSS клиента внутри
`apartment-changes-new/`.

**Варианты:**

1. Оставить полные цвета (рекомендую): строка выглядит как `ui-alert` кита, и все значения —
   семантические токены, так что смена темы до неё доходит.
2. Бледные рамки через ref-токены `--ui-ref-color-green-200` / `--ui-ref-color-red-200`: старый
   вид, но страница Theming запрещает примитивные токены `--ui-ref-*` в компонентах и приложениях.
3. Нейтральная рамка `--ui-color-border`, цветные только текст и фон.
