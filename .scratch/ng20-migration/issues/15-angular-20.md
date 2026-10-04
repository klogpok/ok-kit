# 15: The library builds and tests on Angular 20

**What to build:** the working copy runs on the Angular version the consuming application runs on.
From this ticket onwards, anything that compiles here compiles there.

Angular, the CDK, TypeScript, the build package and the test runner move together because their
peer ranges leave no other order: the Angular 20 build package requires TypeScript below 6 and the
earlier major of the test runner.

**Blocked by:** 14

**Status:** ready-for-agent

- [ ] Angular and the CDK are on 20.3, TypeScript on 5.8, the build and packaging tooling on their Angular 20 majors, and the test runner and bundler on the versions those require
- [ ] No unmet peer dependency warnings remain on a clean install
- [ ] The library builds and the whole unit test suite passes, with signature differences from the version change fixed rather than silenced
- [ ] The accessibility and overlay APIs of the CDK, which the library uses most heavily, are checked against their Angular 20 signatures
- [ ] The playground builds and runs
- [ ] Nothing in the library's public API changes in this ticket

## Русский перевод

# 15: Библиотека собирается и тестируется на Angular 20

**Что сделать:** рабочая копия живёт на той же версии Angular, что и потребляющее приложение. С
этого тикета всё, что компилируется здесь, компилируется и там.

Angular, CDK, TypeScript, пакет сборки и тест-раннер двигаются вместе, потому что их peer-диапазоны
не оставляют другого порядка: пакет сборки Angular 20 требует TypeScript ниже 6 и предыдущий мажор
тест-раннера.

**Блокируется:** 14

**Статус:** ready-for-agent

- [ ] Angular и CDK на 20.3, TypeScript на 5.8, инструменты сборки и упаковки на своих мажорах под Angular 20, тест-раннер и бандлер на версиях, которые они требуют
- [ ] На чистой установке не остаётся предупреждений о неудовлетворённых peer-зависимостях
- [ ] Библиотека собирается, весь набор юнит-тестов проходит, расхождения сигнатур от смены версии исправлены, а не заглушены
- [ ] API доступности и оверлеев CDK, которые библиотека использует плотнее всего, сверены со своими сигнатурами в Angular 20
- [ ] Playground собирается и запускается
- [ ] Публичный API библиотеки в этом тикете не меняется
