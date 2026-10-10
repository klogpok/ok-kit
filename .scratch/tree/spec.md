# Spec: `ui-tree` (phase 8.7)

Status: done

## Problem Statement

The VPlans app has hierarchical data, such as departments and categories, and no kit component to show or pick from it. Teams need two things: a filter over a hierarchy, where checking a branch checks everything under it, and a picker for one node. Hierarchies can be large, so branches must be able to load their children on first expand.

## Solution

A new secondary entry point `@vplans/ui-kit/tree` with the `ui-tree` component. It is built on CDK Tree and follows the APG tree view pattern. It is a form control (Reactive and template forms through `ControlValueAccessor`) with three selection modes: `none`, `single` and `multiple`. In `multiple` mode each node has a tri-state checkbox that cascades. Terms follow [GLOSSARY.md](../../GLOSSARY.md) → Tree; the value semantics are in [ADR 0001](../../docs/adr/0001-tree-value-is-every-checked-key.md).

## User Stories

1. As a user filtering by department, I check a branch and every node under it becomes checked; the branch shows partially checked when only some descendants are checked.
2. As a user, I check a branch whose children are not loaded yet, then expand it, and its children appear checked.
3. As a user picking one category, I click a node (or press Enter or Space on it) and it becomes the selected node; moving focus with the arrows does not change the selection.
4. As a keyboard user, I navigate with the arrow keys (Left and Right swap in RTL), Home and End, type-ahead, and `*` to expand all sibling branches.
5. As a user, when a branch fails to load its children, I see an error in that node and can retry.
6. As a developer, I bind the tree to a form control and get keys: `K | null` in single mode and `K[]` in multiple mode.
7. As a developer, I prefill the value with keys of nodes that are not loaded yet, and the tree keeps them.
8. As a developer, I restore which branches are expanded through `[(expanded)]`, and I can call `expandAll()` and `collapseAll()`.
9. As a developer, I mark some nodes disabled; they stay focusable but cannot be selected or checked, and the cascade does not change them.
10. As a developer, I render a node with plain text by default, or with my own template for icons and badges.
11. As a developer, I show a loading state while the data arrives and an empty text when there is no data.

## Implementation Decisions

### API

- Entry point `tree`, selector `ui-tree`. It extends `UiFormControlBase` and provides its own `NG_VALUE_ACCESSOR`, so `disabled` and `readonly` come from the base.
- `data: T[]`: nested nodes only, with no flat or level-based input.
- `childrenWith: (node) => T[] | undefined` (default `node => node.children`). It is synchronous.
- `keyWith: (node) => K` (default `node => node.id`); keys are also the CDK `trackBy` and `expansionKey`.
- `displayWith: (node) => string` for the default label, plus an optional `<ng-template uiTreeNode let-node>` that replaces the label content. The chevron, the indent and the checkbox are always rendered by the kit.
- `selection: 'none' | 'single' | 'multiple'`.
- `disabledWith: (node) => boolean`.
- `expanded = model<K[]>()`, `expandAll()` and `collapseAll()`. `expandAll()` expands loaded branches only and never triggers loading.
- `loading: boolean` shows skeleton rows. An empty `data` shows the empty text from `UiLabels`, which a slot can override.

### Lazy branches

- `loadChildren: (node) => Observable<T[]> | Promise<T[]>` and `hasChildrenWith: (node) => boolean`.
- A node is a lazy branch when `hasChildrenWith` is true and `childrenWith` returns nothing.
- `loadChildren` runs on the first expand only, and the result is cached by key. While it runs, the node shows a spinner and `aria-busy`.
- On error the node shows an error text and a "Retry" button (new `UiLabels` entries in Hebrew and English). Expanding again also retries.
- `*` expands every sibling branch, and lazy ones start loading.

### Value and cascade (multiple)

- The value is the key of every checked node, branches included. A partially checked node is never in the value.
- A branch is checked when it and every descendant are checked. Its state is computed from the loaded nodes only.
- Clicking a branch checks every enabled descendant; when every enabled descendant is checked already, the click unchecks them instead. This rule wins over the branch state: a branch kept partially checked by a disabled unchecked descendant is unchecked by the click. (What lies under a disabled branch: ticket 01.)
- Keys that match no loaded node are kept as they are, and the tree does not expand to reveal them.
- When children load under a checked branch, their keys are added to the value through the bound control without marking it dirty. This runs outside `onChange`; the control is resolved through `injectControlState()`. See ADR 0001.

### Selection (single)

- Clicking a row, or pressing Enter or Space, selects that node; any enabled node can be selected. Selection does not follow focus. The tree uses `aria-selected`.

