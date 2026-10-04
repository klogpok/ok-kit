# 16: Linting works on the Angular 20 toolchain

**What to build:** the lint command runs again and enforces the same rules as before, on tooling
that supports Angular 20.

**Blocked by:** 15

**Status:** ready-for-agent

- [ ] The linter and its Angular plugin are on the majors that support Angular 20
- [ ] The lint command passes across the library, the playground and the stories
- [ ] The rule set is equivalent to the one in force before the downgrade; any rule that no longer exists is replaced by its closest counterpart or its removal is recorded in the ticket
- [ ] Style linting of the stylesheets still runs and passes
- [ ] No source file is edited purely to silence a rule that was previously satisfied

## Русский перевод

# 16: Линт работает на тулчейне Angular 20

**Что сделать:** команда линта снова запускается и требует того же, что и раньше, на инструментах,
поддерживающих Angular 20.

**Блокируется:** 15

**Статус:** ready-for-agent

- [ ] Линтер и его Angular-плагин на мажорах с поддержкой Angular 20
- [ ] Команда линта проходит по библиотеке, playground и сторис
- [ ] Набор правил эквивалентен действовавшему до даунгрейда; правило, которого больше нет, заменено ближайшим аналогом либо его удаление записано в тикете
- [ ] Линт стилей по-прежнему запускается и проходит
- [ ] Ни один исходный файл не правится только ради того, чтобы замолчать правило, которое раньше выполнялось
