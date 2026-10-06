# 19: The package declares what it now supports

**What to build:** a consumer installing or inspecting the package sees that it targets Angular 20
and that its forms API is not the one from the previous version.

**Blocked by:** 15

**Status:** done

- [x] The package version is 0.2.0
- [x] The peer range names Angular 20 for every Angular package the library depends on, with the router staying optional
- [x] The package name is unchanged
- [x] The packaged output builds and its entry points resolve
- [x] The changelog records the breaking change to the forms API and the new Angular requirement

## Русский перевод

# 19: Пакет объявляет то, что теперь поддерживает

**Что сделать:** потребитель, который ставит или рассматривает пакет, видит, что тот нацелен на
Angular 20 и что его API форм — не тот, что в прошлой версии.

**Блокируется:** 15

**Статус:** сделано

- [x] Версия пакета 0.2.0
- [x] peer-диапазон называет Angular 20 для каждого Angular-пакета, от которого зависит библиотека, роутер остаётся опциональным
- [x] Имя пакета не изменилось
- [x] Упакованный вывод собирается, его точки входа разрешаются
- [x] В чейнджлоге записано ломающее изменение API форм и новое требование к Angular

## Comments

### 2026-10-06 — the package says Angular 20, 0.2.0, no Signal Forms

**The version lives in `projects/ui-kit/package.json`.** That is the file ng-packagr copies into
`dist/ui-kit`, so it is the one a consumer reads. The root `package.json` is `"name": "ui-kit"`,
`"version": "0.0.0"`, `"private": true` — the workspace, not the published package. It was not
touched.

**The peer ranges, and why each one.**

| peer                        | range     | why                                                                                                   |
| --------------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `@angular/common`           | `^20.3.0` | the version the library is built and tested against (20.3.33); 9 import sites                         |
| `@angular/core`             | `^20.3.0` | same; 151 import sites                                                                                |
| `@angular/cdk`              | `^20.2.0` | **not 20.3** — the CDK's v20 line stops at 20.2.14 and no 20.3 was ever released; resolves to 20.2.14 |
| `@angular/forms`            | `^20.3.0` | the whole forms contract; 51 import sites                                                             |
| `@angular/router`           | `^20.3.0` | 4 import sites (breadcrumbs, tabs); stays `optional: true` in `peerDependenciesMeta`                  |
| `@angular/platform-browser` | `^20.3.0` | 1 import site, still real, so it stays declared                                                       |
| `rxjs`                      | `^7.8.0`  | unchanged by the migration; resolves to 7.8.2                                                         |

`^20.3.0` rather than `^20.0.0` because the ticket asks for a range that reflects what actually
resolves: the whole suite, both builds and Storybook were verified on 20.3.33, and `^20.3.0` still
admits every later 20.x. The caret stops before 21, which is the point — Angular 21 and 22 are out
of scope by the spec.

**Proof, not assumption.** `pnpm build` is green and the emitted `dist/ui-kit/package.json` carries
`"version": "0.2.0"`, the ranges above verbatim, `peerDependenciesMeta.@angular/router.optional`,
and 41 `exports` keys (40 entry points plus `./package.json`). All 81 `types`/`default` targets
behind those keys exist on disk, and the `styles` assets are in place. A consumer was then built
outside the repository: `dist/ui-kit` copied into its `node_modules/@vplans/ui-kit`, with
`@angular`, `rxjs` and `tslib` linked from here.

- Runtime: `import.meta.resolve` resolves all 40 entry points, and importing
  `@vplans/ui-kit/button`, `/core` and `/stepper` yields `UiButton, UiIconButton`, a callable
  `injectControlState`, and `UiStep, UiStepper, UiStepperNext, UiStepperPrevious`.
  (`@angular/compiler` has to be imported first in plain Node: the package is partially compiled
  and nothing runs the Angular linker outside a build. That is normal and not a packaging fault.)
- Types: a `consume.ts` that star-imports all 40 entry points type-checks clean under
  TypeScript 5.8 with `strict`, `moduleResolution: bundler` and `skipLibCheck: false`.

`pnpm install --force` reinstalls 1413 packages and prints no unmet peer dependency. Note that this
is a single-package pnpm workspace — `pnpm-workspace.yaml` declares no `packages:` — so pnpm does
not validate the library's peers itself; they were checked against the installed tree with semver
and all seven are satisfied (20.3.33 / 20.2.14 / 7.8.2).

**The changelog.** `projects/ui-kit/CHANGELOG.md` already existed, so a
`## 0.2.0 - 2026-10-06 (Angular 20 migration)` section was added at the top in Keep a Changelog
shape, above the existing phase sections, with a lead paragraph saying it covers the migration
only. **Breaking:** Signal Forms removed entirely with `ControlValueAccessor` as the only contract
(listing the behaviour that is unchanged), `NG_VALUE_ACCESSOR` registration and what a subclassing
consumer must now declare, `injectControlState()` taking an `Injector` with `UiControlState.bound`
now a `Signal<boolean>`, the stepper's `control` narrowed to a reactive control, and parse errors
moving into the component's own error collection. **Changed:** the peer range, the unchanged
package name, the toolchain, the Storybook builder swap, and the coverage thresholds the Angular 20
builder no longer offers.