### Interaction and a11y

- Clicking a row selects (single) or toggles the checkbox (multiple); only the chevron and the arrow keys expand. With `selection="none"`, clicking a branch expands it.
- `role="tree"` / `treeitem` / `group`, `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded` on branches, and `aria-multiselectable` in multiple mode. Checked states use `aria-checked` true, false or mixed.
- A roving tabindex through the CDK tree key manager, with the focus ring shown for keyboard focus only.

### Look

- No guide lines. The level indent comes from a token (24px). The chevron rotates on expand and mirrors in RTL.
- Hover covers the whole row, and the selected node gets a tinted primary background, like a select option. Light, dark and forced colors are supported.

## Testing Decisions

- Unit specs cover rendering, inputs and outputs, the cascade (including disabled nodes and unknown keys), lazy load success, error and retry, the no-dirty update on load, keyboard handling in LTR and RTL, ARIA, Reactive forms (including `formControlName`) and `ngModel`.
- A harness in `@vplans/ui-kit/testing`.
- Stories for single, multiple, lazy, disabled, a custom template, loading, empty and RTL. Each passes axe in 3 modes and has visual baselines, plus play stories for the expanded and loading states.
- A playground section and the full `/phase-check`.

## Out of Scope

- Search or filtering inside the tree; consumers filter `data` themselves.
- Drag-and-drop reordering, inline rename and virtual scroll.
- Flat or level-based input data.
- Selection that follows focus, and range selection with Shift.
- Auto-expanding the path to keys in the value.

## Further Notes

- Every answer from the grilling session goes to `docs/DECISIONS.md` when the phase is reported.

## Русский перевод

# Спека: `ui-tree` (фаза 8.7)

Статус: сделано

## Постановка проблемы

В приложении VPlans есть иерархические данные, например отделы и категории, но нет компонента кита, чтобы их показать или выбрать из них. Командам нужны две вещи. Первая — фильтр по иерархии, где отметка ветки отмечает всё, что под ней. Вторая — выбор одного узла. Иерархии бывают большими, поэтому ветка должна уметь загружать детей при первом раскрытии.

## Решение

Новая вторичная точка входа `@vplans/ui-kit/tree` с компонентом `ui-tree`. Он построен на CDK Tree и следует паттерну APG tree view. Это контрол формы (Reactive и template forms через `ControlValueAccessor`) с тремя режимами выбора: `none`, `single` и `multiple`. В режиме `multiple` у каждого узла есть checkbox с тремя состояниями и каскадом. Термины — в [GLOSSARY.md](../../GLOSSARY.md) → Tree; семантика значения — в [ADR 0001](../../docs/adr/0001-tree-value-is-every-checked-key.md).

## Пользовательские истории

1. Я фильтрую по отделам и отмечаю ветку: все узлы под ней становятся checked. Если отмечена только часть потомков, ветка показывается partially checked.
2. Я отмечаю ветку, дети которой ещё не загружены, потом раскрываю её, и дети показываются отмеченными.
3. Я выбираю одну категорию: кликаю по узлу (или нажимаю на нём Enter либо Space), и он становится selected node. Перемещение фокуса стрелками выбор не меняет.
4. Я работаю с клавиатуры: стрелки (в RTL Left и Right меняются местами), Home и End, поиск по первым буквам, `*` раскрывает все ветки того же уровня.
5. Если ветка не смогла загрузить детей, я вижу ошибку в этом узле и могу повторить загрузку.
6. Как разработчик я привязываю дерево к контролу формы и получаю ключи: `K | null` в single и `K[]` в multiple.
7. Как разработчик я заранее заполняю значение ключами ещё не загруженных узлов, и дерево их сохраняет.
8. Как разработчик я восстанавливаю раскрытые ветки через `[(expanded)]` и могу вызвать `expandAll()` и `collapseAll()`.
9. Как разработчик я отключаю часть узлов: фокус на них переходит, но выбрать или отметить их нельзя, и каскад их не меняет.
10. Как разработчик я показываю узел простым текстом по умолчанию или своим шаблоном с иконками и бейджами.
11. Как разработчик я показываю состояние загрузки, пока данные идут, и текст пустого состояния, когда данных нет.

## Реализационные решения

### API

