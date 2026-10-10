# 32: Playground phase 8 sections have no card style and mixed-up JSON in RTL

**Spec:** [../spec.md](../spec.md) → 9.3 (found by the browser check; it also exists on `master`)

**Status:** needs-info

**Facts:** the `section` card style of the playground lives in `app.scss`, the styles of the `App` component, so it does not reach the sections inside `<app-phase-eight>`: those sections render without the card frame. Their `<pre>` blocks with JSON values have no `dir="ltr"`, so in RTL the braces and quotes read out of order. The kit itself is not affected, and ticket 13 did not change this (its screenshots are pixel-identical to before).

**Options:**

1. Fix it in the playground now: a shared section style that reaches every phase component, and `dir="ltr"` on the JSON `<pre>` blocks (recommended; small, playground only).
2. Leave it: the playground is a demo, not part of the package.

## Русский перевод

# 32: Секции phase 8 в playground без стиля карточки, а JSON в RTL перемешан

**Спека:** [../spec.md](../spec.md) → 9.3 (найдено при проверке в браузере; есть и в `master`)

**Статус:** needs-info

**Факты:** стиль карточки `section` в playground лежит в `app.scss`, то есть в стилях компонента `App`, поэтому он не доходит до секций внутри `<app-phase-eight>`: эти секции рисуются без рамки карточки. Их блоки `<pre>` со значениями JSON не помечены `dir="ltr"`, поэтому в RTL скобки и кавычки стоят не по порядку. Сам кит это не затрагивает, и тикет 13 этого не менял (его скриншоты попиксельно совпадают с прежними).

**Варианты:**

1. Исправить в playground сейчас: общий стиль секции, который доходит до всех компонентов фаз, и `dir="ltr"` на блоках `<pre>` с JSON (рекомендую; мелкая правка, только playground).
2. Оставить: playground — демо, он не входит в пакет.
