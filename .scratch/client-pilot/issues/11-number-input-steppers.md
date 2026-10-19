# 11: the −/+ steppers of the action weights fields

**Spec:** [../spec.md](../spec.md) → decision 1, ticket 05

**Status:** done

**Facts:** ticket 05 replaced the native `<input type="number">` of each action weight with
`ui-number-input` in a `ui-form-field` and a `%` suffix. The old field was `90px` wide plus a
separate `%` box, and showed the browser's spin arrows only on hover. `ui-number-input` shows its
−/+ steppers by default (`steppers` input, `true`), so the client gives the field
`inline-size: 10rem` (`.weight-input` in `action-weights-section.component.scss`) to fit the value,
the steppers and `%`. ArrowUp/Down change the value with or without the steppers. The change is one
attribute and one width in the client, inside `apartment-changes-new/`; the kit does not change.

**Options:**

1. Keep the steppers and the `10rem` field (recommended): a mouse user can change a weight
   without typing, as the browser's arrows allowed, and the steppers are the kit's default look
   for a number field, so every kit screen looks the same.
2. Hide them with `[steppers]="false"` and narrow the field to about the old width (`6rem` with
   `%`). Closer to the old row; the value is then changed by typing or ArrowUp/Down only.

## Comments

- 2026-10-19: User's answer: option 1, keep the steppers and the `10rem` field. No code change. Recorded in `docs/DECISIONS.md` → "Client pilot: approved".

## Русский перевод

# 11: кнопки −/+ у полей весов действий

**Спека:** [../spec.md](../spec.md) → решение 1, тикет 05

**Статус:** сделано

**Факты:** тикет 05 заменил нативный `<input type="number">` каждого веса на `ui-number-input` в
`ui-form-field` с suffix `%`. Старое поле было шириной `90px` плюс отдельный блок `%` и показывало
стрелки браузера только при наведении. `ui-number-input` по умолчанию показывает кнопки −/+
(input `steppers`, `true`), поэтому клиент задаёт полю `inline-size: 10rem` (`.weight-input` в
`action-weights-section.component.scss`), чтобы поместились значение, кнопки и `%`. ArrowUp/Down
меняют значение и с кнопками, и без них. Правка — один атрибут и одна ширина в клиенте внутри
`apartment-changes-new/`; кит не меняется.

**Варианты:**

1. Оставить кнопки и поле `10rem` (рекомендую): вес можно менять мышью без ввода, как раньше
   стрелками браузера, а кнопки — вид числового поля кита по умолчанию, так что все экраны на ките
   выглядят одинаково.
2. Скрыть их через `[steppers]="false"` и сузить поле примерно до старой ширины (`6rem` вместе с
   `%`). Ближе к старой строке; значение тогда меняется только вводом или ArrowUp/Down.

## Комментарии

- 2026-10-19: Ответ пользователя: вариант 1, кнопки −/+ и поле `10rem` остаются. Код не меняется. Записано в `docs/DECISIONS.md` → «Client pilot: approved».
