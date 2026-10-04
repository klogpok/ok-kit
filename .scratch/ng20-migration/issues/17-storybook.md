# 17: The component workbench runs on Angular 20

**What to build:** Storybook starts, every story renders, and the documentation addon and the
accessibility addon work, on an Angular 20 workspace. The Vite-based Angular framework package has
no release that supports Angular 20, so the workbench moves to the webpack-based one.

**Blocked by:** 15

**Status:** ready-for-agent

- [ ] Storybook stays on its current major and switches to the webpack-based Angular framework package, with the Angular 20 webpack build package added
- [ ] The Vite-based framework package and the Analog Vite plugin are removed
- [ ] Zoneless change detection is preserved through the webpack builder's option for it, and no zone library is pulled back into the application
- [ ] Storybook starts in development and builds for production
- [ ] Every story renders, with the documentation and accessibility addons working
- [ ] The story files themselves are not rewritten
- [ ] The story check command passes

## Русский перевод

# 17: Витрина компонентов работает на Angular 20

**Что сделать:** Storybook стартует, все стори рендерятся, аддоны документации и доступности
работают — на воркспейсе Angular 20. У пакета Angular-фреймворка на Vite нет ни одного релиза с
поддержкой Angular 20, поэтому витрина переезжает на webpack-овый.

**Блокируется:** 15

**Статус:** ready-for-agent

- [ ] Storybook остаётся на текущем мажоре и переходит на webpack-овый пакет Angular-фреймворка, добавляется webpack-пакет сборки Angular 20
- [ ] Vite-пакет фреймворка и Vite-плагин Analog удалены
- [ ] Зонлесс-режим сохранён через опцию webpack-билдера, библиотека зон обратно в приложение не затягивается
- [ ] Storybook стартует в разработке и собирается для продакшена
- [ ] Все стори рендерятся, аддоны документации и доступности работают
- [ ] Сами файлы сторис не переписываются
- [ ] Команда проверки сторис проходит
