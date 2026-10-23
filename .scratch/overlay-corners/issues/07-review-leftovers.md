# 07: standards review leftovers that touch public API or styles

**Spec:** [../spec.md](../spec.md) → "Implementation Decisions" (`sideOverlayPositions()` keeps working for sides)

**Status:** done

**Facts:** The standards review of the spec branch left two judgement calls that were not fixed,
because they change public API or a style pattern:

- `sideOverlayPositions(preferred, prefix)` in `@vplans/ui-kit/core` is now only
  `return overlayPlacementPositions(preferred, prefix);`. No kit code calls it; only its specs do.
  The spec kept it because consumers may call it.
- `tooltip.scss` (four times) and `popover.scss` (twice) list each corner class next to `--top` or
  `--bottom` in one selector list (for the gap and, in the tooltip, the bridge). A pane class for
  the block side (for example `ui-tooltip--block-end`) added by core would remove these lists, but
  it adds a second class to every pane.

**Options:**

1. Leave both as they are (recommended): `sideOverlayPositions()` costs one line and keeps
   consumers compiling; the selector lists are explicit and covered by the baselines.
2. Mark `sideOverlayPositions()` `@deprecated` in favour of `overlayPlacementPositions()`, to be
   removed later; keep the selector lists.
3. Option 2 plus a block-side pane class from core, and the SCSS selects on it.

## Comments

- 2026-10-23: Answered by the user: option 1, leave both as they are: `sideOverlayPositions()` stays without `@deprecated`, the SCSS keeps its selector lists. Recorded in `docs/DECISIONS.md` → "Overlay corners".

## Русский перевод

# 07: остатки ревью стандартов, затрагивающие публичный API или стили

**Спека:** [../spec.md](../spec.md) → «Решения по реализации» (`sideOverlayPositions()` продолжает работать для сторон)

**Статус:** сделано

**Факты:** Ревью стандартов ветки спеки оставило два спорных места, которые не исправлены,
потому что меняют публичный API или приём в стилях:

- `sideOverlayPositions(preferred, prefix)` в `@vplans/ui-kit/core` теперь просто
  `return overlayPlacementPositions(preferred, prefix);`. Код библиотеки его не вызывает, только
  его спеки. Спека его оставила, потому что его могут вызывать потребители.
- `tooltip.scss` (четыре раза) и `popover.scss` (два раза) перечисляют каждый угловой класс рядом с
  `--top` или `--bottom` в одном списке селекторов (для зазора и, у tooltip, мостика). Класс панели
  для стороны по вертикали (например `ui-tooltip--block-end`), который добавляет core, убрал бы эти
  списки, но добавит второй класс каждой панели.

**Варианты:**

1. Оставить оба как есть (рекомендую): `sideOverlayPositions()` стоит одну строку и не ломает
   потребителей; списки селекторов явные и покрыты baselines.
2. Пометить `sideOverlayPositions()` как `@deprecated` в пользу `overlayPlacementPositions()`, чтобы
   убрать позже; списки селекторов оставить.
3. Вариант 2 плюс класс панели для стороны по вертикали из core, и SCSS выбирает по нему.

## Комментарии

- 2026-10-23: Ответ пользователя: вариант 1, оставить оба как есть: `sideOverlayPositions()` остаётся без `@deprecated`, SCSS сохраняет списки селекторов. Записано в `docs/DECISIONS.md` → «Overlay corners».
