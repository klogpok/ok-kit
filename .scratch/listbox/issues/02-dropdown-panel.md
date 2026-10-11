# 02: dropdown panel directive in core

**Status:** done
**Blocked by:** 01

Turn `../prototype/dropdown-panel.ts` into `core/dropdown-panel.ts` (internal export from
`@vplans/ui-kit/core`). Usage: `<ng-template [uiDropdownPanel]="origin" [open]="isOpen()"
(closed)="close()">`. Prototype facts (CDK 20.2):

- `CdkConnectedOverlay` is standalone and works as a host directive on `<ng-template>`.
- Assigning `overlay.open` does nothing (open/close live in its `ngOnChanges`): call
  `attachOverlay()` / `detachOverlay()`.
- `positions` and `origin` reach an existing overlay only through the `offsetX` setter; assign
  `origin` first. `minWidth` needs `overlayRef.updateSize()` on a reopen.
- The directive host is a comment node: the field host is the origin element.
- Emit `closed` on `detach` only while `open()` is still true (Escape, dispose), or it fires twice.

- [x] Directive with `uiDropdownPanel` (origin), `open`, optional `returnFocusTo`, output `closed`.
- [x] Focus return: when the panel closes with focus inside it, focus `returnFocusTo`.
- [x] Spec: RTL direction on attach, outside click (not on the origin), Escape, reopen with a new
  offset and width (guards the `offsetX` setter behavior), focus return.
- [x] Record the `offsetX` reliance and "use `uiDropdownPanel`" in `.claude/rules/overlays.md`.
- [x] Commit `feat(core): dropdown panel directive`.

## Comments

**2026-10-11 - done.** `core/dropdown-panel.ts`, exported as `ɵUiDropdownPanel`. Inputs:
`uiDropdownPanel` (origin), `open`, `positions` (default `UI_DROPDOWN_POSITIONS`; the
datepickers pass `UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK`), `matchWidth` (default true: min width
= origin width, for the listbox; the datepickers set it to false), `returnFocusTo` (element or
`ElementRef`). Outputs: `closed` (Escape, outside click) and `attached` (for the calendar focus in
ticket 03). Focus on body when the panel closes counts as "was in the panel" (Escape detaches
first). The spec has 11 tests; removing the `offsetX` assignment, `updateSize()` or the focus
return makes them fail. `overlays.md` now also covers `core/`. Commit
`feat(core): dropdown panel directive`.

## Русский перевод

# 02: директива dropdown panel в core

**Статус:** сделано
**Зависит от:** 01

Превратить `../prototype/dropdown-panel.ts` в `core/dropdown-panel.ts` (internal-экспорт из
`@vplans/ui-kit/core`). Использование: `<ng-template [uiDropdownPanel]="origin" [open]="isOpen()"
(closed)="close()">`. Факты из прототипа (CDK 20.2):

- `CdkConnectedOverlay` — standalone и работает как host directive на `<ng-template>`.
- Присваивание `overlay.open` ничего не делает (open/close живут в его `ngOnChanges`): вызывать
  `attachOverlay()` / `detachOverlay()`.
- `positions` и `origin` попадают в уже созданный overlay только через сеттер `offsetX`; `origin`
  присваивать первым. `minWidth` при повторном открытии требует `overlayRef.updateSize()`.
- Хост директивы — comment node: хост поля — элемент origin.
- `closed` на `detach` эмитить, только пока `open()` ещё true (Escape, dispose), иначе событие
  придёт дважды.

- [x] Директива с `uiDropdownPanel` (origin), `open`, опциональным `returnFocusTo`, output `closed`.
- [x] Возврат фокуса: если панель закрывается с фокусом внутри, фокус на `returnFocusTo`.
- [x] Spec: RTL direction на attach, outside click (не по origin), Escape, повторное открытие с
  новыми offset и шириной (сторожит поведение сеттера `offsetX`), возврат фокуса.
- [x] Записать опору на `offsetX` и «используй `uiDropdownPanel`» в `.claude/rules/overlays.md`.
- [x] Коммит `feat(core): dropdown panel directive`.

## Комментарии

**2026-10-11 - сделано.** `core/dropdown-panel.ts`, экспорт `ɵUiDropdownPanel`. Inputs:
`uiDropdownPanel` (origin), `open`, `positions` (по умолчанию `UI_DROPDOWN_POSITIONS`; датапикеры
передают `UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK`), `matchWidth` (по умолчанию true: min width =
ширина origin, для listbox; датапикеры ставят false), `returnFocusTo` (элемент или `ElementRef`).
Outputs: `closed` (Escape, outside click) и `attached` (для фокуса календаря в тикете 03). Фокус на
body при закрытии считается «был в панели» (Escape сначала делает detach). В spec 11 тестов; без
присваивания `offsetX`, `updateSize()` или возврата фокуса они падают. `overlays.md` теперь
покрывает и `core/`. Коммит `feat(core): dropdown panel directive`.
