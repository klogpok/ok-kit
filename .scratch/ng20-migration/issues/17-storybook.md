# 17: The component workbench runs on Angular 20

**What to build:** Storybook starts, every story renders, and the documentation addon and the
accessibility addon work, on an Angular 20 workspace. The Vite-based Angular framework package has
no release that supports Angular 20, so the workbench moves to the webpack-based one.

**Blocked by:** 15

**Status:** done, waiting for the user’s review

- [x] Storybook stays on its current major and switches to the webpack-based Angular framework package, with the Angular 20 webpack build package added
- [x] The Vite-based framework package and the Analog Vite plugin are removed
- [x] Zoneless change detection is preserved through the webpack builder's option for it, and no zone library is pulled back into the application
- [x] Storybook starts in development and builds for production
- [x] Every story renders, with the documentation and accessibility addons working
- [x] The story files themselves are not rewritten
- [x] The story check command passes

## Русский перевод

# 17: Витрина компонентов работает на Angular 20

**Что сделать:** Storybook стартует, все стори рендерятся, аддоны документации и доступности
работают — на воркспейсе Angular 20. У пакета Angular-фреймворка на Vite нет ни одного релиза с
поддержкой Angular 20, поэтому витрина переезжает на webpack-овый.

**Блокируется:** 15

**Статус:** сделано, ждёт ревью пользователя

- [x] Storybook остаётся на текущем мажоре и переходит на webpack-овый пакет Angular-фреймворка, добавляется webpack-пакет сборки Angular 20
- [x] Vite-пакет фреймворка и Vite-плагин Analog удалены
- [x] Зонлесс-режим сохранён через опцию webpack-билдера, библиотека зон обратно в приложение не затягивается
- [x] Storybook стартует в разработке и собирается для продакшена
- [x] Все стори рендерятся, аддоны документации и доступности работают
- [x] Сами файлы сторис не переписываются
- [x] Команда проверки сторис проходит

## Comments

### 2026-10-06 — the workbench is on the webpack framework

**The swap.** `@storybook/angular-vite@10.6.0` out, `@storybook/angular@10.6.0` in, together with
`@angular-devkit/build-angular@^20.3.0`, which it needs to build the Angular webpack configuration,
and `@angular/platform-browser-dynamic`, `@angular-devkit/core` and `@angular-devkit/architect` at
the matching Angular 20 versions, which are its other required peers.
`@analogjs/vite-plugin-angular` and its `minimumReleaseAgeExclude` entry are gone. Storybook itself
stays on 10.6.0.

**The peer warnings are clean.** `pnpm install` prints no unmet peer dependency at all; the ten that
ticket 15 left behind were all owned by `@storybook/angular-vite`. `zone.js` is an optional peer of
`@storybook/angular` and is still not installed.

**Zoneless.** Both builders carry `experimentalZoneless: true`. The builder reads it twice: it skips
`cliConfig.entry.polyfills.push("zone.js")` and it unshifts `provideZonelessChangeDetection()` into
the providers of every story's `bootstrapApplication`. The built preview contains no zone library —
no `Zone.__load_patch`, no `ZoneAwarePromise` — and the only `zone.js` strings in it are
`@angular/core`'s own (`getNgZone("zone.js")`, the task-tracking hint).

**The story files are untouched.** They still import `@storybook/angular-vite`. The name is mapped
to `@storybook/angular` for TypeScript by `.storybook/framework.d.ts` and for the bundler by an
alias in `main.ts`. The TypeScript side cannot be a `paths` entry: the builder feeds the tsconfig to
`tsconfig-paths-webpack-plugin`, which resolves earlier than the alias and handed webpack
`dist/index.d.ts`, so every story died with
`TypeError: (0 , index_d.moduleMetadata) is not a function`.

**Three things the webpack builder forced.**

- `compodoc: false` on both builders. It defaults to true and compodoc is not installed.
- `browserTarget` on the dev builder. Its schema gives the option no default, and the framework
  throws `SB_FRAMEWORK_ANGULAR_0001 (AngularLegacyBuildOptionsError)` when it is undefined; the
  build builder defaults it to `null` and so never did. It points at `ui-kit:build-storybook`,
  whose options are the same styles and tsconfig, rather than at the playground application.
- **Hot module replacement is off**, removed from the preview compilation in `main.ts`. With it on,
  the preview never rendered: the hot middleware reported a compilation hash that the served bundle
  did not have, so the HMR client asked for `runtime_main.<hash>.hot-update.json`, got a 404, and
  full-reloaded in a loop. The dev server still rebuilds on change; the page has to be refreshed by
  hand. This is a cost of the builder swap and the user may want to revisit it.

**Proof.** `pnpm build-storybook` succeeds. `pnpm test-storybook` is 263 stories in 3 modes with no
accessibility violations and no console errors. `pnpm test-visual` is 263 stories in 3 modes with
**no visual changes at all** against the existing baselines. The dev server serves a rendering
story, the accessibility panel reports 19 passes and 0 violations on it, and the autodocs page
renders with its argument tables and its "Show code" block, in both the dev server and the built
output. `pnpm lint` passes.

