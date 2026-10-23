# 06: the block-fit re-apply also changes side placements

**Spec:** [../spec.md](../spec.md) → decision 4 (vertical mirror, then push; the tooltip keeps the CDK push, the popover the kit's push)

**Status:** done

**Facts:** Found in ticket 03 and the review. When no position fits, the CDK keeps the one with the
largest visible area. For a corner off screen on the inline axis that area is 0 or negative, so
the CDK kept the top corner and the push then moved the overlay onto the trigger. The fix,
`ɵUiBlockFittingPositionStrategy` in `core/overlay.ts`, lets the CDK apply, then applies again with
only the positions that fit on the block axis, and re-applies on window resize. Both the popover
and the tooltip use it, for every placement, not only corners. So two things change for sides too:

- a `top` / `bottom` overlay that fits on neither axis, where the CDK would have kept the side that
  does not fit vertically, now goes to the side that fits vertically;
- a window resize can flip an open popover or tooltip (before, the popover only pushed on resize
  and the tooltip only followed the CDK).

No existing visual baseline changed. `CHANGELOG.md` and `docs/DECISIONS.md` describe it.

**Options:**

1. Accept it for every placement: one rule for sides and corners, the overlay never covers its
   trigger when the other vertical side has room (recommended).
2. Limit the re-apply to corners: sides keep the earlier CDK choice and resize behavior exactly.
   Two code paths in the strategy.

## Comments

- 2026-10-23: Answered by the user: option 1, the block-fit re-apply stays for every placement, sides included, and a resize may flip an open overlay. Recorded in `docs/DECISIONS.md` → "Overlay corners".

## Русский перевод

# 06: повторное применение по вертикали меняет и стороны

**Спека:** [../spec.md](../spec.md) → решение 4 (вертикальное зеркало, затем push; tooltip оставляет push CDK, popover — push библиотеки)

**Статус:** сделано

**Факты:** Найдено в тикете 03 и на ревью. Когда ни одна позиция не помещается, CDK оставляет ту,
у которой больше видимая площадь. У угла, вышедшего за край по горизонтали, эта площадь 0 или
отрицательная, поэтому CDK оставлял верхний угол, а push сдвигал оверлей на триггер. Исправление,
`ɵUiBlockFittingPositionStrategy` в `core/overlay.ts`, даёт CDK применить позицию, затем применяет
снова только позиции, которые помещаются по вертикали, и повторяет это при resize окна. Его
используют и popover, и tooltip, для любого placement, не только для углов. Поэтому у сторон тоже
меняются две вещи:

- оверлей `top` / `bottom`, который не помещается ни по одной оси, где CDK оставил бы сторону, не
  помещающуюся по вертикали, теперь уходит на сторону, которая помещается по вертикали;
- resize окна может перевернуть открытый popover или tooltip (раньше popover при resize только
  сдвигался, а tooltip просто следовал CDK).

Ни один существующий визуальный baseline не изменился. `CHANGELOG.md` и `docs/DECISIONS.md` это
описывают.

**Варианты:**

1. Принять для любого placement: одно правило для сторон и углов, оверлей не накрывает триггер,
   если на другой стороне по вертикали есть место (рекомендую).
2. Ограничить повторное применение углами: стороны сохраняют прежний выбор CDK и поведение при
   resize. Два пути кода в стратегии.

## Комментарии

- 2026-10-23: Ответ пользователя: вариант 1, повторное применение по вертикали остаётся для любого placement, включая стороны, и resize может перевернуть открытый оверлей. Записано в `docs/DECISIONS.md` → «Overlay corners».
