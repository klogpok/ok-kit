# 03: Popover opens in a corner

Status: ready-for-agent
Blocked by: 01

Spec: `../spec.md` → "Decisions" 1–5, user stories 2–4, 7.

**What to build:**

- `UiPopoverPosition` becomes an alias of `UiOverlayPlacement`; the popover builds its positions
  with the placement helper of ticket 01. The default stays `bottom`.
- `popover.scss`: `ui-popover--corner-top-*` get the block-end gap, `ui-popover--corner-bottom-*`
  the block-start gap. No inline gap, no bridge (the popover opens on click).
- The kit's own push (`UiPopoverPositionStrategy`, `pushOnScreen()`) keeps a corner popover inside
  the viewport, including the RTL iframe scrollbar case of phase 9 (tickets 27–28).
- `UiPopoverHarness`: `getPosition()` returns corners.
- Stories: the placement control lists the corners; a story shows a corner popover, covered by the
  visual baselines in light, dark and RTL.
- README popover section: one sentence on corners and their flip.

- [ ] Each corner opens with its panel class and sits outside the trigger's corner (spec, LTR and
      RTL).
- [ ] A top corner with no room above flips to the bottom corner on the same inline side; the
      harness reports it.
- [ ] A corner popover with no room on the inline axis is pushed inside the viewport and does not
      cover the trigger.
- [ ] The harness spec covers `getPosition()` for a corner.
- [ ] Stories and new visual baselines for the corners; existing baselines unchanged.
- [ ] One commit, `feat(popover): ...`.

## Русский перевод

# 03: Popover открывается в углу

Статус: ready-for-agent
Заблокирован: 01

Spec: `../spec.md` → «Решения» 1–5, пользовательские истории 2–4, 7.

**Что сделать:**

- `UiPopoverPosition` становится псевдонимом `UiOverlayPlacement`; popover строит позиции через
  хелпер placement из тикета 01. По умолчанию остаётся `bottom`.
- `popover.scss`: `ui-popover--corner-top-*` получают зазор снизу, `ui-popover--corner-bottom-*` —
  зазор сверху. Горизонтального зазора и мостика нет (popover открывается по клику).
- Push библиотеки (`UiPopoverPositionStrategy`, `pushOnScreen()`) держит угловой popover внутри
  viewport, включая случай со скроллбаром в RTL iframe из фазы 9 (тикеты 27–28).
- `UiPopoverHarness`: `getPosition()` возвращает углы.
- Stories: контрол placement перечисляет углы; story показывает угловой popover, покрытый
  визуальными baselines в светлой, тёмной теме и RTL.
- Раздел popover в README: одно предложение про углы и их флип.

- [ ] Каждый угол открывается со своим классом панели и стоит снаружи угла триггера (спек, LTR и
      RTL).
- [ ] Верхний угол без места сверху переворачивается в нижний угол на той же горизонтальной
      стороне; харнесс это сообщает.
- [ ] Угловой popover без места по горизонтали сдвигается внутрь viewport и не накрывает триггер.
- [ ] Спек харнесса покрывает `getPosition()` для угла.
- [ ] Stories и новые визуальные baselines для углов; существующие baselines не меняются.
- [ ] Один коммит, `feat(popover): ...`.
