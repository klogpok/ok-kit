# 09: rules, docs and the check

**Status:** done
**Blocked by:** 07, 08

- [x] `.claude/rules/overlays.md`: add `time` and `listbox` to the `paths` glob; the direction and
  offset bullets point to `uiDropdownPanel` instead of asking each overlay to do it.
- [x] `.claude/rules/forms.md`: add `time` (and the other controls it misses) to the `paths` glob.
- [x] `projects/ui-kit/CHANGELOG.md`: `ui-select__panel` → `ui-listbox`, the `ɵ` exports removed
  from `select`, the autocomplete ArrowUp fix, the kept active option.
- [x] README: the listbox entry point in the component reference.
- [x] `/phase-check`, report, decisions in `DECISIONS.md`, ROADMAP status.

## Comments

**2026-10-11 - done.** `overlays.md` covers `listbox` and `time` and its direction and offset
bullets point to `uiDropdownPanel`; `forms.md` adds `listbox`, `time`, `segmented`, `tree`;
`components.md` no longer names the deleted `select/option-panel.ts`. CHANGELOG: the dropdown
panel, the time-input changes, the harness `isActive()`, and a "Fixed" section (autocomplete
ArrowUp, kept active option). README: the `listbox` row and `ɵUiDropdownPanel` in the core row.
Full check green: 967 unit tests, coverage 98.67/83.39/94.43/98.67, playground 8, 306 stories × 3
modes without axe violations, no visual changes, ngc clean, no budget warnings. Browser check in
the Storybook manager: lists aligned to the field with its width in light/dark RTL and LTR,
toggle and outside clicks close, the range picker fits at 360 px. Review questions: tickets 10–14.

## Русский перевод

# 09: правила, документация и проверка

**Статус:** сделано
**Зависит от:** 07, 08

- [x] `.claude/rules/overlays.md`: добавить `time` и `listbox` в glob `paths`; пункты про direction
  и offset ссылаются на `uiDropdownPanel`, а не требуют этого от каждого overlay.
- [x] `.claude/rules/forms.md`: добавить `time` (и другие пропущенные контролы) в glob `paths`.
- [x] `projects/ui-kit/CHANGELOG.md`: `ui-select__panel` → `ui-listbox`, `ɵ`-экспорты убраны из
  `select`, исправление ArrowUp в autocomplete, сохранение active option.
- [x] README: entry point listbox в справочнике компонентов.
- [x] `/phase-check`, отчёт, решения в `DECISIONS.md`, статус в ROADMAP.

## Комментарии

**2026-10-11 — сделано.** `overlays.md` охватывает `listbox` и `time`, пункты про direction и
offset ссылаются на `uiDropdownPanel`; в `forms.md` добавлены `listbox`, `time`, `segmented`,
`tree`; `components.md` больше не ссылается на удалённый `select/option-panel.ts`. CHANGELOG:
dropdown panel, изменения time-input, `isActive()` в harness и раздел «Fixed» (ArrowUp в
autocomplete, сохранение active option). README: строка `listbox` и `ɵUiDropdownPanel` в строке
core. Полная проверка зелёная: 967 unit-тестов, coverage 98.67/83.39/94.43/98.67, playground 8,
306 stories × 3 режима без нарушений axe, визуальных изменений нет, ngc чисто, предупреждений о
бюджетах нет. Браузер в Storybook manager: списки выровнены по полю и равны ему по ширине в
light/dark RTL и LTR, клик по toggle и снаружи закрывает, range picker помещается в 360 px.
Вопросы на ревью: тикеты 10–14.