- Точка входа `tree`, селектор `ui-tree`. Наследует `UiFormControlBase` и сам предоставляет `NG_VALUE_ACCESSOR`, поэтому `disabled` и `readonly` приходят из базы.
- `data: T[]`: только вложенные узлы, без плоского входа и входа с уровнями.
- `childrenWith: (node) => T[] | undefined` (по умолчанию `node => node.children`). Он синхронный.
- `keyWith: (node) => K` (по умолчанию `node => node.id`); ключи служат также `trackBy` и `expansionKey` для CDK.
- `displayWith: (node) => string` для текста по умолчанию и необязательный `<ng-template uiTreeNode let-node>`, который заменяет содержимое подписи. Шеврон, отступ и checkbox всегда рисует кит.
- `selection: 'none' | 'single' | 'multiple'`.
- `disabledWith: (node) => boolean`.
- `expanded = model<K[]>()`, `expandAll()` и `collapseAll()`. `expandAll()` раскрывает только загруженные ветки и никогда не запускает загрузку.
- `loading: boolean` показывает skeleton-строки. При пустом `data` показывается текст пустого состояния из `UiLabels`, который можно заменить слотом.

### Ленивые ветки

- `loadChildren: (node) => Observable<T[]> | Promise<T[]>` и `hasChildrenWith: (node) => boolean`.
- Узел считается lazy branch, когда `hasChildrenWith` возвращает true, а `childrenWith` ничего не возвращает.
- `loadChildren` вызывается только при первом раскрытии, результат кешируется по ключу. Пока загрузка идёт, узел показывает spinner и `aria-busy`.
- При ошибке узел показывает текст ошибки и кнопку «Повторить» (новые записи `UiLabels` на иврите и английском). Повторное раскрытие тоже запускает загрузку заново.
- `*` раскрывает все ветки того же уровня, и ленивые начинают загружаться.

### Значение и каскад (multiple)

- Значение — ключи всех checked-узлов, включая ветки. Partially checked узел в значение никогда не попадает.
- Ветка checked, когда отмечены она сама и все её потомки. Её состояние считается только по загруженным узлам.
- Клик по ветке отмечает всех доступных потомков; если все доступные потомки уже отмечены, клик вместо этого снимает с них отметку. Это правило важнее состояния ветки: ветку, которая остаётся partially checked из-за отключённого неотмеченного потомка, клик снимает. (Что лежит под отключённой веткой — тикет 01.)
- Ключи, которым не соответствует ни один загруженный узел, остаются как есть, и дерево не раскрывается, чтобы их показать.
- Когда под checked-веткой загружаются дети, их ключи добавляются в значение через привязанный контрол, но контрол не становится dirty. Это идёт мимо `onChange`; контрол находится через `injectControlState()`. См. ADR 0001.

### Выбор (single)

- Клик по строке, Enter или Space выбирают этот узел; выбрать можно любой доступный узел. Выбор не следует за фокусом. Дерево использует `aria-selected`.

### Взаимодействие и доступность

- Клик по строке выбирает узел (single) или переключает checkbox (multiple). Раскрывают только шеврон и стрелки. При `selection="none"` клик по ветке её раскрывает.
- `role="tree"` / `treeitem` / `group`, `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded` на ветках, `aria-multiselectable` в режиме multiple. Состояния отметки передаются через `aria-checked` со значениями true, false или mixed.
- Roving tabindex через key manager CDK tree; кольцо фокуса показывается только при фокусе с клавиатуры.

### Внешний вид

- Без направляющих линий. Отступ уровня задаётся токеном (24px). Шеврон поворачивается при раскрытии и зеркалится в RTL.
- Hover охватывает всю строку, выбранный узел получает тонированный фон primary, как опция select. Поддерживаются light, dark и forced colors.

## Решения по тестированию

- Юнит-спеки покрывают рендер, inputs и outputs, каскад (включая отключённые узлы и неизвестные ключи), успешную загрузку, ошибку и повтор у ленивых веток, обновление значения без dirty при загрузке, клавиатуру в LTR и RTL, ARIA, Reactive forms (включая `formControlName`) и `ngModel`.
- Harness в `@vplans/ui-kit/testing`.
- Stories для single, multiple, ленивых веток, отключённых узлов, своего шаблона, загрузки, пустого состояния и RTL. Каждая проходит axe в 3 режимах и имеет визуальные базовые снимки; плюс play stories для раскрытого состояния и состояния загрузки.
- Секция в playground и полный `/phase-check`.

## Вне рамок

- Поиск и фильтрация внутри дерева: потребитель сам фильтрует `data`.
- Перестановка узлов через drag-and-drop, переименование прямо в дереве и виртуальный скролл.
- Плоские данные и данные с уровнями.
- Выбор, который следует за фокусом, и выбор диапазона с Shift.
- Автоматическое раскрытие пути к ключам из значения.

## Дополнительные замечания

- Все ответы из сессии вопросов переносятся в `docs/DECISIONS.md`, когда фаза будет сдаваться.
