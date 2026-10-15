# 09: kit text inherits the host's color and letter-spacing

**Spec:** [../spec.md](../spec.md) → decision 5, ticket 01

**Status:** done

**Facts:** ticket 01 left open whether component roots and overlay panels also set `color` and
`letter-spacing` or keep inheriting them from the host. They keep inheriting (ticket 01 →
Comments). In the client that means `#212529` (Bootstrap's body color) instead of the kit's
`#2b3549`, and `letter-spacing: -0.01em`, for kit text that has no color of its own: plain option
and list text, projected text. Many components already set their color
(checkbox, radio, switch, tabs, table, tree, accordion, calendar…). `ui-icon` and `ui-spinner`
draw with `currentColor` and must keep following their parent. `pnpm test-host-css` applies the
host body's `color` and `letter-spacing` to both captures, so they do not count as changes;
`--strict` counts them.

**Options:**

1. Keep inheriting (recommended, done): kit text matches the host's text around it, which is what
   the first measurement called "barely visible, matches the rest of the app", and no component
   gets a new rule.
2. Every component root and overlay panel sets `color: var(--ui-color-text)` and
   `letter-spacing: normal`, except `ui-icon` and `ui-spinner`; `test-host-css` then runs strict.
   The kit looks the same in every host, but differs slightly from the client's own text.

## Comments

- 2026-10-15: Answered by the user: option 1, keep inheriting. Kit components keep inheriting `color` and `letter-spacing` from the host; nothing changes in the code. Recorded in `docs/DECISIONS.md` → "Client pilot: review answers".

## Русский перевод

# 09: текст кита наследует color и letter-spacing хоста

**Спека:** [../spec.md](../spec.md) → решение 5, тикет 01

**Статус:** сделано

**Факты:** тикет 01 оставил открытым, задают ли корни компонентов и панели оверлеев ещё `color` и
`letter-spacing` или продолжают наследовать их от хоста. Они продолжают наследовать (тикет 01 →
Комментарии). В клиенте это значит `#212529` (цвет body из Bootstrap) вместо `#2b3549` кита и
`letter-spacing: -0.01em` у текста кита без собственного цвета: простой текст опций и списков,
проецируемый текст. Многие компоненты уже задают свой цвет (checkbox, radio, switch, tabs, table,
tree, accordion, calendar…). `ui-icon` и `ui-spinner` рисуют через `currentColor` и должны
по-прежнему следовать за родителем. `pnpm test-host-css` применяет `color` и `letter-spacing` body
хоста к обоим снимкам, поэтому они не считаются изменениями; `--strict` их считает.

**Варианты:**

1. Наследовать дальше (рекомендую, сделано): текст кита совпадает с текстом хоста вокруг — первый
   замер назвал это «почти незаметно и совпадает с остальным приложением», и ни один компонент не
   получает нового правила.
2. Каждый корень компонента и панель оверлея задают `color: var(--ui-color-text)` и
   `letter-spacing: normal`, кроме `ui-icon` и `ui-spinner`; `test-host-css` тогда работает в
   строгом режиме. Кит выглядит одинаково в любом хосте, но чуть отличается от собственного текста
   клиента.

## Комментарии

- 2026-10-15: Ответ пользователя: вариант 1, наследовать дальше. Компоненты кита продолжают наследовать `color` и `letter-spacing` от хоста; код не меняется. Записано в `docs/DECISIONS.md` → «Client pilot: review answers».
