# 13: The library stops speaking Signal Forms

**What to build:** the last traces of Signal Forms leave the library. Binding a control with
`formControl`, `formControlName` or `ngModel` works exactly as it did; binding one with the Signal
Forms directive is simply no longer a thing the kit supports.

**Blocked by:** 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12

**Status:** ready-for-agent

- [ ] The control-state helper loses its Signal Forms branch and keeps the reactive one, with the shape of its public interface unchanged
- [ ] The shared base class for custom controls no longer injects or checks the Signal Forms field token
- [ ] No file anywhere in the repository imports from the Signal Forms package
- [ ] The full check passes: unit tests, lint, build, stories and visual baselines
- [ ] Error display, disabled state, required marker and touched behaviour are observably unchanged for every control

## Русский перевод

# 13: Библиотека перестаёт говорить на Signal Forms

**Что сделать:** из библиотеки уходят последние следы Signal Forms. Связывание контрола через
`formControl`, `formControlName` или `ngModel` работает ровно как работало; связывание через
директиву Signal Forms — просто больше не то, что кит поддерживает.

**Блокируется:** 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12

**Статус:** ready-for-agent

- [ ] Помощник состояния контрола теряет ветку Signal Forms и сохраняет реактивную, форма публичного интерфейса не меняется
- [ ] Общий базовый класс кастомных контролов больше не инжектит и не проверяет токен сигнального поля
- [ ] Ни один файл в репозитории не импортирует из пакета Signal Forms
- [ ] Полная проверка проходит: юнит-тесты, линт, сборка, стори и визуальные бейслайны
- [ ] Отображение ошибок, disabled, маркер обязательности и поведение touched наблюдаемо не изменились ни у одного контрола
