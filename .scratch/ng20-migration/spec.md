# Spec: migrate @vplans/ui-kit to Angular 20

Status: done

## Problem Statement

The design system is built on Angular 22.2 and treats Signal Forms as its native forms API. The
single application that consumes it runs on Angular 20 and will not be upgraded: the decision is
organisational, not technical. The application takes the library as copied source, so the library's
sources have to compile under the application's Angular 20 compiler.

Signal Forms does not exist in Angular 20. It was added as an experimental feature in Angular 21
and became public API in 22. Every other Angular and CDK symbol the library uses is present in
Angular 20.3 and CDK 20.2; this was verified by installing those versions and probing their type
declarations, so the gap is narrow and known.

Today the consumer therefore cannot use the library at all. Anyone copying the sources hits compile
errors in the forms layer, and there is nothing in the repository that would catch a newly
introduced Angular 21-or-22-only API before it reaches the application.

## Solution

Migrate the library to Angular 20 one way, in a clone of this repository, and archive the current
one. Work happens in two stages so that there is always something green to verify against:

1. **Remove Signal Forms while still on Angular 22.** The whole suite - unit tests, harnesses,
   Storybook, visual baselines, lint - keeps working throughout, so every commit is verifiable.
   Reactive forms through `ControlValueAccessor` become the only forms contract.
2. **Downgrade the toolchain to Angular 20.** Only after the sources are already free of 22-only
   APIs, so a failure at this stage is a toolchain failure and nothing else.

The consumer gets a library whose sources compile under Angular 20, whose forms work through
`formControl`, `formControlName` and `ngModel`, and whose rendered behaviour is unchanged.

## User Stories

1. As a developer of the consuming application, I want the library sources to compile under Angular 20, so that I can copy them into my project without touching them.
2. As a developer of the consuming application, I want every control to work with `formControl` and `formControlName`, so that I can bind them in the reactive forms I already use.
3. As a developer of the consuming application, I want every control to work with `ngModel`, so that template-driven forms in older screens keep working.
4. As a developer of the consuming application, I want disabled state to flow from the form control into the component, so that `control.disable()` visibly disables the control.
5. As a developer of the consuming application, I want validation errors from my validators to be displayed by the form field, so that I do not have to wire error rendering myself.
6. As a developer of the consuming application, I want the required marker to appear when my control carries a required validator, so that the form communicates what it needs.
7. As a developer of the consuming application, I want the error to appear only once the control is both invalid and touched, so that a pristine form does not shout at the user.
8. As a developer of the consuming application, I want `touched` to be set when the user leaves a control, so that my submit logic can rely on it.
9. As a developer of the consuming application, I want invalid typed input in the number, time and date controls to produce a visible message, so that the user understands why the value was rejected.
10. As a developer of the consuming application, I want a parse error in those controls not to pollute the form control's own validation errors, so that my validators stay in charge of validity.
11. As a developer of the consuming application, I want the stepper to accept a reactive form group per step, so that step completion reflects the real validity of that step.
12. As a developer of the consuming application, I want the library to declare a peer range that matches Angular 20, so that my package manager does not warn on every install.
13. As a developer of the consuming application, I want the library's version to change, so that it is obvious the forms API is not the one from the previous version.
14. As a maintainer of the design system, I want the migration to happen in a clone with full history, so that eight phases of decisions, the roadmap and the rules survive.
15. As a maintainer of the design system, I want the current Angular 22 state tagged before anything is touched, so that it can be recovered without archaeology.
16. As a maintainer of the design system, I want the forms work done before the toolchain downgrade, so that the test suite is available to verify each step.
17. As a maintainer of the design system, I want one commit per component, so that a regression can be traced to a single change.
18. As a maintainer of the design system, I want the removal of Signal Forms recorded as a reversed decision with its reason, so that nobody re-adds it without reading why it went.
19. As a maintainer of the design system, I want the roadmap to carry the migration as its own phase, so that it sits in the same history as the other phases.
20. As a maintainer of the design system, I want the contribution rules to stop describing Signal Forms, so that the next component is not written against an API that no longer exists.
21. As a maintainer of the design system, I want Storybook to keep working after the downgrade, so that the component workbench and the visual baselines are not lost.
22. As a maintainer of the design system, I want the visual baselines re-taken deliberately and reviewed, so that a rendering regression cannot slip in disguised as a tooling change.
23. As a maintainer of the design system, I want the library to stay zoneless after the downgrade, so that change detection behaves as it did before.
24. As a maintainer of the design system, I want the public API surface of each entry point to stay the same apart from the forms layer, so that the migration is not an excuse for unrelated redesign.
25. As a maintainer of the design system, I want unchanged test coverage of forms behaviour, so that the surviving contract is at least as well covered as the one being removed.
26. As an agent implementing a ticket, I want the ticket to name the component and the behaviour to preserve, so that I can work without reading the whole conversation.
27. As an agent implementing a ticket, I want the blocking edges declared, so that I never start a component before its base class is migrated.
28. As an agent implementing a ticket, I want existing test hosts to be the place where behaviour is asserted, so that I do not invent a new testing style per component.
29. As a reviewer, I want the diff of each component to show the removal of one forms path and nothing else, so that review is a reading task and not an investigation.
30. As a reviewer, I want to see that the reactive host in each spec gained the cases the signal host used to own, so that I can tell coverage did not quietly shrink.

