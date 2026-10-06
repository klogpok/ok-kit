# 16: Linting works on the Angular 20 toolchain

**What to build:** the lint command runs again and enforces the same rules as before, on tooling
that supports Angular 20.

**Blocked by:** 15

**Status:** done

- [x] The linter and its Angular plugin are on the majors that support Angular 20
- [x] The lint command passes across the library, the playground and the stories
- [x] The rule set is equivalent to the one in force before the downgrade; any rule that no longer exists is replaced by its closest counterpart or its removal is recorded in the ticket
- [x] Style linting of the stylesheets still runs and passes
- [x] No source file is edited purely to silence a rule that was previously satisfied

## Русский перевод

# 16: Линт работает на тулчейне Angular 20

**Что сделать:** команда линта снова запускается и требует того же, что и раньше, на инструментах,
поддерживающих Angular 20.

**Блокируется:** 15

**Статус:** сделано

- [x] Линтер и его Angular-плагин на мажорах с поддержкой Angular 20
- [x] Команда линта проходит по библиотеке, playground и сторис
- [x] Набор правил эквивалентен действовавшему до даунгрейда; правило, которого больше нет, заменено ближайшим аналогом либо его удаление записано в тикете
- [x] Линт стилей по-прежнему запускается и проходит
- [x] Ни один исходный файл не правится только ради того, чтобы замолчать правило, которое раньше выполнялось

## Comments

### 2026-10-06 — lint is on the Angular 20 majors

**What moved.** `angular-eslint` and `@angular-eslint/builder` from 22.5.0 to **20.7.0**, the last
release of the Angular 20 line. It peers `eslint@^8.57.0 || ^9.0.0`, so `eslint` and `@eslint/js`
came down from 10.11.0 / 10.0.1 to **9.39.5**. `typescript-eslint` **stays on 8.69.0**:
angular-eslint 20 peers `^8.0.0` and 8.69.0 already peers `eslint@^8.57 || ^9 || ^10`, so the
`strictTypeChecked` and `stylisticTypeChecked` rule sets are bit-for-bit the ones that were in
force. `stylelint` 17.15.0 and `stylelint-config-standard-scss` 17 are untouched; they do not
depend on Angular. The major-mismatch notice is gone.

**How the rule set was compared.** `eslint --print-config` was captured for seven representative
files before and after the downgrade — a library component, a spec, a story, a playground entry,
a template, the `.mts` token script and `.storybook/main.ts` — and the enabled rules diffed. The
list of _rule names_ is identical in both directions inside the `@angular-eslint`,
`@typescript-eslint` and `@angular-eslint/template` namespaces: no Angular or TypeScript rule
disappeared and none appeared. Seven differences remain, all listed below.

**Rules lost from `eslint:recommended` and restored by hand.** ESLint 10 promoted three rules into
its recommended set that ESLint 9 ships but does not enable. They are now enabled explicitly in
`eslint.config.js`, so nothing got weaker, and none of them reports anything on the current
sources:

| rule                    | ESLint 10   | ESLint 9     | resolution          |
| ----------------------- | ----------- | ------------ | ------------------- |
| `no-unassigned-vars`    | recommended | ships, off   | `'error'` in config |
| `no-useless-assignment` | recommended | ships, off   | `'error'` in config |
| `preserve-caught-error` | recommended | ships, off   | `'error'` in config |

**Rule options that changed.**

- `no-shadow-restricted-names` — ESLint 10 defaults `reportGlobalThis` to `true`, ESLint 9 to
  `false`. Configured explicitly as `['error', { reportGlobalThis: true }]`.
- `preserve-caught-error` — ESLint 10 adds an `errorClassNames` option that ESLint 9 does not have.
  Its default is `[]`, so the rule behaves identically; nothing to restore.
- `no-constant-binary-expression` — ESLint 10 adds a `checkRelationalComparisons` option that
  ESLint 9 does not have. Its default is `false`, so the rule behaves identically; nothing to
  restore.
- `@angular-eslint/template/click-events-have-key-events` — v22 adds `requireKeyCode` and
  `allowedKeyCodes`, both defaulting to off. With defaults, v20 and v22 enforce exactly the same
  thing: a click handler needs a `keyup`, `keydown` or `keypress` next to it. The two options were
  not in use. Nothing to restore.
- `@angular-eslint/template/elements-content` — v22's default `allowList` includes `textContent`,
  v20's does not, so **v20 is the stricter of the two**. It was left at the v20 default rather than
  widened back, because widening it would be the one direction the ticket forbids. No template in
  the repository is affected.

