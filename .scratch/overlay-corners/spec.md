# Overlay corners: tooltip and popover open diagonally outside a corner of the trigger

Status: ready-for-agent

Feature work outside the phases, settled in a grilling session on 2026-10-23. Terms are from
`GLOSSARY.md` → "Overlays" (trigger, placement, side, corner, aligned placement, flip, push); that
section was added for this work.

## Problem Statement

A tooltip and a popover open only on a **side** of their trigger (`top`, `bottom`, `start`,
`end`), centered along that edge. A screen sometimes needs the overlay out of the way of the
content next to the trigger, diagonally outside one of its corners (above and before the start
edge, for example). Today the only way is to pass CDK connected positions by hand, which the
tooltip and the popover do not accept.

The menu already has `top-start`, `top-end`, `bottom-start` and `bottom-end`, but these are
**aligned placements** (above or below the trigger, one edge lined up), not corners. Reusing those
names for corners would give one value two meanings in the kit.

## Solution

Four new **corner** placements for the tooltip and the popover:

- `corner-top-start`, `corner-top-end`, `corner-bottom-start`, `corner-bottom-end`.
- Logical: `start` and `end` follow the text direction (in RTL `corner-top-start` sits above and to
  the right of the trigger).
- The overlay sits entirely outside the corner: above (or below) the trigger, and entirely before
  its start edge (or after its end edge). Its inline edge meets the trigger's edge; there is no
  horizontal gap.

The geometry lives once in `@vplans/ui-kit/core` next to `UiOverlaySide`; `UiTooltipPosition` and
`UiPopoverPosition` widen to sides plus corners. The defaults do not change (`top` for the tooltip,
`bottom` for the popover), and `provideUiTooltip({ position })` accepts a corner too.

## Decisions (from the grilling, 2026-10-23)

1. **Corner, not aligned placement.** "Left top" means diagonally outside the corner. An aligned
   `top-start` like the menu's is not added to the tooltip or the popover.
