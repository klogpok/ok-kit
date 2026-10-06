# 15: The library builds and tests on Angular 20

**What to build:** the working copy runs on the Angular version the consuming application runs on.
From this ticket onwards, anything that compiles here compiles there.

Angular, the CDK, TypeScript, the build package and the test runner move together because their
peer ranges leave no other order: the Angular 20 build package requires TypeScript below 6 and the
earlier major of the test runner.

**Blocked by:** 14

**Status:** done

- [x] Angular and the CDK are on 20.3, TypeScript on 5.8, the build and packaging tooling on their Angular 20 majors, and the test runner and bundler on the versions those require
- [x] No unmet peer dependency warnings remain on a clean install
- [x] The library builds and the whole unit test suite passes, with signature differences from the version change fixed rather than silenced
- [x] The accessibility and overlay APIs of the CDK, which the library uses most heavily, are checked against their Angular 20 signatures
- [x] The playground builds and runs
- [x] Nothing in the library's public API changes in this ticket

## Русский перевод

# 15: Библиотека собирается и тестируется на Angular 20

**Что сделать:** рабочая копия живёт на той же версии Angular, что и потребляющее приложение. С
этого тикета всё, что компилируется здесь, компилируется и там.

Angular, CDK, TypeScript, пакет сборки и тест-раннер двигаются вместе, потому что их peer-диапазоны
не оставляют другого порядка: пакет сборки Angular 20 требует TypeScript ниже 6 и предыдущий мажор
тест-раннера.

**Блокируется:** 14

**Статус:** сделано

- [x] Angular и CDK на 20.3, TypeScript на 5.8, инструменты сборки и упаковки на своих мажорах под Angular 20, тест-раннер и бандлер на версиях, которые они требуют
- [x] На чистой установке не остаётся предупреждений о неудовлетворённых peer-зависимостях
- [x] Библиотека собирается, весь набор юнит-тестов проходит, расхождения сигнатур от смены версии исправлены, а не заглушены
- [x] API доступности и оверлеев CDK, которые библиотека использует плотнее всего, сверены со своими сигнатурами в Angular 20
- [x] Playground собирается и запускается
- [x] Публичный API библиотеки в этом тикете не меняется

## Comments

### 2026-10-06 — the toolchain is on Angular 20

**What moved.** `@angular/{core,common,compiler,forms,platform-browser,router}` and
`@angular/{build,cli,compiler-cli}` to `^20.3.0` (resolved 20.3.33 / 20.3.38), `ng-packagr` to
`^20.3.0`, `typescript` to `~5.8.3` (the range `@angular/build@20.3` declares: `>=5.8 <6.0`),
`vitest` and `@vitest/coverage-v8` to `^3.2.0` (`@angular/build@20.3` peers `vitest@^3.1.1`),
`vite` to `^7.1.11` (the version `@angular/build` bundles), `@angular/animations` added at
`^20.3.0` so the auto-installed peer does not resolve to 22. `jsdom` stayed on `^30`: 26 was tried
and made the readonly radio tests fail, because `preventDefault()` on a radio click only reverts
the checked state in the newer jsdom.

**`@angular/cdk` is on `^20.2.0`, not 20.3.** The CDK's v20 line stops at 20.2.14; there is no
20.3 release of it. That matches the spec's own problem statement ("Angular 20.3 and CDK 20.2").

**Signature differences that had to be fixed.**

- TypeScript 5.8's `lib.dom` types `Node.textContent` as `string | null`, which 6.0 had narrowed
  away. Four library sources (`chip`, `select/option`, `breadcrumbs`, `table/sort`) and 31 spec and
  story files now handle the null instead of dereferencing it.
- `FocusOptions` in 5.8 has no `focusVisible`. `ui-slider` declares a `UiFocusOptions` that extends
  `FocusOptions` with it, rather than casting the call away.
- `ReturnType<typeof vi.spyOn>` resolves to Vitest 3's default `MockInstance` signature, which the
  `LiveAnnouncer.announce` spy does not fit. The three specs that hold such a spy name the method
  they wrap: `MockInstance<LiveAnnouncer['announce']>`.
- CDK 20.2's TestBed harnesses pass `view: window` into every keyboard, mouse and pointer event,
  and Vitest's jsdom environment exposes the Node global rather than a real `Window`, so jsdom
  rejected the init dictionary and 60 harness-driven tests threw. CDK 22 skips `view` under jsdom;
  `projects/ui-kit/test-setup/jsdom-event-view.ts` wraps the event constructors and substitutes the
  real `Window`, which Vitest publishes on its `jsdom` handle.
- `FormControlName` assigns its `control` only after `addControl()` has returned, while
  `setUpControl()` calls `registerOnChange` / `registerOnTouched` from inside that call. Both
  callbacks therefore saw `NgControl.control` undefined, and so did the component's own first
  `ngDoCheck`. Angular 22 picked the state up anyway; Angular 20 never re-checks a clean OnPush
  control, so the required marker and the control-derived error state stayed off for six controls.
  `UiFormControlBase` now also syncs in `ngAfterViewInit`, the way `UiTextControlBase` already did.
  This adds a lifecycle hook to an exported abstract class; no exported symbol, input, output or
  type changed.