## Implementation Decisions

### Repository and release

- The work happens in a clone of this repository at a sibling directory, keeping full git history,
  the decision log, the roadmap, the area rules, the token build and the visual baselines. The
  current repository is tagged `ng22-final` and archived; no further work lands in it.
- The package keeps the name `@vplans/ui-kit`. Its version moves to 0.2.0 and its peer range to
  Angular 20, which is a breaking change to the forms API expressed in the only place a consumer
  looks.
- Work proceeds on a branch, one commit per component, merged only when the full check passes.

### Forms layer

- Signal Forms is removed from the library entirely. It is not kept behind a separate entry point
  and it is not reimplemented as a local mini framework. `ControlValueAccessor` becomes the only
  forms contract; it is already implemented for every control.
- The `core` entry point keeps its control-state helper and its `UiControlState` interface. The
  helper currently has two branches - a Signal Forms branch and an `NgControl` branch - and only
  the first one is deleted. The shape of the interface is preserved apart from the change below.
- Custom controls register as value accessors through the `NG_VALUE_ACCESSOR` provider rather than
  by assigning to `NgControl.valueAccessor`. This matches the dominant pattern in Angular Material,
  which provides the token in ten of its modules and assigns the property in two.
- That switch forces a change in how the control reads its own form state. A component that
  provides `NG_VALUE_ACCESSOR` **and** injects `NgControl` in its constructor is a circular
  dependency. This was verified with a throwaway spec in the repository, which produced:

  ```
  NG0200: Circular dependency detected for ProbeA.
  Path: ProbeA -> unknown -> FormControlDirective -> InjectionToken NgValueAccessor -> ProbeA
  ```

  The same spec confirmed the resolution: keep the provider, and obtain `NgControl` lazily once the
  directive exists.

  ```ts
  // from the probe: provider stays, NgControl is resolved after construction
  private readonly injector = inject(Injector);
  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
  }
  ```

- Consequently the control-state helper stops injecting `NgControl` eagerly and takes an `Injector`
  instead, resolving the directive inside the `sync()` call that the interface already declares and
  that the base class already triggers from `registerOnTouched` and from its change-detection hook.
- `UiControlState.bound` stops being a plain boolean computed at construction time and becomes a
  signal, because the answer is not known until the directive has been resolved. This is the only
  change to the interface. Error display reads it.
- The `NG_VALUE_ACCESSOR` provider is declared on each concrete control, not on the shared base
  class: Angular does not inherit `providers` metadata into a subclass that carries its own
  decorator. Fifteen controls are affected. The base class remains the single implementation of the
  accessor methods.
- Native text inputs reach their form state through the same control-state helper but provide no
  accessor of their own, since Angular's default accessor already covers a native input. They are
  unaffected beyond the helper's internal change.
- The text-parsing controls - number, time, date and date range, and file upload - lose the Signal
  Forms transform that paired a raw text signal with a parse error. They replace it with a linked
  signal for the raw text and route the parse error into the component's own error collection,
  which the base class already merges into the displayed messages. A parse error therefore never
  reaches the consumer's form control and never makes the form invalid by itself.
