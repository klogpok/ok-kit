# 18: Visual baselines reflect the Angular 20 workbench

**What to build:** the screenshot comparison is trustworthy again. Every baseline image matches
what the component actually renders on the new workbench, and a human has looked at the ones that
changed.

**Blocked by:** 17

**Status:** ready-for-agent

- [ ] The visual comparison command is run and every difference is accounted for
- [ ] Baselines are re-taken only where the rendering genuinely moved; an unexplained difference is investigated as a regression before any image is accepted
- [ ] The updated images are reviewed by eye, in light and dark themes and in right-to-left, before they land
- [ ] The re-take is its own commit, separate from any code change
- [ ] The visual comparison command passes afterwards

## Русский перевод

# 18: Визуальные бейслайны соответствуют витрине на Angular 20

**Что сделать:** сравнение скриншотов снова заслуживает доверия. Каждая эталонная картинка
соответствует тому, что компонент реально рисует на новой витрине, и изменившиеся картинки
посмотрел человек.

**Блокируется:** 17

**Статус:** ready-for-agent

- [ ] Команда визуального сравнения запущена, каждое расхождение объяснено
- [ ] Бейслайны пересняты только там, где отрисовка действительно сдвинулась; необъяснённое расхождение расследуется как регрессия до принятия любой картинки
- [ ] Обновлённые картинки просмотрены глазами в светлой и тёмной теме и в режиме справа налево до того, как лягут
- [ ] Пересъёмка — отдельный коммит, без примеси изменений кода
- [ ] После неё команда визуального сравнения проходит
