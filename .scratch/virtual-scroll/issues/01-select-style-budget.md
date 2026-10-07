# 01: select.scss is over the component style budget

**Status:** done

`pnpm build:playground` warns: `projects/ui-kit/select/select.scss exceeded maximum budget. Budget
6.00 kB was not met by 71 bytes with a total of 6.07 kB.` The warning limit is 6 kB, raised in the
phase 6 review; the error limit stays at 8 kB. Phase 8.6 pushed it over: `select/_panel.scss`
gained 14 lines for the virtual scroll viewport (`.ui-select__panel--virtual`,
`.ui-select__viewport`). The build does not fail.

Options:

- [x] **A. Raise the warning to 7 kB** (recommended). The file grows with every list feature, the
  error limit stays at 8 kB, and nothing has to change in the styles.
- [ ] **B. Slim `select.scss` below 6 kB** by tightening its existing rules. Every control that
  includes the panel partial renders a viewport, so the new rules cannot simply move out; this
  needs an audit of the styles and new baselines if anything moves.
- [ ] **C. Leave the warning** until the next feature makes a decision necessary.

## Comments

2026-10-07: the user approved phase 8.6 with option A; `angular.json` now warns at 7 kB.

## Русский перевод

# 01: select.scss превышает бюджет стилей компонента

**Статус:** сделано

`pnpm build:playground` предупреждает: `projects/ui-kit/select/select.scss exceeded maximum budget.
Budget 6.00 kB was not met by 71 bytes with a total of 6.07 kB.` Порог предупреждения 6 kB (поднят
на ревью фазы 6), порог ошибки остаётся 8 kB. Превышение дала фаза 8.6: в `select/_panel.scss`
добавлено 14 строк для виртуального скролла (`.ui-select__panel--virtual`,
`.ui-select__viewport`). Сборка не падает.

Варианты:

- [x] **A. Поднять порог предупреждения до 7 kB** (рекомендуется). Файл растёт с каждой функцией
  списка, порог ошибки остаётся 8 kB, стили менять не нужно.
- [ ] **B. Облегчить `select.scss` до 6 kB**, ужав существующие правила. Все контролы с общей
  частью панели рисуют viewport, поэтому новые правила просто так не вынести; нужен разбор стилей
  и новые снимки, если что-то сдвинется.
- [ ] **C. Оставить предупреждение**, пока решение не понадобится для следующей функции.

## Комментарии

2026-10-07: пользователь одобрил фазу 8.6 с вариантом A; `angular.json` теперь предупреждает с 7 kB.