- The stepper's step control type collapses from "a reactive control or a signal field" to a
  reactive control, and the branch that read validity out of a signal field is removed along with
  the type union.

### Toolchain

- The toolchain is downgraded only after the sources are free of Signal Forms: Angular and the CDK
  to 20.3, TypeScript to 5.8, the test runner to the version the Angular 20 build package requires,
  Vite accordingly, ESLint and its Angular plugin to their Angular 20-compatible majors, and the
  packaging tool to its matching major.
- Storybook stays on its current major. Only the builder changes: the Vite-based Angular framework
  package requires Angular 21 or newer and has no release that supports Angular 20, so the
  webpack-based Angular framework package is used instead, together with the Angular 20 webpack
  build package. The Analog Vite plugin is dropped.
- Zoneless rendering is preserved in Storybook through the webpack builder's own option for it,
  which exists for this purpose.
- Story files themselves are not rewritten; they are already in the format both builders consume.

### Documentation

- The decision log gains an entry recording that the Signal Forms decision is reversed, with the
  reason, rather than having the original decision edited away.
- The roadmap gains the migration as a phase of its own.
- The workspace instructions and the contribution rules are corrected where they describe Signal
  Forms as the native forms path.

## Testing Decisions

- A good test here asserts what a user of the control observes: what is rendered, what is
  announced, what the control is bound to, what the form control's value and state become after an
  interaction. It does not assert how the component obtained its form state, which directive it
  injected, or when it injected it. The migration changes exactly those internals, so a test that
  asserts them would have to be rewritten and would prove nothing.
- There is one seam and it already exists: the component harnesses published from the testing entry
  point, fourteen of them. Every behavioural assertion goes through a harness, plus the state of
  the form control owned by the test host. No new seam is introduced. In particular the
  control-state helper is not given its own unit tests: its lazy resolution is observable through
  the error, disabled and required behaviour of any control that uses it.
- Prior art is the existing spec layout, which is consistent across the library: each spec declares
  a standalone host, a reactive forms host and a Signal Forms host. The migration deletes the third
  and moves the cases it owned into the second. Seventeen specs carry a Signal Forms host;
  twenty-two test blocks are named after it, out of six hundred and eighty-seven across the library.
- The cases that must survive the move, per control: value in both directions, disabled from the
  control, readonly, required marker, touched on blur, error shown only when invalid and touched,
  error text taken from the validator, and submit behaviour where the control participates in it.
- Two existing nets stay in force and are not replaced: the visual baseline comparison over the
  built Storybook, and the playground application spec that renders every deferred section. The
  visual baselines are expected to need re-taking once after the Storybook builder changes; that
  re-take is its own commit and the images are reviewed by eye before it lands.
- Coverage thresholds configured for the library are not lowered to accommodate the migration.

## Out of Scope

- Upgrading the consuming application to Angular 21 or 22. That option was considered and rejected
  on organisational grounds.
- Supporting Angular 21 or 22 from the migrated library. The migration is one way and the peer
  range is Angular 20 only.
- Keeping any Signal Forms code behind a flag, an entry point or a compatibility shim.
- Building a local replacement for Signal Forms with the same shape.
- Phases 8.6 and 8.7 of the roadmap. They are deliberately deferred until after the migration so
  that no new component is written against an API that is being removed.
- Any redesign of component appearance, sizing, tokens or accessibility behaviour. Visual output is
  expected to be identical.
- Publishing the package to a registry. It continues to be consumed as copied source.
- Setting up a remote or an issue tracker for the clone.

## Further Notes

- The claim that Angular 20 contains everything else the library needs rests on checking that the
  symbols are present in the type declarations of Angular 20.3 and CDK 20.2, not on a full type
  check. Signature differences will surface during the toolchain stage. The heaviest exposure is
  the accessibility and overlay areas of the CDK, which the library imports in thirty-four and
  twelve places.
- The forms work is deliberately done on Angular 22 even though Angular 22 is not the target. This
  is not an oversight: it buys a working test suite, a working Storybook and working visual
  comparison for the stage that carries all the behavioural risk.
- The toolchain stage carries little behavioural risk but may be slow to converge, because each
  package in the chain constrains the next. The order that works is Angular first, then TypeScript,
  then the test runner, then lint, then Storybook.
