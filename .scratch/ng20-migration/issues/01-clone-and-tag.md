# 01: Create the Angular 20 working copy

**What to build:** a second checkout of this design system, with its full history, in which the
migration will happen, and a permanent marker on the Angular 22 state that is being left behind.
Anyone who later needs the pre-migration library can get it by name instead of by date.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The current state of the default branch is tagged `ng22-final`
- [x] A clone exists at a sibling directory named `ui-kit-20`, carrying the full git history, the decision log, the roadmap, the area rules, the token build and the visual baselines
- [x] A branch for the migration exists in the clone and is checked out
- [x] Dependencies install in the clone and the full check command passes there before any migration work starts, proving the starting point is green
- [x] Nothing further is committed to the original repository

## Comments

**2026-10-04 - done, waiting for the user's review.**

- `ng22-final` is an annotated tag on `40748d2`, the head of `master` at the time, and is pushed to
  `origin`.
- The clone is `D:/projects/ui-kit-20`, with the full history (269 commits when it was taken),
  `docs/DECISIONS.md`, `docs/ROADMAP.md`, the seven files of `.claude/rules/`,
  `projects/ui-kit/tokens/` and 789 visual baselines. The branch is `ng20-migration`.
- `pnpm install` succeeds and the full check passes in the clone: 687 unit tests, 2 playground
  tests, coverage 96.09 / 93.2 / 93.43 / 98.01, both builds, the Storybook build, 263 stories
  checked with axe in three modes, 263 stories compared against the baselines in three modes with
  no visual change, and `ngc --noEmit` over the stories.
- Two tests had to be repaired before the start was green. They clicked a day in September 2026 in
  a calendar that opens on today's month, so they broke on 1 October 2026. Both datepicker spec
  files now freeze the clock on 2026-09-25, the day the visual baselines already use.
- The agent docs and these tickets existed only in the working tree of the original repository.
  They were carried into the clone and committed here, so nothing further was committed to the
  original.

## Русский перевод

# 01: Создать рабочую копию под Angular 20

**Что сделать:** второй чекаут дизайн-системы с полной историей, в котором и пойдёт миграция, плюс
постоянная метка на оставляемом состоянии Angular 22. Тот, кому позже понадобится библиотека до
миграции, получит её по имени, а не по дате.

**Блокируется:** ничем (можно начинать сразу)

**Статус:** сделано

- [x] Текущее состояние ветки по умолчанию помечено тегом `ng22-final`
- [x] Клон существует в соседнем каталоге с именем `ui-kit-20` и несёт полную историю git, журнал решений, роадмап, правила по областям, сборку токенов и визуальные бейслайны
- [x] В клоне создана и выбрана ветка под миграцию
- [x] Зависимости в клоне ставятся, полная проверка там проходит до начала любой работы по миграции — старт зелёный
- [x] В исходный репозиторий больше ничего не коммитится

## Комментарии

**2026-10-04 - сделано, ждёт ревью пользователя.**

- `ng22-final` - аннотированный тег на `40748d2`, тогдашней голове `master`, запушен в `origin`.
- Клон - `D:/projects/ui-kit-20`, с полной историей (269 коммитов на момент клонирования),
  `docs/DECISIONS.md`, `docs/ROADMAP.md`, семью файлами `.claude/rules/`,
  `projects/ui-kit/tokens/` и 789 визуальными бейслайнами. Ветка - `ng20-migration`.
- `pnpm install` проходит, полная проверка в клоне зелёная: 687 юнит-тестов, 2 теста playground,
  покрытие 96.09 / 93.2 / 93.43 / 98.01, обе сборки, сборка Storybook, 263 стори проверены axe в
  трёх режимах, 263 стори сверены с бейслайнами в трёх режимах без визуальных изменений и
  `ngc --noEmit` по стори.
- Два теста пришлось починить до зелёного старта. Они кликали по дню сентября 2026 в календаре,
  который открывается на текущем месяце, и с 1 октября 2026 падали. Оба спека датапикера теперь
  фиксируют часы на 2026-09-25 - дне, который уже используют визуальные бейслайны.
- Agent-доки и сами тикеты жили только в рабочем дереве исходного репозитория. Они перенесены в
  клон и закоммичены здесь, так что в оригинал ничего больше не коммитилось.