**For ticket 20.** Three things recorded in the changelog that the docs may want to carry: hot
module replacement in the Storybook dev server is off (ticket 17), coverage thresholds are no
longer enforceable (ticket 15, still owed a decision), and the consumer-facing migration note is
"`[field]` → `formControl` / `formControlName` / `ngModel`, and a custom subclass of
`UiFormControlBase` must provide `NG_VALUE_ACCESSOR` itself". The changelog is the only markdown
this ticket touched.

### Русский перевод

### 2026-10-06 — пакет объявляет Angular 20, 0.2.0 и отсутствие Signal Forms

**Версия лежит в `projects/ui-kit/package.json`.** Именно этот файл ng-packagr кладёт в
`dist/ui-kit`, его и читает потребитель. Корневой `package.json` — это `"name": "ui-kit"`,
`"version": "0.0.0"`, `"private": true`, то есть воркспейс, а не публикуемый пакет. Его не трогали.

**Peer-диапазоны и обоснование каждого.**

| peer                        | диапазон  | почему                                                                            |
| --------------------------- | --------- | --------------------------------------------------------------------------------- |
| `@angular/common`           | `^20.3.0` | версия, на которой библиотека собрана и протестирована (20.3.33); 9 мест импорта  |
| `@angular/core`             | `^20.3.0` | то же; 151 место импорта                                                          |
| `@angular/cdk`              | `^20.2.0` | **не 20.3** — ветка v20 у CDK заканчивается на 20.2.14, релиза 20.3 не существует |
| `@angular/forms`            | `^20.3.0` | весь контракт форм; 51 место импорта                                              |
| `@angular/router`           | `^20.3.0` | 4 места импорта (breadcrumbs, tabs); остаётся `optional: true`                    |
| `@angular/platform-browser` | `^20.3.0` | 1 место импорта, оно настоящее, поэтому зависимость остаётся объявленной          |
| `rxjs`                      | `^7.8.0`  | миграция его не касалась; разрешается в 7.8.2                                     |

`^20.3.0`, а не `^20.0.0`, потому что тикет просит диапазон, отражающий то, что реально
разрешается: весь набор проверок, обе сборки и Storybook проверены на 20.3.33, а `^20.3.0`
по-прежнему пускает любые более поздние 20.x. Карет останавливается перед 21 — это и нужно: Angular
21 и 22 вне рамок по спеке.

**Доказательства, а не допущения.** `pnpm build` зелёный, а в выпущенном
`dist/ui-kit/package.json` стоят `"version": "0.2.0"`, перечисленные выше диапазоны дословно,
`peerDependenciesMeta.@angular/router.optional` и 41 ключ `exports` (40 точек входа плюс
`./package.json`). Все 81 цель `types`/`default` за этими ключами существуют на диске, ассеты
`styles` на месте. Затем собран потребитель вне репозитория: `dist/ui-kit` скопирован в его
`node_modules/@vplans/ui-kit`, а `@angular`, `rxjs` и `tslib` подключены отсюда.

- Рантайм: `import.meta.resolve` разрешает все 40 точек входа, а импорт `@vplans/ui-kit/button`,
  `/core` и `/stepper` даёт `UiButton, UiIconButton`, вызываемый `injectControlState` и
  `UiStep, UiStepper, UiStepperNext, UiStepperPrevious`. (В голом Node сначала нужно импортировать
  `@angular/compiler`: пакет скомпилирован частично, а вне сборки линкер Angular никто не
  запускает. Это нормально и не дефект упаковки.)
- Типы: `consume.ts` со звёздочным импортом всех 40 точек входа проходит проверку типов под
  TypeScript 5.8 со `strict`, `moduleResolution: bundler` и `skipLibCheck: false`.

`pnpm install --force` переустанавливает 1413 пакетов и не печатает ни одной неудовлетворённой
peer-зависимости. Важно: это однопакетный воркспейс pnpm — в `pnpm-workspace.yaml` нет ключа
`packages:`, — поэтому peers библиотеки pnpm сам не проверяет; их сверили с установленным деревом
через semver, все семь удовлетворены (20.3.33 / 20.2.14 / 7.8.2).

**Чейнджлог.** `projects/ui-kit/CHANGELOG.md` уже существовал, поэтому наверх, над существующими
секциями фаз, добавлена секция `## 0.2.0 - 2026-10-06 (Angular 20 migration)` в духе Keep a
Changelog, с вводным абзацем о том, что она описывает только миграцию. **Breaking:** Signal Forms
удалены полностью, `ControlValueAccessor` — единственный контракт (с перечислением поведения,
которое не изменилось), регистрация через `NG_VALUE_ACCESSOR` и то, что обязан объявить
потребитель, наследующий базовый класс, `injectControlState()` с `Injector` и
`UiControlState.bound` как `Signal<boolean>`, сузившийся до реактивного контрола тип `control` у
степпера и переезд ошибок разбора в собственную коллекцию ошибок компонента. **Changed:**
peer-диапазон, неизменное имя пакета, тулчейна, смена билдера Storybook и пороги покрытия, которых
билдер Angular 20 больше не предлагает.

**Для тикета 20.** В чейнджлоге записаны три вещи, которые документации, возможно, стоит понести
дальше: hot module replacement в dev-сервере Storybook выключен (тикет 17), пороги покрытия больше
не обеспечиваются инструментом (тикет 15, решение ещё не принято) и памятка миграции для
потребителя — «`[field]` → `formControl` / `formControlName` / `ngModel`, а собственный наследник
`UiFormControlBase` обязан сам отдавать `NG_VALUE_ACCESSOR`». Больше никакого markdown этот тикет
не трогал.