- Storybook's webpack builder starts and rebuilds more slowly than the Vite one. This is a known
  and accepted cost of landing on Angular 20.

## Русский перевод

# Спека: миграция @vplans/ui-kit на Angular 20

Статус: сделано

## Постановка проблемы

Дизайн-система построена на Angular 22.2 и считает Signal Forms своим нативным API форм.
Единственное приложение, которое её потребляет, работает на Angular 20 и обновлено не будет:
решение организационное, а не техническое. Приложение берёт библиотеку копированием исходников,
поэтому исходники обязаны компилироваться компилятором Angular 20 этого приложения.

В Angular 20 Signal Forms не существует. Они появились как экспериментальная возможность в
Angular 21 и стали публичным API в 22. Все остальные символы Angular и CDK, которые использует
библиотека, присутствуют в Angular 20.3 и CDK 20.2 — это проверено установкой этих версий и
просмотром их деклараций типов, так что разрыв узкий и известный.

Сегодня потребитель не может использовать библиотеку вообще. Любой, кто скопирует исходники,
упрётся в ошибки компиляции в слое форм, и в репозитории нет ничего, что поймало бы вновь
добавленный API из Angular 21 или 22 до того, как он доедет до приложения.

## Решение

Мигрировать библиотеку на Angular 20 односторонне, в клоне этого репозитория, а текущий
репозиторий заархивировать. Работа идёт в два этапа, чтобы всегда было на чём проверяться:

1. **Выпил Signal Forms, оставаясь на Angular 22.** Весь набор проверок — юнит-тесты, харнессы,
   Storybook, визуальные бейслайны, линт — работает всю дорогу, поэтому каждый коммит проверяем.
   Реактивные формы через `ControlValueAccessor` становятся единственным контрактом форм.
2. **Даунгрейд тулчейны до Angular 20.** Только после того, как исходники уже свободны от API,
   доступных лишь в 22, — тогда провал на этом этапе означает проблему тулчейны и ничего больше.

Потребитель получает библиотеку, исходники которой компилируются под Angular 20, формы которой
работают через `formControl`, `formControlName` и `ngModel`, а отрисовка не изменилась.

## Пользовательские истории