**Toolchain configuration forced by the older builder.**

- `@angular/build:unit-test` on 20.3 requires `buildTarget`, `tsConfig` and `runner`, and knows
  `codeCoverageExclude` rather than `coverageExclude`. Both test targets in `angular.json` were
  rewritten accordingly and `test:coverage` now passes `--code-coverage`.
- **The coverage thresholds are gone.** The 20.3 builder has no threshold option, and it starts
  Vitest with `config: false`, so no `vitest.config.ts` can supply them either. The thresholds were
  not lowered; the tooling no longer offers them. This needs a decision before ticket 20 closes.
- Angular 20 is zone-based by default, so each project now hands the TestBed a `providersFile`
  with `provideZonelessChangeDetection()`, and the playground's `appConfig` provides it too. The
  library stays zoneless, as it was.
- Angular 20's TestBed refuses to create a component whose class metadata is still async, which is
  what `@defer` with `DeferBlockBehavior.Manual` makes of the playground's `App`. The playground
  spec declares `App` in the testing module and awaits `TestBed.compileComponents()`.

**CDK accessibility and overlay.** All 55 distinct CDK symbols the library imports exist in CDK
20.2 — 11 from `a11y` (`FocusKeyManager`, `FocusableOption`, `_IdGenerator`, `LiveAnnouncer`,
`CdkTrapFocus`, `FocusMonitor`, `InteractivityChecker`, `ActiveDescendantKeyManager`,
`Highlightable`, `InputModalityDetector`, `AriaDescriber`) and 9 from `overlay`, including the
functional factories `createOverlayRef`, `createFlexibleConnectedPositionStrategy`,
`createGlobalPositionStrategy` and `createRepositionScrollStrategy`. Their signatures are covered
by the build and the suite, which type-check every one of the 44 a11y and 12 overlay import sites
under `strict`, `strictTemplates` and `extendedDiagnostics: error`. None needed a change.

**Proof.** `pnpm build` builds all entry points, `pnpm test` is 729 passed / 69 files,
`pnpm test:playground` is 7 passed, `pnpm build:playground` succeeds and `pnpm start` serves a
playground that renders and reacts to input with no console errors. `pnpm lint` passes.

**Left for the next tickets.** The only unmet peers are `@storybook/angular-vite@10.6.0`'s, which
wants Angular 21 or newer, TypeScript 5.9 and Vite 8 — ticket 17. `build-storybook` nevertheless
still succeeds on Angular 20. `angular-eslint` 22 lints clean but prints a major-mismatch notice —
ticket 16.

### 2026-10-06 — тулчейна на Angular 20

**Что переехало.** `@angular/{core,common,compiler,forms,platform-browser,router}` и
`@angular/{build,cli,compiler-cli}` на `^20.3.0` (разрешились в 20.3.33 / 20.3.38), `ng-packagr` на
`^20.3.0`, `typescript` на `~5.8.3` (диапазон, который объявляет `@angular/build@20.3`:
`>=5.8 <6.0`), `vitest` и `@vitest/coverage-v8` на `^3.2.0` (`@angular/build@20.3` требует
`vitest@^3.1.1`), `vite` на `^7.1.11` (версия, которую пакет сборки везёт с собой),
`@angular/animations` добавлен как `^20.3.0`, чтобы автоустановленный peer не разрешался в 22.
`jsdom` остался на `^30`: версия 26 была опробована и ломала тесты readonly-радио, потому что
`preventDefault()` на клике по радио возвращает состояние checked только в новом jsdom.

**`@angular/cdk` на `^20.2.0`, а не 20.3.** Линия v20 у CDK заканчивается на 20.2.14; релиза 20.3 у
него нет. Это совпадает с постановкой проблемы в самой спеке («Angular 20.3 и CDK 20.2»).

**Расхождения сигнатур, которые пришлось исправить.**

- В `lib.dom` TypeScript 5.8 `Node.textContent` имеет тип `string | null`, который 6.0 сузил.
  Четыре исходника библиотеки (`chip`, `select/option`, `breadcrumbs`, `table/sort`) и 31 файл
  спеков и историй теперь обрабатывают null, а не разыменовывают его.
- В `FocusOptions` версии 5.8 нет `focusVisible`. `ui-slider` объявляет `UiFocusOptions`,
  расширяющий `FocusOptions` этим полем, вместо того чтобы заглушить вызов приведением типа.
- `ReturnType<typeof vi.spyOn>` разрешается в дефолтную сигнатуру `MockInstance` из Vitest 3, под
  которую шпион `LiveAnnouncer.announce` не подходит. Три спека с таким шпионом называют
  оборачиваемый метод: `MockInstance<LiveAnnouncer['announce']>`.