**`ERR_NETWORK_IO_SUSPENDED` is environmental.** It hit `pnpm test-storybook` once here too,
mid-run, on a story that passes on every other run; the same command passed before the swap and
three times after it. It is Edge suspending network IO, not a Storybook problem.

**For the other tickets.** Ticket 18: the baselines do **not** need re-taking — the webpack builder
renders every story pixel-identically to the Vite one. Ticket 16: `pnpm lint` passes, and the
angular-eslint major-mismatch notice is unchanged. Ticket 20: hot module replacement in the
workbench is the one capability the migration lost.

### 2026-10-06 — витрина на webpack-фреймворке

**Подмена.** `@storybook/angular-vite@10.6.0` убран, `@storybook/angular@10.6.0` добавлен — вместе с
`@angular-devkit/build-angular@^20.3.0`, который ему нужен, чтобы собрать webpack-конфигурацию
Angular, и с `@angular/platform-browser-dynamic`, `@angular-devkit/core` и
`@angular-devkit/architect` соответствующих версий Angular 20 — это остальные его обязательные
peer-зависимости. `@analogjs/vite-plugin-angular` и его запись в `minimumReleaseAgeExclude` удалены.
Сам Storybook остался на 10.6.0.

**Peer-предупреждений больше нет.** `pnpm install` не печатает ни одной неудовлетворённой
peer-зависимости; все десять, оставшиеся от тикета 15, принадлежали `@storybook/angular-vite`.
`zone.js` у `@storybook/angular` — необязательный peer и по-прежнему не установлен.

**Зонлесс.** У обоих билдеров стоит `experimentalZoneless: true`. Билдер читает его дважды: он не
выполняет `cliConfig.entry.polyfills.push("zone.js")` и добавляет
`provideZonelessChangeDetection()` в начало провайдеров `bootstrapApplication` каждой стори.
В собранном preview нет библиотеки зон — ни `Zone.__load_patch`, ни `ZoneAwarePromise`, — а
единственные строки `zone.js` в нём принадлежат самому `@angular/core` (`getNgZone("zone.js")`,
подсказка про task-tracking).

**Файлы сторис не тронуты.** Они по-прежнему импортируют `@storybook/angular-vite`. Имя
отображается в `@storybook/angular` для TypeScript через `.storybook/framework.d.ts`, а для
бандлера — через alias в `main.ts`. На стороне TypeScript это не может быть записью в `paths`:
билдер отдаёт tsconfig в `tsconfig-paths-webpack-plugin`, который разрешается раньше alias и отдавал
webpack `dist/index.d.ts`, отчего каждая стори падала с
`TypeError: (0 , index_d.moduleMetadata) is not a function`.

**Три вещи, которых потребовал webpack-билдер.**

- `compodoc: false` у обоих билдеров. По умолчанию true, а compodoc не установлен.
- `browserTarget` у билдера разработки. В его схеме у опции нет значения по умолчанию, и фреймворк
  бросает `SB_FRAMEWORK_ANGULAR_0001 (AngularLegacyBuildOptionsError)`, когда она undefined;
  у билдера сборки она по умолчанию `null`, поэтому там этого не было. Указывает на
  `ui-kit:build-storybook`, у которого те же стили и tsconfig, а не на приложение playground.
- **Hot module replacement выключен** — удалён из компиляции preview в `main.ts`. С ним preview не
  отрисовывался вовсе: hot middleware сообщал хеш компиляции, которого у отданного бандла не было,
  HMR-клиент запрашивал `runtime_main.<hash>.hot-update.json`, получал 404 и перезагружал страницу
  по кругу. Dev-сервер по-прежнему пересобирается на изменение; страницу надо обновлять руками. Это
  цена смены билдера, и пользователь может захотеть к ней вернуться.

**Доказательства.** `pnpm build-storybook` успешен. `pnpm test-storybook` — 263 стори в 3 режимах,
без нарушений доступности и без ошибок в консоли. `pnpm test-visual` — 263 стори в 3 режимах и
**ни одного визуального изменения** относительно существующих бейслайнов. Dev-сервер отдаёт
отрисованную стори, панель доступности показывает на ней 19 пройденных проверок и 0 нарушений, а
страница autodocs рисуется с таблицами аргументов и блоком «Show code» — и на dev-сервере, и в
собранном выводе. `pnpm lint` проходит.

**`ERR_NETWORK_IO_SUSPENDED` — это окружение.** Он один раз поймался и здесь, посреди
`pnpm test-storybook`, на стори, которая проходит во всех остальных запусках; та же команда прошла
до подмены и трижды после неё. Это Edge приостанавливает сетевой ввод-вывод, а не проблема
Storybook.

**Для остальных тикетов.** Тикет 18: бейслайны переснимать **не нужно** — webpack-билдер рисует
каждую стори пиксель в пиксель так же, как Vite. Тикет 16: `pnpm lint` проходит, уведомление
angular-eslint о несовпадении мажора не изменилось. Тикет 20: hot module replacement в витрине —
единственная возможность, которую миграция потеряла.