1. Как разработчик потребляющего приложения, я хочу, чтобы исходники библиотеки компилировались под Angular 20, чтобы копировать их к себе без правок.
2. Как разработчик потребляющего приложения, я хочу, чтобы каждый контрол работал с `formControl` и `formControlName`, чтобы связывать их в реактивных формах, которые у меня уже есть.
3. Как разработчик потребляющего приложения, я хочу, чтобы каждый контрол работал с `ngModel`, чтобы шаблонные формы на старых экранах продолжали работать.
4. Как разработчик потребляющего приложения, я хочу, чтобы состояние disabled приходило из контрола формы в компонент, чтобы `control.disable()` видимо отключал контрол.
5. Как разработчик потребляющего приложения, я хочу, чтобы ошибки валидации от моих валидаторов отображались полем формы, чтобы не разводить отображение ошибок руками.
6. Как разработчик потребляющего приложения, я хочу, чтобы маркер обязательности появлялся, когда у контрола есть валидатор required, чтобы форма сообщала, что ей нужно.
7. Как разработчик потребляющего приложения, я хочу, чтобы ошибка появлялась только когда контрол одновременно невалиден и тронут, чтобы нетронутая форма не кричала на пользователя.
8. Как разработчик потребляющего приложения, я хочу, чтобы `touched` выставлялся при уходе пользователя с контрола, чтобы логика отправки могла на это опираться.
9. Как разработчик потребляющего приложения, я хочу, чтобы невалидный ввод в числовом, временно́м и датных контролах давал видимое сообщение, чтобы пользователь понимал, почему значение отвергнуто.
10. Как разработчик потребляющего приложения, я хочу, чтобы ошибка парсинга в этих контролах не загрязняла собственные ошибки валидации контрола формы, чтобы валидность оставалась за моими валидаторами.
11. Как разработчик потребляющего приложения, я хочу, чтобы степпер принимал реактивную группу формы на шаг, чтобы завершённость шага отражала его настоящую валидность.
12. Как разработчик потребляющего приложения, я хочу, чтобы библиотека объявляла peer-диапазон, соответствующий Angular 20, чтобы пакетный менеджер не ругался при каждой установке.
13. Как разработчик потребляющего приложения, я хочу, чтобы версия библиотеки изменилась, чтобы было очевидно: API форм не тот, что в прошлой версии.
14. Как сопровождающий дизайн-системы, я хочу, чтобы миграция происходила в клоне с полной историей, чтобы восемь фаз решений, роадмап и правила уцелели.
15. Как сопровождающий дизайн-системы, я хочу, чтобы текущее состояние на Angular 22 было помечено тегом до любых правок, чтобы его можно было вернуть без археологии.
16. Как сопровождающий дизайн-системы, я хочу, чтобы работа по формам шла до даунгрейда тулчейны, чтобы на каждом шаге был доступен набор тестов.
17. Как сопровождающий дизайн-системы, я хочу по одному коммиту на компонент, чтобы регрессию можно было свести к одному изменению.
18. Как сопровождающий дизайн-системы, я хочу, чтобы отмена решения о Signal Forms была записана вместе с причиной, чтобы никто не вернул их, не прочитав, почему они ушли.
19. Как сопровождающий дизайн-системы, я хочу, чтобы роадмап содержал миграцию как отдельную фазу, чтобы она лежала в той же истории, что и остальные фазы.
20. Как сопровождающий дизайн-системы, я хочу, чтобы правила контрибуции перестали описывать Signal Forms, чтобы следующий компонент не писался под API, которого больше нет.
21. Как сопровождающий дизайн-системы, я хочу, чтобы Storybook продолжал работать после даунгрейда, чтобы не потерять витрину компонентов и визуальные бейслайны.
22. Как сопровождающий дизайн-системы, я хочу, чтобы визуальные бейслайны были пересняты осознанно и просмотрены, чтобы регрессия отрисовки не проскочила под видом смены инструмента.
23. Как сопровождающий дизайн-системы, я хочу, чтобы библиотека осталась зонлесс после даунгрейда, чтобы обнаружение изменений вело себя как прежде.
24. Как сопровождающий дизайн-системы, я хочу, чтобы публичная поверхность каждой точки входа осталась прежней, кроме слоя форм, чтобы миграция не стала поводом для посторонней переделки.
25. Как сопровождающий дизайн-системы, я хочу, чтобы покрытие поведения форм тестами не уменьшилось, чтобы выживший контракт был покрыт не хуже удаляемого.
26. Как агент, выполняющий тикет, я хочу, чтобы тикет называл компонент и сохраняемое поведение, чтобы работать без чтения всего обсуждения.
27. Как агент, выполняющий тикет, я хочу, чтобы блокирующие рёбра были объявлены, чтобы никогда не начинать компонент раньше его базового класса.
28. Как агент, выполняющий тикет, я хочу, чтобы поведение утверждалось в уже существующих тестовых хостах, чтобы не изобретать новый стиль тестирования на каждый компонент.
29. Как ревьюер, я хочу, чтобы диф каждого компонента показывал удаление одного пути форм и больше ничего, чтобы ревью было чтением, а не расследованием.
30. Как ревьюер, я хочу видеть, что реактивный хост в каждом спеке получил кейсы, которыми владел сигнальный, чтобы убедиться: покрытие не ужалось втихую.

## Реализационные решения

### Репозиторий и релиз

- Работа идёт в клоне этого репозитория в соседнем каталоге, с сохранением полной истории git,
  журнала решений, роадмапа, правил по областям, сборки токенов и визуальных бейслайнов. Текущий
  репозиторий помечается тегом `ng22-final` и архивируется; в него больше ничего не приземляется.
- Пакет сохраняет имя `@vplans/ui-kit`. Версия переходит в 0.2.0, peer-диапазон — Angular 20; это
  ломающее изменение API форм, выраженное в единственном месте, куда смотрит потребитель.
- Работа ведётся в ветке, по коммиту на компонент, слияние — только при зелёной полной проверке.

### Слой форм

- Signal Forms удаляются из библиотеки полностью. Их не прячут в отдельную точку входа и не
  переписывают в виде локального мини-фреймворка. `ControlValueAccessor` становится единственным
  контрактом форм; он уже реализован для каждого контрола.
