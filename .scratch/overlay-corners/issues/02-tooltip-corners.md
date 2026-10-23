# 02: Tooltip opens in a corner

Status: ready-for-agent
Blocked by: 01

Spec: `../spec.md` → "Decisions" 1–5, user stories 1, 3–7.

**What to build:**

- `UiTooltipPosition` becomes an alias of `UiOverlayPlacement`; `show()` builds its positions with
  the placement helper of ticket 01. The default stays `top`; `provideUiTooltip({ position })`
  accepts a corner.
- `tooltip.scss`: `ui-tooltip--corner-top-*` get the block-end gap and the same bridge as `top`;
  `ui-tooltip--corner-bottom-*` the block-start gap and the bridge of `bottom`. No inline gap.
- `UiTooltipHarness`: `getPosition()` returns corners.
- Stories: the placement control lists the corners; a story shows the four corners open, so the
  visual baselines cover them in light, dark and RTL.
- README tooltip section: one sentence on corners and their flip.

- [ ] Each corner opens with its panel class and sits outside the trigger's corner (spec, LTR and
      RTL).
- [ ] A top corner with no room above flips to the bottom corner on the same inline side; the
      harness reports it.
- [ ] The pointer moving from the trigger's corner into the tooltip across the gap keeps it open.
- [ ] `provideUiTooltip({ position: 'corner-top-end' })` sets the default; an input still wins.
- [ ] The harness spec covers `getPosition()` for a corner.
- [ ] Stories and new visual baselines for the corners; existing baselines unchanged.
- [ ] One commit, `feat(tooltip): ...`.

## Русский перевод

# 02: Tooltip открывается в углу

Статус: ready-for-agent
Заблокирован: 01

Spec: `../spec.md` → «Решения» 1–5, пользовательские истории 1, 3–7.

**Что сделать:**

- `UiTooltipPosition` становится псевдонимом `UiOverlayPlacement`; `show()` строит позиции через
  хелпер placement из тикета 01. По умолчанию остаётся `top`; `provideUiTooltip({ position })`
  принимает угол.
- `tooltip.scss`: `ui-tooltip--corner-top-*` получают зазор снизу и тот же мостик, что у `top`;
  `ui-tooltip--corner-bottom-*` — зазор сверху и мостик `bottom`. Горизонтального зазора нет.
- `UiTooltipHarness`: `getPosition()` возвращает углы.
- Stories: контрол placement перечисляет углы; story показывает четыре открытых угла, чтобы
  визуальные baselines покрывали их в светлой, тёмной теме и RTL.
- Раздел tooltip в README: одно предложение про углы и их флип.

- [ ] Каждый угол открывается со своим классом панели и стоит снаружи угла триггера (спек, LTR и
      RTL).
- [ ] Верхний угол без места сверху переворачивается в нижний угол на той же горизонтальной
      стороне; харнесс это сообщает.
- [ ] Курсор, идущий от угла триггера в tooltip через зазор, не закрывает его.
- [ ] `provideUiTooltip({ position: 'corner-top-end' })` задаёт значение по умолчанию; input
      по-прежнему важнее.
- [ ] Спек харнесса покрывает `getPosition()` для угла.
- [ ] Stories и новые визуальные baselines для углов; существующие baselines не меняются.
- [ ] Один коммит, `feat(tooltip): ...`.