2. **Logical names with a `corner-` prefix.** `top-start` keeps its one meaning in the kit (the
   menu's aligned placement). No physical `left`/`right` names or aliases.
3. **Scope: tooltip and popover.** Both already share `UiOverlaySide`. The menu (CDK Menu presets)
   and the dropdown panels (select, multi-select, autocomplete, time input, date pickers: they
   follow the field's width) are not changed.
4. **Flip: vertical mirror, then push.** `corner-top-start` flips to `corner-bottom-start` and back;
   `corner-top-end` ↔ `corner-bottom-end`. There is no horizontal flip: when the corner has no room
   on the inline axis, the push moves the overlay over the trigger, and the vertical gap keeps it
   off the trigger. The tooltip keeps the CDK push, the popover keeps the kit's own push
   (`docs/DECISIONS.md`, ticket 31 of phase 9).
5. **Gap only on the block axis.** `--ui-tooltip-offset` / `--ui-popover-offset` separate the
   overlay from the trigger vertically (block-end gap for the top corners, block-start for the
   bottom ones). The tooltip's hover bridge is the same strip as for `top` / `bottom`: the width of
   the tooltip, in the gap, touching the trigger's corner (WCAG 1.4.13 hoverable).

## User Stories

1. As an app developer, I want `uiTooltipPosition="corner-top-start"` to open the tooltip
   diagonally above and before the trigger, so that it does not cover the content next to it.
2. As an app developer, I want the same four corner values on `uiPopoverPosition`, so that a
   tooltip and a popover on one screen are placed with the same words.
3. As an app developer in the Hebrew RTL app, I want `start` in a corner to mean the right side, so
   that the placement mirrors with the layout as `start` / `end` already do.
4. As an app developer, I want a corner with no room above to flip below on the same inline side,
   so that the overlay stays next to the same edge of the trigger.
5. As an app developer, I want `provideUiTooltip({ position: 'corner-top-end' })` to set a corner
   for every tooltip, so that an app-wide default can be a corner.
6. As a pointer user, I want to move the pointer from the trigger's corner into a corner tooltip
   without it hiding, so that I can read or select its text.
7. As a test author, I want `UiTooltipHarness.getPosition()` and `UiPopoverHarness.getPosition()`
   to return the corner the overlay ended up in, after a flip.
8. As a kit maintainer, I want the corner positions and their flip pairs defined once in `core`,
   so that the tooltip and the popover cannot drift.

## Implementation Decisions

- `core/overlay.ts`: a `UiOverlayCorner` type, a `UiOverlayPlacement = UiOverlaySide |
  UiOverlayCorner` type, the CDK connected position of each corner and its vertical mirror, and a
  helper that returns `[preferred, flipped]` with the pane class `<prefix>--<placement>` for any
  placement. `sideOverlayPositions()` keeps working for sides (consumers may call it).
- Corner connected positions (logical, the overlay direction is synced on open):
  - `corner-top-start`: origin `start`/`top`, overlay `end`/`bottom`;
  - `corner-top-end`: origin `end`/`top`, overlay `start`/`bottom`;
  - `corner-bottom-start`: origin `start`/`bottom`, overlay `end`/`top`;
  - `corner-bottom-end`: origin `end`/`bottom`, overlay `start`/`top`.
- `UiTooltipPosition` and `UiPopoverPosition` become aliases of `UiOverlayPlacement`.
- Panel classes `ui-tooltip--corner-*` / `ui-popover--corner-*` carry the gap (and, for the
  tooltip, the bridge).
- The harnesses list the corners among the positions they read from the panel class.
- Stories: the placement control lists the corners; a story shows the four corners, covered by the
  visual baselines in light, dark and RTL.

## Testing Decisions

- `core`: the corner positions and the flip pairs, through the public helper (as
  `overlay.spec.ts` tests `sideOverlayPositions()` today).
- Tooltip and popover specs: each corner opens with its panel class; a corner with no room flips to
  its vertical mirror and the harness reports it; RTL mirrors the inline side.
- Tooltip spec: the bridge keeps a corner tooltip open while the pointer crosses the gap.
- Popover spec: a pushed corner popover stays inside the viewport (the kit's own push).

## Out of Scope

- Aligned placements (`top-start` like the menu's) on the tooltip or the popover.
- Corners on the menu or on any dropdown panel.
- A horizontal flip, an arrow, or physical `left` / `right` names.

## Further Notes

- The tickets are in `issues/`: 01 core, 02 tooltip and 03 popover (parallel after 01), 04 docs
  and report. `CHANGELOG.md` and `docs/DECISIONS.md` are written only in 04, so that 02 and 03 do
  not touch the same files.

## Русский перевод

# Углы оверлеев: tooltip и popover открываются по диагонали снаружи угла триггера

Статус: ready-for-agent

Работа вне фаз, согласованная на допросе (grilling) 2026-10-23. Термины из `GLOSSARY.md` →
«Overlays» (trigger, placement, side, corner, aligned placement, flip, push); этот раздел добавлен
для этой работы.

## Постановка проблемы

Tooltip и popover открываются только на **стороне** (side) своего триггера (`top`, `bottom`,
`start`, `end`) и центрируются вдоль этого края. Иногда экрану нужно, чтобы оверлей не мешал
содержимому рядом с триггером и стоял по диагонали снаружи одного из его углов (например, выше и
перед начальным краем). Сейчас для этого пришлось бы вручную передать CDK connected positions, а
tooltip и popover их не принимают.

У menu уже есть `top-start`, `top-end`, `bottom-start` и `bottom-end`, но это **aligned
placements** (над или под триггером, один край выровнен), а не углы. Если взять эти имена для
углов, одно значение получит в библиотеке два смысла.

## Решение

Четыре новых placement-а **corner** для tooltip и popover:

- `corner-top-start`, `corner-top-end`, `corner-bottom-start`, `corner-bottom-end`.
- Логические: `start` и `end` следуют направлению текста (в RTL `corner-top-start` стоит выше и
  правее триггера).
- Оверлей целиком снаружи угла: над триггером (или под ним) и целиком перед его начальным краем
  (или после конечного). Его край по горизонтали совпадает с краем триггера, горизонтального зазора
  нет.

Геометрия задаётся один раз в `@vplans/ui-kit/core` рядом с `UiOverlaySide`; `UiTooltipPosition`
и `UiPopoverPosition` расширяются до сторон и углов. Значения по умолчанию не меняются (`top` у
tooltip, `bottom` у popover), а `provideUiTooltip({ position })` тоже принимает угол.

## Решения (из допроса, 2026-10-23)

1. **Угол, а не aligned placement.** «Left top» значит по диагонали снаружи угла. Выровненный
   `top-start`, как у menu, в tooltip и popover не добавляется.
2. **Логические имена с префиксом `corner-`.** У `top-start` в библиотеке остаётся один смысл
   (aligned placement у menu). Физических имён `left`/`right` и псевдонимов нет.
3. **Охват: tooltip и popover.** У них уже общий `UiOverlaySide`. Menu (пресеты CDK Menu) и
   dropdown panels (select, multi-select, autocomplete, time input, date pickers: они следуют ширине
   поля) не меняются.
4. **Flip: вертикальное зеркало, затем push.** `corner-top-start` переворачивается в
   `corner-bottom-start` и обратно; `corner-top-end` ↔ `corner-bottom-end`. Горизонтального флипа
   нет: если углу не хватает места по горизонтали, push сдвигает оверлей над триггером, а
   вертикальный зазор не даёт ему накрыть триггер. Tooltip оставляет push из CDK, popover — push
   библиотеки (`docs/DECISIONS.md`, ticket 31 фазы 9).
5. **Зазор только по вертикали.** `--ui-tooltip-offset` / `--ui-popover-offset` отделяют оверлей
   от триггера по вертикали (зазор снизу у верхних углов, сверху у нижних). Мостик для наведения у
   tooltip — та же полоса, что у `top` / `bottom`: шириной с tooltip, в зазоре, касается угла
   триггера (WCAG 1.4.13 hoverable).

## Пользовательские истории

1. Как разработчик приложения, я хочу, чтобы `uiTooltipPosition="corner-top-start"` открывал
   tooltip по диагонали выше и перед триггером, чтобы он не закрывал содержимое рядом.
2. Как разработчик приложения, я хочу те же четыре угла в `uiPopoverPosition`, чтобы tooltip и
   popover на одном экране задавались одинаковыми словами.
3. Как разработчик приложения на иврите (RTL), я хочу, чтобы `start` в угле означал правую сторону,
   чтобы placement отражался вместе с раскладкой, как уже работают `start` / `end`.
4. Как разработчик приложения, я хочу, чтобы угол без места сверху переворачивался вниз на той же
   горизонтальной стороне, чтобы оверлей оставался у того же края триггера.
5. Как разработчик приложения, я хочу, чтобы `provideUiTooltip({ position: 'corner-top-end' })`
   задавал угол всем tooltip, чтобы значением по умолчанию для приложения мог быть угол.
6. Как пользователь мыши, я хочу провести курсор от угла триггера в угловой tooltip, не закрывая
   его, чтобы прочитать или выделить текст.
7. Как автор тестов, я хочу, чтобы `UiTooltipHarness.getPosition()` и
   `UiPopoverHarness.getPosition()` возвращали угол, в котором оказался оверлей после флипа.
8. Как мейнтейнер библиотеки, я хочу, чтобы позиции углов и их пары для флипа задавались один раз в
   `core`, чтобы tooltip и popover не разошлись.

## Решения по реализации

- `core/overlay.ts`: тип `UiOverlayCorner`, тип `UiOverlayPlacement = UiOverlaySide |
  UiOverlayCorner`, CDK connected position каждого угла и его вертикальное зеркало, и хелпер,
  который для любого placement возвращает `[preferred, flipped]` с классом панели
  `<prefix>--<placement>`. `sideOverlayPositions()` продолжает работать для сторон (его могут
  вызывать потребители).
- Connected positions углов (логические, направление оверлея синхронизируется при открытии):
  - `corner-top-start`: origin `start`/`top`, overlay `end`/`bottom`;
  - `corner-top-end`: origin `end`/`top`, overlay `start`/`bottom`;
  - `corner-bottom-start`: origin `start`/`bottom`, overlay `end`/`top`;
  - `corner-bottom-end`: origin `end`/`bottom`, overlay `start`/`top`.
- `UiTooltipPosition` и `UiPopoverPosition` становятся псевдонимами `UiOverlayPlacement`.
- Классы панели `ui-tooltip--corner-*` / `ui-popover--corner-*` задают зазор (и мостик у tooltip).
- Харнессы включают углы в список позиций, которые читают из класса панели.
- Stories: контрол placement перечисляет углы; story со всеми четырьмя углами покрыта визуальными
  baselines в светлой, тёмной теме и RTL.

## Решения по тестированию

- `core`: позиции углов и пары флипа через публичный хелпер (как `overlay.spec.ts` сейчас
  тестирует `sideOverlayPositions()`).
- Спеки tooltip и popover: каждый угол открывается со своим классом панели; угол без места
  переворачивается в вертикальное зеркало, и харнесс это сообщает; в RTL горизонтальная сторона
  отражается.
- Спек tooltip: мостик держит угловой tooltip открытым, пока курсор пересекает зазор.
- Спек popover: сдвинутый угловой popover остаётся внутри viewport (push библиотеки).

## Вне объёма

- Aligned placements (`top-start`, как у menu) в tooltip или popover.
- Углы у menu или у любой dropdown panel.
- Горизонтальный флип, стрелка или физические имена `left` / `right`.

## Дополнительные заметки

- Тикеты в `issues/`: 01 core, 02 tooltip и 03 popover (параллельно после 01), 04 документация и
  отчёт. `CHANGELOG.md` и `docs/DECISIONS.md` правятся только в 04, чтобы 02 и 03 не трогали одни и
  те же файлы.