**One rule changed meaning, and it is the interesting one.**
`@angular-eslint/prefer-on-push-component-change-detection` is the same name for two different
rules:

- **v22** — "components should not _opt out of_ the default OnPush". On Angular 22 OnPush is the
  default, so the rule only fires on an explicit `ChangeDetectionStrategy.Eager`/`.Default`, and
  its `allowExplicitOnPush` option (default `true`) decides whether a redundant explicit OnPush is
  reported.
- **v20** — "every component must _declare_ `changeDetection: ChangeDetectionStrategy.OnPush`". No
  options at all.

The v20 reading is the correct one for Angular 20, where an omitted `changeDetection` means eager
checking, and it is strictly stronger than what was in force. It was kept.

**The one source file that was touched, and why it is not silencing.**
`projects/ui-kit/dialog/dialog-container.ts` — `UiDialogContainerBase`, the abstract
`@Component({ template: '' })` shared by the dialog and drawer surfaces, declared no
`changeDetection`. That was correct on Angular 22 and is a real behaviour change on Angular 20:
the decorator now means eager checking, and Angular copies a base class's component metadata
verbatim into a subclass that carries no decorator of its own. The change detection strategy is
now declared there, as it is on every other component in the library. In other words the
downgraded rule caught a semantic drift that ticket 15's downgrade introduced; it did not complain
about code that was still correct. No other source file changed. The full suite is unchanged at
**729 passed / 69 files**, which includes the dialog, drawer and dialog-harness specs.

**Nothing else needed configuration.** Every rule named in `eslint.config.js` — including the ones
set to `off`, such as `@angular-eslint/no-host-metadata-property` and
`@angular-eslint/no-input-rename` — exists in the 20.7.0 plugins. `.storybook/main.ts` and
`.storybook/framework.d.ts` lint clean without a change: `@typescript-eslint/no-misused-spread` and
`no-unnecessary-condition` come from typescript-eslint 8, which did not move.

**Proof.** `pnpm lint` prints "All files pass linting" for both `ui-kit` and `playground` with no
version notice, and `stylelint "projects/**/*.scss"` exits 0. `pnpm install --force` resolves 1413
packages with **no unmet peer dependency**. `pnpm test` is 729 passed / 69 files, `pnpm build`
builds every entry point and `pnpm format:check` is clean.

**For ticket 20.** The three rules re-enabled by hand and the `reportGlobalThis` default are the
only places where the configuration now says out loud what ESLint 10 said implicitly; if ESLint
ever moves forward again they can go back to being inherited.

### 2026-10-06 — линт на мажорах под Angular 20

**Что переехало.** `angular-eslint` и `@angular-eslint/builder` с 22.5.0 на **20.7.0** — последний
релиз линии Angular 20. Он требует `eslint@^8.57.0 || ^9.0.0`, поэтому `eslint` и `@eslint/js`
опустились с 10.11.0 / 10.0.1 до **9.39.5**. `typescript-eslint` **остался на 8.69.0**:
angular-eslint 20 требует `^8.0.0`, а 8.69.0 уже объявляет `eslint@^8.57 || ^9 || ^10`, так что
наборы `strictTypeChecked` и `stylisticTypeChecked` остались ровно теми же. `stylelint` 17.15.0 и
`stylelint-config-standard-scss` 17 не тронуты — они не зависят от Angular. Уведомление о
несовпадении мажоров исчезло.

**Как сравнивался набор правил.** `eslint --print-config` снят для семи характерных файлов до и
после даунгрейда — компонент библиотеки, спек, стори, точка входа playground, шаблон, `.mts`-скрипт
токенов и `.storybook/main.ts` — и включённые правила сдиффены. Список _имён_ правил идентичен в обе
стороны в пространствах `@angular-eslint`, `@typescript-eslint` и `@angular-eslint/template`: ни
одно правило Angular или TypeScript не пропало и не появилось. Остаются семь различий, все
перечислены ниже.

**Правила, выпавшие из `eslint:recommended` и возвращённые руками.** ESLint 10 перевёл в свой
recommended три правила, которые ESLint 9 поставляет, но не включает. Теперь они включены явно в
`eslint.config.js`, так что набор не ослаб, и ни одно из них ничего не находит в текущих исходниках:

| правило                 | ESLint 10      | ESLint 9        | решение             |
| ----------------------- | -------------- | --------------- | ------------------- |
| `no-unassigned-vars`    | в recommended  | есть, выключено | `'error'` в конфиге |
| `no-useless-assignment` | в recommended  | есть, выключено | `'error'` в конфиге |
| `preserve-caught-error` | в recommended  | есть, выключено | `'error'` в конфиге |

**Изменившиеся опции правил.**

- `no-shadow-restricted-names` — в ESLint 10 `reportGlobalThis` по умолчанию `true`, в ESLint 9 —
  `false`. Прописано явно: `['error', { reportGlobalThis: true }]`.
- `preserve-caught-error` — в ESLint 10 добавлена опция `errorClassNames`, которой нет в 9. Её
  значение по умолчанию `[]`, поведение идентично; восстанавливать нечего.
- `no-constant-binary-expression` — в ESLint 10 добавлена опция `checkRelationalComparisons`,
  которой нет в 9. По умолчанию `false`, поведение идентично; восстанавливать нечего.
- `@angular-eslint/template/click-events-have-key-events` — в v22 добавлены `requireKeyCode` и
  `allowedKeyCodes`, обе выключены по умолчанию. На дефолтах v20 и v22 требуют ровно одного и того
  же: рядом с обработчиком клика нужен `keyup`, `keydown` или `keypress`. Опции не использовались.
  Восстанавливать нечего.
- `@angular-eslint/template/elements-content` — в дефолтный `allowList` v22 входит `textContent`, в
  v20 — нет, то есть **v20 строже**. Оставлено на дефолте v20, а не расширено обратно: расширение
  было бы ровно тем направлением, которое тикет запрещает. Ни один шаблон в репозитории это не
  задевает.

**Одно правило сменило смысл — и это самое интересное.**
`@angular-eslint/prefer-on-push-component-change-detection` — это одно имя для двух разных правил:

- **v22** — «компонент не должен _отказываться_ от OnPush по умолчанию». В Angular 22 OnPush —
  умолчание, поэтому правило срабатывает только на явный `ChangeDetectionStrategy.Eager`/`.Default`,
  а его опция `allowExplicitOnPush` (по умолчанию `true`) решает, ругаться ли на избыточный явный
  OnPush.
- **v20** — «каждый компонент обязан _объявить_ `changeDetection: ChangeDetectionStrategy.OnPush`».
  Опций нет вовсе.

Для Angular 20, где отсутствие `changeDetection` означает жадную проверку, верно именно прочтение
v20, и оно строго сильнее того, что действовало. Оставлено как есть.

**Единственный тронутый исходник и почему это не «замолчать правило».**
`projects/ui-kit/dialog/dialog-container.ts` — `UiDialogContainerBase`, абстрактный
`@Component({ template: '' })`, общий для поверхностей диалога и шторки, не объявлял
`changeDetection`. На Angular 22 это было правильно, а на Angular 20 это настоящее изменение
поведения: декоратор теперь означает жадную проверку, а Angular копирует метаданные компонента
базового класса в наследника, у которого нет собственного декоратора. Стратегия теперь объявлена —
так же, как у всех прочих компонентов библиотеки. Иначе говоря, понижённое правило поймало
смысловой сдвиг, внесённый даунгрейдом в тикете 15, а не пожаловалось на по-прежнему корректный
код. Других исходников не менялось. Полный прогон неизменен: **729 passed / 69 files**, включая
спеки диалога, шторки и dialog-harness.

**Больше ничего настраивать не пришлось.** Каждое правило, названное в `eslint.config.js` — включая
выключенные, такие как `@angular-eslint/no-host-metadata-property` и
`@angular-eslint/no-input-rename`, — существует в плагинах 20.7.0. `.storybook/main.ts` и
`.storybook/framework.d.ts` линтятся чисто без правок: `@typescript-eslint/no-misused-spread` и
`no-unnecessary-condition` приходят из typescript-eslint 8, который не двигался.

**Доказательство.** `pnpm lint` печатает «All files pass linting» для `ui-kit` и `playground` без
уведомления о версии, а `stylelint "projects/**/*.scss"` выходит с кодом 0. `pnpm install --force`
разрешает 1413 пакетов **без единой неудовлетворённой peer-зависимости**. `pnpm test` — 729 passed
/ 69 files, `pnpm build` собирает все точки входа, `pnpm format:check` чист.

**Для тикета 20.** Три возвращённых руками правила и дефолт `reportGlobalThis` — единственные
места, где конфигурация теперь проговаривает вслух то, что ESLint 10 подразумевал; если ESLint
когда-нибудь поедет вперёд, их можно снова сделать наследуемыми.
