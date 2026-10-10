# 26: Spinner stroke width override changes meaning

**Spec:** [../spec.md](../spec.md) → 9.1, "Multipliers to tokens"

**Status:** needs-info

**Facts:** `--ui-spinner-stroke-width` already existed, and the spinner style multiplied it by `1.25`. Ticket 04 moved the factor into the token's default (`calc(border-width.strong * 1.25)`), and the style now uses the token as is. The spinner looks the same, but an app that overrides the token now gets exactly the width it sets, not 1.25 times that. The CHANGELOG lists it under Breaking, with "multiply an existing override by 1.25 to keep the old look".

**Options:**

1. Keep it: the token means the real stroke width (recommended; the VPlans app does not override it today).
2. Restore the old meaning: keep `* 1.25` in the style and add a separate `--ui-spinner-stroke-scale` token instead.

## Русский перевод

# 26: Переопределение толщины линии спиннера меняет смысл

**Спека:** [../spec.md](../spec.md) → 9.1, «Множители в токены»

**Статус:** needs-info

**Факты:** `--ui-spinner-stroke-width` уже существовал, и стиль спиннера умножал его на `1.25`. Тикет 04 перенёс множитель в значение токена по умолчанию (`calc(border-width.strong * 1.25)`), а стиль теперь берёт токен как есть. Спиннер выглядит так же, но приложение, которое переопределяет токен, теперь получает ровно заданную толщину, а не в 1.25 раза больше. В CHANGELOG это записано в Breaking с подсказкой «умножьте своё переопределение на 1.25, чтобы сохранить прежний вид».

**Варианты:**

1. Оставить: токен означает настоящую толщину линии (рекомендую; приложение VPlans сейчас его не переопределяет).
2. Вернуть прежний смысл: оставить `* 1.25` в стиле и добавить отдельный токен `--ui-spinner-stroke-scale`.
