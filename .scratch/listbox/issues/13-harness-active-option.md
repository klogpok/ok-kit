# 13: active option in the public harnesses

**Spec:** [../spec.md](../spec.md) → decision 11; ticket 08

**Status:** done

**Facts:** ticket 08 put the select, autocomplete and time harnesses on one internal listbox
harness (`testing/listbox-harness.ts`, not exported). Their public interface did not change, as
decision 11 asked. Two things are open:

- The internal harness has `getActiveOption()` (the option named by `aria-activedescendant` of the
  field, or `null`). `UiSelectHarness`, `UiAutocompleteHarness` and `UiTimeInputHarness` do not
  expose it; a test reads the active option today with `(await h.getOptions())` and
  `isActive()` on each.
- `UiOptionHarness.isActive()` (public) now reads `aria-activedescendant` of the field instead of
  the `ui-option--active` class. The result is the same in every spec; it now also works for time
  slots and follows what a screen reader announces. It finds the field by searching the document
  for `[aria-activedescendant="<option id>"]`.

**Options:**

1. Keep `isActive()` on ARIA and add `getActiveOption()` to the three public harnesses (recommended):
   a one-line delegation each, useful in keyboard tests, noted in the README table and the CHANGELOG.
2. Keep `isActive()` on ARIA and leave the public harnesses as they are.
3. Return `isActive()` to the class and leave the public harnesses as they are.

## Comments

- 2026-10-11: Answered by the user: option 1. `isActive()` stays on ARIA; `getActiveOption()` added to `UiSelectHarness`, `UiAutocompleteHarness` and `UiTimeInputHarness` (a spec each, delegating to the internal listbox harness), noted in the README harness table and the CHANGELOG: `feat(testing): getActiveOption on the select, autocomplete and time harnesses`. Recorded in `docs/DECISIONS.md` → "Popup listbox: review answers".

## Русский перевод

# 13: активная опция в публичных harness'ах

**Спека:** [../spec.md](../spec.md) → решение 11; тикет 08

**Статус:** сделано

**Факты:** тикет 08 поставил harness'ы select, autocomplete и time на один внутренний
listbox-harness (`testing/listbox-harness.ts`, не экспортируется). Их публичный интерфейс не
изменился, как требовало решение 11. Открыты два вопроса:

- У внутреннего harness есть `getActiveOption()` (опция, на которую указывает
  `aria-activedescendant` поля, или `null`). `UiSelectHarness`, `UiAutocompleteHarness` и
  `UiTimeInputHarness` его не предоставляют; сейчас тест находит активную опцию через
  `(await h.getOptions())` и `isActive()` у каждой.
- `UiOptionHarness.isActive()` (публичный) теперь читает `aria-activedescendant` поля, а не класс
  `ui-option--active`. Результат во всех спеках тот же; теперь он работает и для слотов времени и
  соответствует тому, что объявляет экранный диктор. Поле он ищет в документе по
  `[aria-activedescendant="<id опции>"]`.

**Варианты:**

1. Оставить `isActive()` на ARIA и добавить `getActiveOption()` в три публичных harness'а
   (рекомендую): по одной строке делегирования в каждом, полезно в тестах клавиатуры, отметить в
   таблице README и в CHANGELOG.
2. Оставить `isActive()` на ARIA, публичные harness'ы не трогать.
3. Вернуть `isActive()` на класс, публичные harness'ы не трогать.

## Комментарии

- 2026-10-11: Ответ пользователя: вариант 1. `isActive()` остаётся на ARIA; `getActiveOption()` добавлен в `UiSelectHarness`, `UiAutocompleteHarness` и `UiTimeInputHarness` (по спеке на каждый, делегирование во внутренний listbox-harness), отмечен в таблице harness в README и в CHANGELOG: `feat(testing): getActiveOption on the select, autocomplete and time harnesses`. Записано в `docs/DECISIONS.md` → «Popup listbox: review answers».
