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

**2026-10-11 - code review fixes.** ArrowDown/ArrowUp on a locked field no longer leave an active
option on the closed list (test first); `reveal()` injects `DOCUMENT`; the dropdown panel JSDoc
says the CDK has already detached it after Escape; the CHANGELOG says select and multi-select keep
`UiSelectBase`; `listbox/public-api.ts` exports only what other entry points import. Renamed: the
`ui-listbox` component is `UiListbox` (`listbox.ts`, `listbox.scss`), the controller
`UiListboxController` (`listbox-controller.ts`). The item tests of the listbox moved from
`select/option-items.spec.ts` to `listbox/listbox.spec.ts` (the rest is
`select/select-items.spec.ts`). The controller labels the listbox and `fieldListboxConfig()` gives
the shared `ariaLabel`, `locked` and `opened` / `closed`, replacing three copies of
`listLabelledBy`; the config reading rule is documented; `activateEnd` takes the arrow key union;
time-input passes `id: this.id` and gives the product reason for rendering every slot. 968 unit
tests, lint, format, `ng build`, visual select/autocomplete/time-input with no changes.

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

**2026-10-11 — исправления по code review.** ArrowDown/ArrowUp в заблокированном поле больше не
оставляют active option в закрытом списке (сначала тест); `reveal()` берёт `DOCUMENT` через
inject; JSDoc dropdown panel говорит, что после Escape CDK уже отсоединил панель; CHANGELOG
говорит, что select и multi-select остаются на `UiSelectBase`; `listbox/public-api.ts`
экспортирует только то, что импортируют другие entry points. Переименовано: компонент
`ui-listbox` — `UiListbox` (`listbox.ts`, `listbox.scss`), контроллер — `UiListboxController`
(`listbox-controller.ts`). Тесты items listbox перенесены из `select/option-items.spec.ts` в
`listbox/listbox.spec.ts` (остальное — `select/select-items.spec.ts`). Контроллер сам задаёт
подпись listbox, а `fieldListboxConfig()` даёт общие `ariaLabel`, `locked` и `opened` / `closed`
вместо трёх копий `listLabelledBy`; правило чтения config описано; `activateEnd` принимает union
клавиш-стрелок; time-input передаёт `id: this.id` и объясняет продуктовую причину отрисовки всех
слотов. 968 unit-тестов, lint, format, `ng build`, visual select/autocomplete/time-input без
изменений.
