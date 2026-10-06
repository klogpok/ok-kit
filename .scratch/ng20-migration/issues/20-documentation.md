# 20: The documentation tells the truth about forms

**What to build:** someone opening this repository for the first time, or an agent reading its
instructions before writing the next component, learns that reactive forms through the value
accessor are the forms story, and learns why Signal Forms is not.

**Blocked by:** 14, 17

**Status:** done

- [x] The decision log gains an entry recording that the Signal Forms decision is reversed, with the reason - the consuming application is on Angular 20 and Signal Forms does not exist there - without editing the original decision away
- [x] The roadmap carries the migration as a phase of its own, with what it delivered
- [x] The workspace instructions no longer present Signal Forms as the native forms path, and describe the value accessor path instead
- [x] The contribution guide's forms section, and its instructions for adding a component, match what the code now does
- [x] The area rules that mention Signal Forms are corrected
- [x] Every Angular version named in the documentation says 20

## Русский перевод

# 20: Документация говорит о формах правду

**Что сделать:** тот, кто впервые открывает этот репозиторий, и агент, читающий инструкции перед
написанием следующего компонента, узнаю́т, что история форм — это реактивные формы через value
accessor, и узнаю́т, почему это не Signal Forms.

**Блокируется:** 14, 17

**Статус:** сделано

- [x] В журнале решений появляется запись об отмене решения по Signal Forms с причиной — потребляющее приложение на Angular 20, где Signal Forms не существует, — без вытирания исходного решения
- [x] Роадмап содержит миграцию как отдельную фазу с описанием того, что она дала
- [x] Инструкции воркспейса больше не подают Signal Forms как нативный путь форм и описывают путь через value accessor
- [x] Раздел о формах в руководстве для контрибуторов и его инструкция по добавлению компонента соответствуют тому, что теперь делает код
- [x] Правила по областям, упоминающие Signal Forms, исправлены
- [x] Каждая версия Angular, названная в документации, — 20

## Comments

### 2026-10-06