- Точка входа `core` сохраняет свой помощник состояния контрола и интерфейс `UiControlState`.
  Сейчас у помощника две ветки — для Signal Forms и для `NgControl` — и удаляется только первая.
  Форма интерфейса сохраняется, кроме изменения ниже.
- Кастомные контролы регистрируются как value accessor через провайдер `NG_VALUE_ACCESSOR`, а не
  присваиванием в `NgControl.valueAccessor`. Это соответствует доминирующему паттерну Angular
  Material, который отдаёт токен в десяти своих модулях и присваивает свойство в двух.
- Эта смена вынуждает изменить то, как контрол читает собственное состояние формы. Компонент,
  который одновременно отдаёт `NG_VALUE_ACCESSOR` **и** инжектит `NgControl` в конструкторе, даёт
  циклическую зависимость. Проверено одноразовым спеком в репозитории, который выдал:

  ```
  NG0200: Circular dependency detected for ProbeA.
  Path: ProbeA -> unknown -> FormControlDirective -> InjectionToken NgValueAccessor -> ProbeA
  ```

  Тот же спек подтвердил выход: провайдер остаётся, а `NgControl` достаётся лениво, когда
  директива уже существует.

  ```ts
  // из пробы: провайдер остаётся, NgControl разрешается после конструирования
  private readonly injector = inject(Injector);
  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
  }
  ```

- Соответственно помощник состояния контрола перестаёт инжектить `NgControl` сразу и принимает
  `Injector`, разрешая директиву внутри вызова `sync()`, который уже объявлен в интерфейсе и уже
  вызывается базовым классом из `registerOnTouched` и из хука обнаружения изменений.
- `UiControlState.bound` перестаёт быть обычным булевым значением, вычисленным при конструировании,
  и становится сигналом, потому что ответ неизвестен, пока директива не разрешена. Это единственное
  изменение интерфейса. Его читает отображение ошибки.
- Провайдер `NG_VALUE_ACCESSOR` объявляется в каждом конкретном контроле, а не в общем базовом
  классе: Angular не наследует метаданные `providers` в наследника с собственным декоратором.
  Затронуто пятнадцать контролов. Базовый класс остаётся единственной реализацией методов accessor.
- Нативные текстовые поля получают состояние формы через того же помощника, но своего accessor не
  предоставляют, поскольку нативное поле уже покрыто стандартным accessor Angular. Их изменение
  помощника не затрагивает сверх внутреннего.
- Контролы с разбором текста — числовой, временно́й, датный и диапазон дат, а также загрузка
  файлов — теряют трансформ Signal Forms, который связывал сигнал сырого текста с ошибкой разбора.
  Его заменяет связанный сигнал для сырого текста, а ошибка разбора уходит в собственную коллекцию
  ошибок компонента, которую базовый класс уже сливает в отображаемые сообщения. Таким образом
  ошибка разбора никогда не доходит до контрола формы потребителя и сама по себе не делает форму
  невалидной.
- Тип контрола шага у степпера схлопывается с «реактивный контрол или сигнальное поле» до
  реактивного контрола, а ветка, читавшая валидность из сигнального поля, удаляется вместе с
  объединением типов.

### Тулчейна

- Тулчейна понижается только после того, как исходники свободны от Signal Forms: Angular и CDK до
  20.3, TypeScript до 5.8, тест-раннер до версии, которую требует пакет сборки Angular 20, Vite
  соответственно, ESLint и его Angular-плагин до мажоров, совместимых с Angular 20, и пакет
  упаковки до соответствующего мажора.
- Storybook остаётся на текущем мажоре. Меняется только билдер: пакет Angular-фреймворка на Vite
  требует Angular 21 или новее и не имеет ни одного релиза с поддержкой Angular 20, поэтому
  используется webpack-овый пакет Angular-фреймворка вместе с webpack-пакетом сборки Angular 20.
  Vite-плагин Analog убирается.
- Зонлесс-режим в Storybook сохраняется через собственную опцию webpack-билдера, существующую
  именно для этого.
- Сами файлы историй не переписываются: они уже в формате, который понимают оба билдера.

### Документация

- В журнал решений добавляется запись о том, что решение по Signal Forms отменено, с причиной, —
  вместо того чтобы вытереть исходное решение.