- Харнессы CDK 20.2 передают `view: window` в каждое клавиатурное, мышиное и указательное событие,
  а jsdom-окружение Vitest отдаёт глобальный объект Node, а не настоящий `Window`, поэтому jsdom
  отвергал словарь инициализации и 60 тестов через харнессы падали. CDK 22 пропускает `view` под
  jsdom; `projects/ui-kit/test-setup/jsdom-event-view.ts` оборачивает конструкторы событий и
  подставляет настоящий `Window`, который Vitest публикует в своей ручке `jsdom`.
- `FormControlName` присваивает свой `control` только после возврата из `addControl()`, а
  `setUpControl()` вызывает `registerOnChange` / `registerOnTouched` изнутри этого вызова. Оба
  колбэка видели `NgControl.control` как undefined — и первый `ngDoCheck` компонента тоже. Angular
  22 всё равно подхватывал состояние; Angular 20 не перепроверяет чистый OnPush-контрол, поэтому у
  шести контролов маркер обязательности и производное от контрола состояние ошибки не появлялись.
  `UiFormControlBase` теперь синхронизируется и в `ngAfterViewInit`, как уже делал
  `UiTextControlBase`. Это добавляет хук жизненного цикла в экспортируемый абстрактный класс; ни
  один экспортируемый символ, input, output или тип не изменился.

**Настройка тулчейны, вынужденная более старым билдером.**

- `@angular/build:unit-test` на 20.3 требует `buildTarget`, `tsConfig` и `runner` и знает
  `codeCoverageExclude`, а не `coverageExclude`. Обе цели тестов в `angular.json` переписаны
  соответственно, а `test:coverage` теперь передаёт `--code-coverage`.
- **Пороги покрытия исчезли.** У билдера 20.3 нет опции порогов, и он стартует Vitest с
  `config: false`, так что и `vitest.config.ts` их не подаст. Пороги не понижали — инструмент
  больше их не предлагает. Это требует решения до закрытия тикета 20.
- Angular 20 по умолчанию зонный, поэтому каждый проект теперь отдаёт TestBed `providersFile` с
  `provideZonelessChangeDetection()`, и `appConfig` playground тоже его предоставляет. Библиотека
  остаётся зонлесс, как и была.
- TestBed Angular 20 отказывается создавать компонент, метаданные класса которого всё ещё
  асинхронны, — а именно таким делает `App` playground `@defer` с `DeferBlockBehavior.Manual`. Спек
  playground объявляет `App` в тестовом модуле и ждёт `TestBed.compileComponents()`.

**Доступность и оверлеи CDK.** Все 55 различных символов CDK, которые импортирует библиотека, есть
в CDK 20.2 — 11 из `a11y` (`FocusKeyManager`, `FocusableOption`, `_IdGenerator`, `LiveAnnouncer`,
`CdkTrapFocus`, `FocusMonitor`, `InteractivityChecker`, `ActiveDescendantKeyManager`,
`Highlightable`, `InputModalityDetector`, `AriaDescriber`) и 9 из `overlay`, включая функциональные
фабрики `createOverlayRef`, `createFlexibleConnectedPositionStrategy`,
`createGlobalPositionStrategy` и `createRepositionScrollStrategy`. Их сигнатуры покрыты сборкой и
набором тестов, которые типизируют все 44 места импорта a11y и 12 мест импорта overlay под
`strict`, `strictTemplates` и `extendedDiagnostics: error`. Ни одно не потребовало правки.

**Доказательства.** `pnpm build` собирает все точки входа, `pnpm test` — 729 пройдено / 69 файлов,
`pnpm test:playground` — 7 пройдено, `pnpm build:playground` успешен, а `pnpm start` поднимает
playground, который отрисовывается и реагирует на ввод без ошибок в консоли. `pnpm lint` проходит.

**Осталось следующим тикетам.** Единственные неудовлетворённые peer-зависимости — у
`@storybook/angular-vite@10.6.0`, которому нужны Angular 21 или новее, TypeScript 5.9 и Vite 8, —
тикет 17. При этом `build-storybook` на Angular 20 всё равно собирается. `angular-eslint` 22 линтит
чисто, но печатает уведомление о несовпадении мажора — тикет 16.

### 2026-10-07 — the peer criterion is closed by ticket 17

The one open criterion above, "no unmet peer dependency warnings remain on a clean install", was
left for later because every warning still standing belonged to `@storybook/angular-vite`. Ticket 17
replaced it with `@storybook/angular`, and `pnpm install` has printed no unmet peer since (see
`17-storybook.md`). The criterion is ticked now that the migration is merged.

### 2026-10-07 — критерий о peer-зависимостях закрыт тикетом 17

Единственный открытый критерий выше — «на чистой установке не остаётся предупреждений о
неудовлетворённых peer-зависимостях» — был отложен, потому что все оставшиеся предупреждения
принадлежали `@storybook/angular-vite`. Тикет 17 заменил его на `@storybook/angular`, и с тех пор
`pnpm install` не печатает ни одной неудовлетворённой peer-зависимости (см. `17-storybook.md`).
Критерий отмечен после слияния миграции.
