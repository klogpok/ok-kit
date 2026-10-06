# 13: The library stops speaking Signal Forms

**What to build:** the last traces of Signal Forms leave the library. Binding a control with
`formControl`, `formControlName` or `ngModel` works exactly as it did; binding one with the Signal
Forms directive is simply no longer a thing the kit supports.

**Blocked by:** 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12

**Status:** done

- [x] The control-state helper loses its Signal Forms branch and keeps the reactive one, with the shape of its public interface unchanged
- [x] The shared base class for custom controls no longer injects or checks the Signal Forms field token
- [x] No file anywhere in the repository imports from the Signal Forms package
- [x] The full check passes: unit tests, lint, build, stories and visual baselines
- [x] Error display, disabled state, required marker and touched behaviour are observably unchanged for every control

## Comments

### 2026-10-05

`injectControlState()` is now the `NgControl` reader alone: the `FORM_FIELD` lookup and the branch
that mapped a field's `state()` and `errors()` into the returned signals are gone. `UiControlState`
keeps every member it had, so no caller changed. `UiFormControlBase` injects `NgControl` directly
instead of asking `FORM_FIELD` first and falling back; the class doc now explains that
`valueAccessor` is assigned by hand because a control injecting `NgControl` cannot provide
`NG_VALUE_ACCESSOR` without a circular dependency, which is the reason that survives the removal.
Neither `projects/` nor any other source file imports `@angular/forms/signals` any more.

A new `projects/ui-kit/core/control-state.spec.ts` pins the branch that stays, at the seam the kit
actually exposes: a probe directive on a native input, bound and unbound. It covers `bound`, the
all-false unbound state, the required validator, disable/enable, invalid and touched, string and
`message`-shaped errors, and validators added later - the case that needs `sync()` from `ngDoCheck`
because `setValidators()` emits no event. Nothing in it was possible only through Signal Forms, so
it is a characterisation of behaviour that must not move.

**The full check could not be run.** The shared `node_modules` of this workspace is broken: 1222
symlinks under `node_modules/.pnpm` point into `D:\projects\ui-kit-20-wt\t12`, a worktree that no
longer exists, so `ng`, `stylelint` and anything else resolving a transitive dependency dies with
`ERR_MODULE_NOT_FOUND`. This predates the change and affects every worktree. What could be run
without those links passes: `tsc -p projects/ui-kit/tsconfig.lib.json --noEmit` is clean,
`tsc -p projects/ui-kit/tsconfig.spec.json --noEmit` reports nothing beyond the pre-existing
jest-dom `.not` noise that tsc shows outside the Vitest config, and Prettier is clean. Unit tests,
lint, both builds, the story check and the visual check are still owed and need the environment
repaired first.

Left for ticket 20: the doc comments in roughly twenty component sources still advertise Signal
Forms (`Implements FormValueControl (Signal Forms)`, `<ui-checkbox [formField]="...">` examples, the
Storybook source snippet in `autocomplete.stories.ts`). They are stale documentation, not code, and
ticket 20 owns the forms story. `UI_FORM_FIELD` and `UI_FORM_FIELD_CONTROL` are the kit's own
tokens and are unrelated to Signal Forms; they stay.

### 2026-10-05 (merge into ng20-migration)

The environment is repaired and the full check was run on the merge of this branch into
`ng20-migration`, with no baseline updated: ui-kit unit tests 726 passed in 69 files, playground
unit tests 7 passed in 1 file, `ng lint` clean for both projects, stylelint clean over
`projects/**/*.scss`, both builds green, 263 stories checked in 3 modes with no accessibility
violations and no console errors, and 263 stories compared in 3 modes with no visual changes. No
`.png` differs from the pre-merge tip, so error display, disabled state, the required marker and
touched behaviour are observably unchanged for every control. Searching the repository's TypeScript
outside `node_modules` for the Signal Forms entry point returns nothing.

The new `control-state.spec.ts` passed all seven cases on its first real run; only lint had to be
fixed, in a separate commit: the probe directive took the `ui` selector prefix the workspace rule
requires, and the `providerTokens` filter lost an optional chain and a fallback that TypeScript
knows are never needed. No case was weakened, removed or skipped.

## Русский перевод

# 13: Библиотека перестаёт говорить на Signal Forms

**Что сделать:** из библиотеки уходят последние следы Signal Forms. Связывание контрола через
`formControl`, `formControlName` или `ngModel` работает ровно как работало; связывание через
директиву Signal Forms — просто больше не то, что кит поддерживает.

**Блокируется:** 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12

**Статус:** сделано

