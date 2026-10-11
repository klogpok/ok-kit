# 14: an open panel does not follow a live direction switch

**Spec:** [../spec.md](../spec.md) → decision 1; ticket 09 browser check

**Status:** needs-info

**Facts:** checked in the built Storybook manager (Edge, page scrollbar shown). A datepicker panel
opened in LTR, then the toolbar switched the page to RTL while the panel stayed open:

- the field moved to the other side (`left` 16 → 644 px), the panel stayed where it was (`left`
  16 → 31 px, the 15 px is the scrollbar that moved to the left) and kept `dir="ltr"`;
- Escape and reopening put it right: `dir="rtl"`, its start edge on the field's start edge.

The same holds for every `uiDropdownPanel` (lists and datepickers): the direction, the offset and
the width are read when the panel opens, as decision 1 says, and the CDK repositions an open
overlay only on scroll or window resize. It was the same before this work (each field read the
direction on attach). The app is Hebrew and switches direction only in Storybook.

**Options:**

1. Keep it: the direction is read on open (recommended). Switching direction with an open panel
   does not happen in the app.
2. Close an open panel when the direction around its field changes (a `MutationObserver` on the
   closest `dir`).
3. Re-read the direction and reposition the open panel on that change.

## Comments

## Русский перевод

# 14: открытая панель не следует за переключением направления на лету

**Спека:** [../spec.md](../spec.md) → решение 1; браузерная проверка тикета 09

**Статус:** needs-info

**Факты:** проверено в собранном Storybook manager (Edge, полоса прокрутки страницы видна). Панель
datepicker открыта в LTR, затем toolbar переключил страницу в RTL, панель осталась открытой:

- поле переехало на другую сторону (`left` 16 → 644 px), панель осталась на месте (`left`
  16 → 31 px, 15 px — полоса прокрутки, ушедшая влево) и сохранила `dir="ltr"`;
- Escape и повторное открытие всё исправляют: `dir="rtl"`, начальный край панели на начальном крае
  поля.

Так ведёт себя любой `uiDropdownPanel` (списки и датапикеры): направление, offset и ширина
читаются при открытии, как сказано в решении 1, а CDK перепозиционирует открытый оверлей только
при прокрутке или изменении размера окна. До этой работы было так же (каждое поле читало
направление при attach). Приложение на иврите и переключает направление только в Storybook.

**Варианты:**

1. Оставить: направление читается при открытии (рекомендую). Переключения направления с открытой
   панелью в приложении не бывает.
2. Закрывать открытую панель, когда меняется направление вокруг её поля (`MutationObserver` на
   ближайшем `dir`).
3. Перечитывать направление и перепозиционировать открытую панель при таком изменении.

## Комментарии