- В роадмап добавляется миграция как отдельная фаза.
- Инструкции воркспейса и правила контрибуции правятся там, где описывают Signal Forms как
  нативный путь форм.

## Решения по тестированию

- Хороший тест здесь утверждает то, что наблюдает пользователь контрола: что отрисовано, что
  объявлено ассистивным технологиям, с чем связан контрол, какими становятся значение и состояние
  контрола формы после взаимодействия. Он не утверждает, как компонент получил состояние формы,
  какую директиву он инжектил и когда. Миграция меняет ровно эти внутренности, поэтому тест,
  утверждающий их, пришлось бы переписать, и он ничего бы не доказал.
- Шов один и он уже существует: харнессы компонентов, публикуемые из точки входа тестирования,
  четырнадцать штук. Любое утверждение о поведении идёт через харнесс плюс состояние контрола
  формы, которым владеет тестовый хост. Новый шов не вводится. В частности, помощник состояния
  контрола не получает собственных юнит-тестов: его ленивое разрешение наблюдаемо через поведение
  ошибки, disabled и required у любого контрола, который им пользуется.
- Прецедент — существующая раскладка спеков, одинаковая по всей библиотеке: в каждом спеке
  объявлены автономный хост, хост реактивных форм и хост Signal Forms. Миграция удаляет третий и
  переносит его кейсы во второй. Хост Signal Forms есть в семнадцати спеках; двадцать два тестовых
  блока названы по нему, из шестисот восьмидесяти семи по всей библиотеке.
- Кейсы, обязанные пережить перенос, на каждый контрол: значение в обе стороны, disabled от
  контрола, readonly, маркер обязательности, touched по уходу фокуса, показ ошибки только при
  «невалиден и тронут», текст ошибки из валидатора и поведение при отправке там, где контрол в ней
  участвует.
- Две существующие сетки остаются в силе и ничем не заменяются: сравнение визуальных бейслайнов по
  собранному Storybook и спек приложения-playground, который рендерит все отложенные секции.
  Ожидается, что бейслайны придётся переснять один раз после смены билдера Storybook; эта
  пересъёмка — отдельный коммит, и картинки просматриваются глазами до того, как он ляжет.
- Пороги покрытия, настроенные для библиотеки, ради миграции не понижаются.

## Вне рамок

- Обновление потребляющего приложения до Angular 21 или 22. Вариант рассмотрен и отклонён по
  организационным причинам.
- Поддержка Angular 21 или 22 из мигрированной библиотеки. Миграция односторонняя, peer-диапазон —
  только Angular 20.
- Сохранение какого-либо кода Signal Forms за флагом, точкой входа или слоем совместимости.
- Построение локальной замены Signal Forms с той же формой.
- Фазы 8.6 и 8.7 роадмапа. Они сознательно отложены до окончания миграции, чтобы ни один новый
  компонент не писался под удаляемый API.
- Любая переделка внешнего вида компонентов, размеров, токенов или поведения доступности.
  Визуальный результат ожидается идентичным.
- Публикация пакета в реестр. Он по-прежнему потребляется копированием исходников.
- Настройка remote или трекера задач для клона.

## Дополнительные замечания

- Утверждение, что в Angular 20 есть всё остальное, что нужно библиотеке, опирается на проверку
  наличия символов в декларациях типов Angular 20.3 и CDK 20.2, а не на полный typecheck.
  Расхождения сигнатур всплывут на этапе тулчейны. Наибольший риск — области доступности и
  оверлеев CDK, которые библиотека импортирует в тридцати четырёх и двенадцати местах.
- Работа по формам сознательно делается на Angular 22, хотя Angular 22 не является целью. Это не
  недосмотр: так мы получаем рабочий набор тестов, рабочий Storybook и рабочее визуальное
  сравнение на том этапе, где сосредоточен весь поведенческий риск.
- Этап тулчейны несёт мало поведенческого риска, но может долго сходиться, потому что каждый пакет
  в цепочке ограничивает следующий. Рабочий порядок: сначала Angular, затем TypeScript, затем
  тест-раннер, затем линт, затем Storybook.
- Webpack-билдер Storybook стартует и пересобирается медленнее, чем Vite. Это известная и принятая
  цена приземления на Angular 20.
