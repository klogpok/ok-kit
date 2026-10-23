# 01: Corner placements in `core/overlay.ts`

Status: ready-for-agent

Spec: `../spec.md` → "Implementation Decisions" and "Decisions" 4. Terms: `GLOSSARY.md` →
"Overlays".

**What to build:**

- `UiOverlayCorner = 'corner-top-start' | 'corner-top-end' | 'corner-bottom-start' |
  'corner-bottom-end'` and `UiOverlayPlacement = UiOverlaySide | UiOverlayCorner`, exported from
  `@vplans/ui-kit/core`.
- The CDK connected position of each corner (see the spec) and its flip: the vertical mirror
  (`corner-top-start` ↔ `corner-bottom-start`, `corner-top-end` ↔ `corner-bottom-end`).
- A helper that takes any placement and a pane class prefix and returns `[preferred, flipped]`,
  each with the pane class `<prefix>--<placement>`. `sideOverlayPositions()` keeps its signature
  and result for sides.
- JSDoc in the kit's style; the README core row lists the new exports.

- [ ] `UiOverlayCorner`, `UiOverlayPlacement` and the placement helper are exported from `core`.
- [ ] `overlay.spec.ts` covers each corner's connected position and flip pair, and that sides give
      the same result as before.
- [ ] `sideOverlayPositions()` callers (tooltip, popover) compile and pass unchanged.
- [ ] The README core row lists the new exports.
- [ ] One commit, `feat(core): ...`.

## Русский перевод

# 01: Угловые placement-ы в `core/overlay.ts`

Статус: ready-for-agent

Spec: `../spec.md` → «Решения по реализации» и «Решения» 4. Термины: `GLOSSARY.md` → «Overlays».

**Что сделать:**

- `UiOverlayCorner = 'corner-top-start' | 'corner-top-end' | 'corner-bottom-start' |
  'corner-bottom-end'` и `UiOverlayPlacement = UiOverlaySide | UiOverlayCorner`, экспортированные
  из `@vplans/ui-kit/core`.
- CDK connected position каждого угла (см. спек) и его флип: вертикальное зеркало
  (`corner-top-start` ↔ `corner-bottom-start`, `corner-top-end` ↔ `corner-bottom-end`).
- Хелпер, который принимает любой placement и префикс класса панели и возвращает
  `[preferred, flipped]`, у каждой позиции класс `<prefix>--<placement>`. У `sideOverlayPositions()`
  сигнатура и результат для сторон не меняются.
- JSDoc в стиле библиотеки; строка core в README перечисляет новые экспорты.

- [ ] `UiOverlayCorner`, `UiOverlayPlacement` и хелпер placement экспортируются из `core`.
- [ ] `overlay.spec.ts` покрывает connected position и пару флипа каждого угла, а также то, что
      стороны дают тот же результат, что и раньше.
- [ ] Места вызова `sideOverlayPositions()` (tooltip, popover) компилируются и проходят без
      изменений.
- [ ] Строка core в README перечисляет новые экспорты.
- [ ] Один коммит, `feat(core): ...`.