- [x] Помощник состояния контрола теряет ветку Signal Forms и сохраняет реактивную, форма публичного интерфейса не меняется
- [x] Общий базовый класс кастомных контролов больше не инжектит и не проверяет токен сигнального поля
- [x] Ни один файл в репозитории не импортирует из пакета Signal Forms
- [x] Полная проверка проходит: юнит-тесты, линт, сборка, стори и визуальные бейслайны
- [x] Отображение ошибок, disabled, маркер обязательности и поведение touched наблюдаемо не изменились ни у одного контрола

## Комментарии

### 2026-10-05

`injectControlState()` теперь только читатель `NgControl`: поиск `FORM_FIELD` и ветка, отображавшая
`state()` и `errors()` поля в возвращаемые сигналы, удалены. `UiControlState` сохраняет все свои
члены, так что ни один вызывающий код не изменился. `UiFormControlBase` инжектит `NgControl`
напрямую вместо того, чтобы сначала спрашивать `FORM_FIELD` и откатываться; док класса теперь
объясняет, что `valueAccessor` присваивается вручную, потому что контрол, инжектящий `NgControl`,
не может предоставить `NG_VALUE_ACCESSOR` без циклической зависимости — это та причина, которая
переживает удаление. Ни `projects/`, ни любой другой исходник больше не импортирует
`@angular/forms/signals`.

Новый `projects/ui-kit/core/control-state.spec.ts` закрепляет оставшуюся ветку на том шве, который
кит действительно предоставляет: директива-проба на нативном инпуте, связанная и несвязанная. Он
покрывает `bound`, полностью ложное несвязанное состояние, валидатор обязательности,
disable/enable, invalid и touched, ошибки-строки и ошибки с `message`, а также валидаторы,
добавленные позже — случай, которому нужен `sync()` из `ngDoCheck`, потому что `setValidators()` не
эмитит событие. Ничто в нём не было возможно только через Signal Forms, так что это характеризация
поведения, которое не должно сдвинуться.

**Полную проверку выполнить не удалось.** Общий `node_modules` этого воркспейса сломан: 1222
симлинка под `node_modules/.pnpm` указывают в `D:\projects\ui-kit-20-wt\t12` — ворктри, которого
больше нет, поэтому `ng`, `stylelint` и всё, что резолвит транзитивную зависимость, падает с
`ERR_MODULE_NOT_FOUND`. Это было до изменения и затрагивает все ворктри. То, что удалось запустить
без этих линков, проходит: `tsc -p projects/ui-kit/tsconfig.lib.json --noEmit` чист,
`tsc -p projects/ui-kit/tsconfig.spec.json --noEmit` не сообщает ничего сверх уже существующего
шума jest-dom про `.not`, который tsc показывает вне конфига Vitest, и Prettier чист. Юнит-тесты,
линт, обе сборки, проверка стори и визуальная проверка остаются за долгом и требуют сначала
починить окружение.

Оставлено тикету 20: док-комментарии примерно в двадцати исходниках компонентов всё ещё рекламируют
Signal Forms (`Implements FormValueControl (Signal Forms)`, примеры
`<ui-checkbox [formField]="...">`, сниппет исходника Storybook в `autocomplete.stories.ts`). Это
устаревшая документация, а не код, и историей форм владеет тикет 20. `UI_FORM_FIELD` и
`UI_FORM_FIELD_CONTROL` — собственные токены кита, к Signal Forms отношения не имеют и остаются.

### 2026-10-05 (слияние в ng20-migration)

Окружение починено, полная проверка прогнана на слиянии этой ветки в `ng20-migration`, ни один
бейзлайн не обновлялся: юнит-тесты ui-kit — 726 прошли в 69 файлах, юнит-тесты playground — 7
прошли в 1 файле, `ng lint` чист по обоим проектам, stylelint чист по `projects/**/*.scss`, обе
сборки зелёные, проверка стори — 263 стори в 3 режимах без нарушений доступности и без ошибок
консоли, визуальная проверка — 263 стори в 3 режимах без визуальных изменений. Ни один `.png` не
отличается от состояния до слияния, поэтому отображение ошибок, disabled, маркер обязательности и
поведение touched наблюдаемо не изменились ни у одного контрола. Поиск точки входа Signal Forms по
TypeScript репозитория вне `node_modules` не даёт совпадений.

Новый `control-state.spec.ts` прошёл все семь кейсов с первого настоящего запуска; чинить пришлось
только линт, отдельным коммитом: директива-проба получила префикс селектора `ui`, которого
требует правило воркспейса, а фильтр по `providerTokens` потерял опциональную цепочку и
подстановку, которые TypeScript считает ненужными. Ни один кейс не ослаблен, не удалён и не помечен
skip.
