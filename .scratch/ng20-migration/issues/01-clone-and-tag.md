# 01: Create the Angular 20 working copy

**What to build:** a second checkout of this design system, with its full history, in which the
migration will happen, and a permanent marker on the Angular 22 state that is being left behind.
Anyone who later needs the pre-migration library can get it by name instead of by date.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The current state of the default branch is tagged `ng22-final`
- [ ] A clone exists at a sibling directory named `ui-kit-20`, carrying the full git history, the decision log, the roadmap, the area rules, the token build and the visual baselines
- [ ] A branch for the migration exists in the clone and is checked out
- [ ] Dependencies install in the clone and the full check command passes there before any migration work starts, proving the starting point is green
- [ ] Nothing further is committed to the original repository

## Русский перевод

# 01: Создать рабочую копию под Angular 20

**Что сделать:** второй чекаут дизайн-системы с полной историей, в котором и пойдёт миграция, плюс
постоянная метка на оставляемом состоянии Angular 22. Тот, кому позже понадобится библиотека до
миграции, получит её по имени, а не по дате.

**Блокируется:** ничем (можно начинать сразу)

**Статус:** ready-for-agent

- [ ] Текущее состояние ветки по умолчанию помечено тегом `ng22-final`
- [ ] Клон существует в соседнем каталоге с именем `ui-kit-20` и несёт полную историю git, журнал решений, роадмап, правила по областям, сборку токенов и визуальные бейслайны
- [ ] В клоне создана и выбрана ветка под миграцию
- [ ] Зависимости в клоне ставятся, полная проверка там проходит до начала любой работы по миграции — старт зелёный
- [ ] В исходный репозиторий больше ничего не коммитится