**The decision log.** Two entries appended to `docs/DECISIONS.md`. The first records that the
phase 2 decision "form controls support Signal Forms natively" is **reversed** — the consuming
application is on Angular 20 and Signal Forms does not exist there — and states the contract that
replaced it (the `NG_VALUE_ACCESSOR` provider on each of the sixteen concrete controls, the lazy
`NgControl` resolution, `UiControlState.bound` as a signal, parse messages in `ownErrors()`,
`ui-stepper`'s `control` as an `AbstractControl`). The original decision is untouched: the log is
a history and the new entry supersedes it. The second entry records the toolchain (Angular 20.3,
CDK 20.2, TypeScript 5.8, Vitest 3, `angular-eslint` 20.7 with ESLint 9, Storybook on the webpack
framework) and the three consequences that are **open and need the user's decision**: coverage
thresholds are gone, Storybook HMR is off, and `@angular-eslint/template/elements-content` is
slightly stricter. They are written as facts, not as settled policy.

**The roadmap.** `docs/ROADMAP.md` gains "Миграция на Angular 20" as a phase of its own between
8.5 and the shared chapters, in Russian like the rest of the file: why, what it delivered, the
checks, and the same three open questions. Two forward-looking places were corrected — the forms
bullet of "Общие правила" (was "Signal Forms напрямую, CVA через `ngControl.valueAccessor`") and
step 2 of the per-phase check list. The `>` status blocks of phases 6–8 were left alone: they
record what was decided at the time.

**The workspace instructions.** `CLAUDE.md` now says Angular 20.3 with CDK 20.2 (pnpm is still 12,
verified in `package.json`), states that the consuming app pins the version and that Signal Forms
must not come back, and describes the value accessor path: the provider per control, the NG0200
rule about injecting `NgControl`, native inputs with `injectControlState()`. The status line adds
the migration phase. The root `README.md` says "Angular 20 workspace".

**The contribution guide.** `projects/ui-kit/README.md`: the forms table now lists each control's
value and how it registers instead of its Signal Forms contract; every example binds with
`formControlName`; the "required list" advice points at a validator (`uiAtLeastOne`) instead of
`minLength(path, 1)`; "Adding a component" step 6 shows both providers with `forwardRef` and warns
against injecting `NgControl` in the constructor; step 8 names reactive forms and `ngModel` with
the cases to cover; the installation note names Angular 20 and CDK 20.2; the scripts table no
longer claims that `pnpm test:coverage` fails below thresholds.

**The area rules.** `.claude/rules/forms.md` lost the `[formField]` gotchas and kept the ones that
still hold, plus a note that the limit inputs shaped by Signal Forms (`limits`, `minDate`/`maxDate`,
`minTime`/`maxTime`) stay as they are. `.claude/rules/testing.md` replaces "Angular 22 components
are OnPush by default" with Angular 20's behaviour and adds the zoneless `providersFile`, the jsdom
event shim and the loss of coverage thresholds. `.claude/rules/storybook.md` was already correct
(ticket 17). The `phase-check` skill says coverage no longer gates and that the workbench does not
hot-reload.

**Source doc comments.** Ticket 13 left the class documentation of sixteen files advertising
`FormValueControl`, `[formField]` and `minLength(path, 1)`. They now describe
`ControlValueAccessor`. Comments and one Storybook `docs.source.code` snippet only; no code
changed.

**Not touched, on purpose.** The `>` status blocks of the roadmap, the historical entries of
`DECISIONS.md` and `CHANGELOG.md`, and the body of `docs/SPEC.md` — the brief is kept verbatim by
its own preamble, which now says which two of its points were reversed. The changelog entry for the
breaking change belongs to ticket 19.

**No command was run.** The worktree has no `node_modules` and running pnpm from a worktree
corrupts the main repository's links, so lint, `format:check` and the builds are owed. The changes
are markdown plus TypeScript comments; the markdown tables were re-aligned by hand the way Prettier
aligns them, and Prettier does not reflow comment text.

### Русский перевод

**Журнал решений.** В `docs/DECISIONS.md` добавлены две записи. Первая фиксирует, что решение
фазы 2 «контролы форм поддерживают Signal Forms нативно» **отменено** — потребляющее приложение на
Angular 20, где Signal Forms не существует, — и описывает заменивший его контракт (провайдер
`NG_VALUE_ACCESSOR` на каждом из шестнадцати конкретных контролов, ленивое разрешение
`NgControl`, `UiControlState.bound` как сигнал, сообщения разбора в `ownErrors()`, `control` шага
степпера как `AbstractControl`). Исходное решение не тронуто: журнал — это история, новая запись
его перекрывает. Вторая запись фиксирует тулчейну (Angular 20.3, CDK 20.2, TypeScript 5.8,
Vitest 3, `angular-eslint` 20.7 с ESLint 9, Storybook на webpack-фреймворке) и три следствия,
которые **открыты и требуют решения пользователя**: пороги покрытия исчезли, HMR в Storybook
выключен, правило `@angular-eslint/template/elements-content` стало чуть строже. Они записаны как
факты, а не как принятая политика.

**Роадмап.** В `docs/ROADMAP.md` появилась «Миграция на Angular 20» — отдельная фаза между 8.5 и
общими главами, по-русски, как и весь файл: зачем, что дала, проверки и те же три открытых вопроса.
Исправлены два места, смотрящих вперёд: пункт про формконтролы в «Общих правилах» (было «Signal
Forms напрямую, CVA через `ngControl.valueAccessor`») и шаг 2 чеклиста проверок. Блоки статусов
фаз 6–8 (`>`) не тронуты: они фиксируют то, что решалось тогда.

**Инструкции воркспейса.** `CLAUDE.md` теперь называет Angular 20.3 и CDK 20.2 (pnpm по-прежнему
12, проверено в `package.json`), говорит, что версия задана потребляющим приложением и что Signal
Forms возвращать нельзя, и описывает путь через value accessor: провайдер на каждом контроле,
правило NG0200 про инжект `NgControl`, нативные поля через `injectControlState()`. В строке
статуса добавлена фаза миграции. В корневом `README.md` — «Angular 20 workspace».

**Руководство для контрибуторов.** `projects/ui-kit/README.md`: таблица форм перечисляет значение
контрола и способ регистрации вместо контракта Signal Forms; все примеры связываются через
`formControlName`; совет про обязательный список указывает на валидатор (`uiAtLeastOne`), а не на
`minLength(path, 1)`; шаг 6 «Adding a component» показывает оба провайдера с `forwardRef` и
предупреждает про инжект `NgControl` в конструкторе; шаг 8 называет реактивные формы и `ngModel` с
перечнем кейсов; в установке названы Angular 20 и CDK 20.2; таблица скриптов больше не утверждает,
что `pnpm test:coverage` падает ниже порогов.

**Правила по областям.** Из `.claude/rules/forms.md` ушли гочи про `[formField]`, остались
действующие, плюс заметка, что входы пределов, рождённые из-за Signal Forms (`limits`,
`minDate`/`maxDate`, `minTime`/`maxTime`), остаются как есть. В `.claude/rules/testing.md` пункт
«на Angular 22 компоненты OnPush по умолчанию» заменён поведением Angular 20 и добавлены зонлесс
`providersFile`, шим событий jsdom и исчезновение порогов покрытия. `.claude/rules/storybook.md`
уже был верен (тикет 17). В скилле `phase-check` сказано, что покрытие больше не гейт и что
витрина не перезагружается сама.

**Док-комментарии в исходниках.** Тикет 13 оставил документацию классов в шестнадцати файлах с
`FormValueControl`, `[formField]` и `minLength(path, 1)`. Теперь они описывают
`ControlValueAccessor`. Только комментарии и один сниппет `docs.source.code` Storybook; код не
менялся.

**Сознательно не тронуто.** Блоки статусов в роадмапе, исторические записи `DECISIONS.md` и
`CHANGELOG.md`, тело `docs/SPEC.md` — бриф хранится дословно, а его преамбула теперь называет два
пункта, которые отменены. Запись в чейнджлоге о ломающем изменении — за тикетом 19.

**Ни одна команда не запускалась.** В воркдереве нет `node_modules`, а запуск pnpm из воркдерева
ломает связи основного репозитория, поэтому lint, `format:check` и сборки остаются должны.
Изменения — это markdown и комментарии TypeScript; таблицы markdown выровнены руками так, как их
выравнивает Prettier, а текст комментариев Prettier не переносит.
