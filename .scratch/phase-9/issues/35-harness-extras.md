# 35: Harness API beyond the spec

**Spec:** [../spec.md](../spec.md) → 9.4

**Status:** done

**Facts:** the 9.4 tickets added public API that the spec does not list:

- `UiAvatarGroupHarness` (shown avatars, the "+N" count) and `UiTabNavHarness` / `UiTabLinkHarness` for `nav[ui-tab-nav]`: separate components with state, so the new README rule ("a component with state or behavior has a harness") covers them.
- `UiDatepickerHarness.clickToday()` and `clickClear()`.
- `UiFormFieldHarness.getControl()` without a query returns the harness of the first kit control in the field. It imports the 16 control harnesses and lists them in a union type, so a new control must be added there too.
- Markup for the harnesses, with no visual change: host classes `ui-popover-trigger` and `ui-tooltip-trigger`; a datepicker panel id with `aria-controls` and a `ui-datepicker__clear` class; pagination arrow classes `ui-pagination__first/__previous/__next/__last` and `ui-pagination--disabled`. All are in the CHANGELOG.

**Options:**

1. Keep all of it (recommended).
2. Drop some of it: say which (for example `getControl()` without a query).

## Answer

Keep all of it. Recorded in docs/DECISIONS.md (2026-10-11).

## Русский перевод

# 35: API harnesses сверх спеки

**Спека:** [../spec.md](../spec.md) → 9.4

**Статус:** сделано

**Факты:** тикеты 9.4 добавили публичный API, которого нет в спеке:

- `UiAvatarGroupHarness` (видимые аватары, число «+N») и `UiTabNavHarness` / `UiTabLinkHarness` для `nav[ui-tab-nav]`: это отдельные компоненты с состоянием, поэтому их покрывает новое правило README («у компонента с состоянием или поведением есть harness»).
- `UiDatepickerHarness.clickToday()` и `clickClear()`.
- `UiFormFieldHarness.getControl()` без запроса возвращает harness первого контрола кита в поле. Он импортирует 16 harnesses контролов и перечисляет их в типе-объединении, поэтому новый контрол придётся добавлять и туда.
- Разметка для harnesses, без визуальных изменений: классы хоста `ui-popover-trigger` и `ui-tooltip-trigger`; id панели datepicker с `aria-controls` и класс `ui-datepicker__clear`; классы стрелок пагинации `ui-pagination__first/__previous/__next/__last` и `ui-pagination--disabled`. Всё записано в CHANGELOG.

**Варианты:**

1. Оставить всё (рекомендую).
2. Убрать часть: укажите, что именно (например, `getControl()` без запроса).

## Ответ

Оставить всё. Записано в docs/DECISIONS.md (2026-10-11).
