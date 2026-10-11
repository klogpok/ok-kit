# 12: ArrowUp without an active option goes to the last option everywhere

**Spec:** [../spec.md](../spec.md) → decisions 7, 8; tickets 01, 04, 06

**Status:** needs-info

**Facts:** the listbox controller has one keyboard handler for all four fields. In an open list
with no active option, ArrowUp now activates the last option and ArrowDown the first, in
`ui-select`, `ui-multi-select`, `ui-autocomplete` and `ui-time-input`.

- autocomplete: this is the bug fix of ticket 01 (ArrowUp left no active option).
- select / multi-select: unchanged (they already did this, after first trying the selected
  option).
- time-input: new. ArrowUp did nothing before. The case is hard to reach: opening the time list
  always activates a slot (the value, the time now or the next later slot), and typing moves the
  active slot to the nearest one instead of clearing it.
- Alt+ArrowDown still opens without moving, Alt+ArrowUp closes.

The WAI-ARIA combobox pattern allows both "last option" and "do nothing" here.

**Options:**

1. Keep one rule for every field (recommended): it is what decision 7 asked for ("the workaround
   exists once").
2. Make time-input an exception that ignores ArrowUp without an active slot (a mode flag in the
   controller).

## Comments

## Русский перевод

# 12: ArrowUp без активной опции везде ведёт к последней опции

**Спека:** [../spec.md](../spec.md) → решения 7, 8; тикеты 01, 04, 06

**Статус:** needs-info

**Факты:** у контроллера listbox один обработчик клавиатуры для всех четырёх полей. В открытом
списке без активной опции ArrowUp теперь активирует последнюю опцию, а ArrowDown — первую, в
`ui-select`, `ui-multi-select`, `ui-autocomplete` и `ui-time-input`.

- autocomplete: это исправление ошибки из тикета 01 (ArrowUp оставлял список без активной опции).
- select / multi-select: без изменений (они уже так делали, сначала пробуя выбранную опцию).
- time-input: новое. Раньше ArrowUp ничего не делал. Случай трудно получить: при открытии список
  времени всегда активирует слот (значение, текущее время или ближайший следующий слот), а ввод
  переносит активный слот на ближайший, а не снимает его.
- Alt+ArrowDown по-прежнему открывает без перемещения, Alt+ArrowUp закрывает.

Паттерн WAI-ARIA combobox допускает здесь и «последнюю опцию», и «ничего не делать».

**Варианты:**

1. Одно правило для всех полей (рекомендую): этого и требовало решение 7 («обход существует в
   одном месте»).
2. Сделать time-input исключением, которое игнорирует ArrowUp без активного слота (флаг режима в
   контроллере).

## Комментарии
