# 11: time-input with no slots shows "no options"

**Spec:** [../spec.md](../spec.md) → tickets 04, 06

**Status:** done

**Facts:** when `minTime` is after `maxTime`, `ui-time-input` has no slots. Before ticket 06 the
list then opened as an empty panel (a border with nothing inside). Now the field renders
`ui-listbox`, which shows its "no options" row (`noOptions` label: `אין תוצאות` / "No options",
class `ui-listbox__empty`), as `ui-select` and `ui-autocomplete` do. The field still accepts any
typed time; the row only tells the user that the list has nothing to pick. No story or test
covered the old empty panel.

**Options:**

1. Keep the "no options" row (recommended): one behavior for every popup listbox, and an empty
   bordered box looked like a rendering error.
2. Do not open the list when there are no slots (no panel at all).
3. Restore the empty panel.

## Comments

- 2026-10-11: Answered by the user: option 1, keep the "no options" row. Recorded in `docs/DECISIONS.md` → "Popup listbox: review answers".

## Русский перевод

# 11: time-input без слотов показывает «нет вариантов»

**Спека:** [../spec.md](../spec.md) → тикеты 04, 06

**Статус:** сделано

**Факты:** когда `minTime` позже `maxTime`, у `ui-time-input` нет слотов. До тикета 06 список
тогда открывался пустой панелью (рамка без содержимого). Теперь поле рендерит `ui-listbox`, который
показывает строку «нет вариантов» (метка `noOptions`: `אין תוצאות` / "No options", класс
`ui-listbox__empty`), как у `ui-select` и `ui-autocomplete`. Поле по-прежнему принимает любое
введённое время; строка лишь сообщает, что выбрать из списка нечего. Старую пустую панель не
покрывали ни story, ни тест.

**Варианты:**

1. Оставить строку «нет вариантов» (рекомендую): одно поведение у всех popup listbox, а пустая
   рамка выглядела как ошибка рендера.
2. Не открывать список, когда слотов нет (панели нет вовсе).
3. Вернуть пустую панель.

## Комментарии

- 2026-10-11: Ответ пользователя: вариант 1, оставить строку «нет вариантов». Записано в `docs/DECISIONS.md` → «Popup listbox: review answers».
