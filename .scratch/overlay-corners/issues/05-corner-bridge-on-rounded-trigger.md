# 05: the corner tooltip's hover bridge on a rounded trigger

**Spec:** [../spec.md](../spec.md) → decision 5 (gap only on the block axis, the bridge of `top` / `bottom`), user story 6

**Status:** needs-info

**Facts:** Found in ticket 02. A corner tooltip has no inline gap, and its hover bridge is the
strip of `top` / `bottom`: the width of the tooltip, in the block gap, touching the trigger's
corner. On a trigger with rounded corners (an icon button), the pointer crossing exactly through
the corner leaves both the trigger and the bridge for 1–2 px, because the rounded corner is not
the corner of the trigger's box. With the default hide delay (100 ms) the tooltip stays open; with
`uiTooltipHideDelay="0"` it closes. Square triggers are not affected. WCAG 1.4.13 (hoverable) asks
that the pointer can reach the tooltip without it going away; the default delay covers it today.

**Options:**

1. Keep decision 5 as it is: the default 100 ms hide delay absorbs the 1–2 px, and an app that
   sets `uiTooltipHideDelay="0"` on a corner tooltip accepts it (recommended; no extra CSS, the
   bridge stays the same strip for every placement).
2. Widen the corner bridge: extend it inline by a few pixels past the trigger's corner (a
   `::before` that also covers the trigger's corner), in `tooltip.scss` for the four corner
   classes only. A small CSS change; it changes decision 5 of the spec.
3. Document the limit in the tooltip section of the README and leave the CSS as it is.

## Comments

## Русский перевод

# 05: мостик для наведения у углового tooltip на скруглённом триггере

**Спека:** [../spec.md](../spec.md) → решение 5 (зазор только по вертикали, мостик как у `top` / `bottom`), пользовательская история 6

**Статус:** needs-info

**Факты:** Найдено в тикете 02. У углового tooltip нет горизонтального зазора, а его мостик для
наведения — та же полоса, что у `top` / `bottom`: шириной с tooltip, в вертикальном зазоре,
касается угла триггера. На триггере со скруглёнными углами (icon button) курсор, пересекающий
ровно угол, на 1–2 px выходит и из триггера, и из мостика, потому что скруглённый угол — не угол
бокса триггера. При задержке скрытия по умолчанию (100 мс) tooltip остаётся открытым; при
`uiTooltipHideDelay="0"` закрывается. У квадратных триггеров этого нет. WCAG 1.4.13 (hoverable)
требует, чтобы курсор мог дойти до tooltip, не закрыв его; сейчас это обеспечивает задержка по
умолчанию.

**Варианты:**

1. Оставить решение 5 как есть: задержка скрытия 100 мс по умолчанию поглощает 1–2 px, а
   приложение, которое задаёт `uiTooltipHideDelay="0"` у углового tooltip, принимает это
   (рекомендую; нет лишнего CSS, мостик остаётся той же полосой для любого placement).
2. Расширить мостик угла: продлить его по горизонтали на несколько пикселей за угол триггера
   (`::before`, который покрывает и угол триггера), только для четырёх угловых классов в
   `tooltip.scss`. Небольшая правка CSS; она меняет решение 5 спеки.
3. Описать ограничение в разделе tooltip в README, CSS не менять.

## Комментарии
