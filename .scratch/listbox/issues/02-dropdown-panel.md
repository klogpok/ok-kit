# 02: dropdown panel directive in core

**Status:** ready-for-agent
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

- [ ] Directive with `uiDropdownPanel` (origin), `open`, optional `returnFocusTo`, output `closed`.
- [ ] Focus return: when the panel closes with focus inside it, focus `returnFocusTo`.
- [ ] Spec: RTL direction on attach, outside click (not on the origin), Escape, reopen with a new
  offset and width (guards the `offsetX` setter behavior), focus return.
- [ ] Record the `offsetX` reliance and "use `uiDropdownPanel`" in `.claude/rules/overlays.md`.
- [ ] Commit `feat(core): dropdown panel directive`.

## Русский перевод

# 02: директива dropdown panel в core

**Статус:** ready-for-agent
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

- [ ] Директива с `uiDropdownPanel` (origin), `open`, опциональным `returnFocusTo`, output `closed`.
- [ ] Возврат фокуса: если панель закрывается с фокусом внутри, фокус на `returnFocusTo`.
- [ ] Spec: RTL direction на attach, outside click (не по origin), Escape, повторное открытие с
  новыми offset и шириной (сторожит поведение сеттера `offsetX`), возврат фокуса.
- [ ] Записать опору на `offsetX` и «используй `uiDropdownPanel`» в `.claude/rules/overlays.md`.
- [ ] Коммит `feat(core): dropdown panel directive`.
