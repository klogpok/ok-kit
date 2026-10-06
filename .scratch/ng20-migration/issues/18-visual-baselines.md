# 18: Visual baselines reflect the Angular 20 workbench

**What to build:** the screenshot comparison is trustworthy again. Every baseline image matches
what the component actually renders on the new workbench, and a human has looked at the ones that
changed.

**Blocked by:** 17

**Status:** done

- [x] The visual comparison command is run and every difference is accounted for
- [x] Baselines are re-taken only where the rendering genuinely moved; an unexplained difference is investigated as a regression before any image is accepted
- [x] The updated images are reviewed by eye, in light and dark themes and in right-to-left, before they land
- [ ] The re-take is its own commit, separate from any code change
- [x] The visual comparison command passes afterwards

## Русский перевод

# 18: Визуальные бейслайны соответствуют витрине на Angular 20

**Что сделать:** сравнение скриншотов снова заслуживает доверия. Каждая эталонная картинка
соответствует тому, что компонент реально рисует на новой витрине, и изменившиеся картинки
посмотрел человек.

**Блокируется:** 17

**Статус:** сделано

- [x] Команда визуального сравнения запущена, каждое расхождение объяснено
- [x] Бейслайны пересняты только там, где отрисовка действительно сдвинулась; необъяснённое расхождение расследуется как регрессия до принятия любой картинки
- [x] Обновлённые картинки просмотрены глазами в светлой и тёмной теме и в режиме справа налево до того, как лягут
- [ ] Пересъёмка — отдельный коммит, без примеси изменений кода
- [x] После неё команда визуального сравнения проходит

## Comments

### 2026-10-06 — nothing moved, so nothing was re-taken

**What was compared.** `pnpm build-storybook` on the current integration tip (`d2f610d`, which
carries the webpack builder of ticket 17, the dialog `OnPush` fix of ticket 16 and the package
metadata of ticket 19), then `pnpm test-visual` against the 789 baselines in `visual/`. Verbatim:

```
Compared 263 stories in 3 modes.
No visual changes.
```

It was run twice, start to finish, with the same result and exit code 0. No `ERR_NETWORK_IO_SUSPENDED`
and no other error appeared in either run, so there was nothing to judge flake-versus-failure on.

**No baseline was re-taken.** Ticket 17's claim was verified rather than trusted, and it holds on
the whole of the current tip, not only on the commit it was measured at. There are zero differing
stories, zero stale baselines and zero missing ones — the 789 files are exactly the 263 stories ×
3 modes the run enumerates. `pnpm test-visual:update` was never run and `visual/` is untouched, so
the "the re-take is its own commit" criterion has nothing to apply to and is left unticked.

**What the comparison does not cover, and what was looked at instead.** The screenshot takes
`#storybook-root` plus any **open** `.cdk-overlay-pane`, and the dialog, drawer, popover and menu
stories are captured with their overlay closed — the dialog baselines are three buttons on a white
strip. Ticket 16's one source change, `ChangeDetectionStrategy.OnPush` on `UiDialogContainerBase`,
is inherited by `UiDialogContainer` and `UiDrawerContainer` and therefore sits in exactly the part
of the tree the baselines never photograph. It was checked by hand in the built Storybook with
Playwright:

- `overlays-dialog--default`, light RTL: the rename dialog opens over the backdrop, title on the
  right, close button on the left, field and actions laid out as before.
- `overlays-dialog--default`, dark RTL: the long dialog scrolls its body with the header and the
  action bar pinned, on the dark surface.
- `overlays-dialog--default`, light LTR: the danger confirm dialog, title and message left-aligned,
  red confirm button.
- Change detection through the OnPush container still runs: typing into the rename field and
  pressing Save closed the dialog and the host's live region read `Renamed to "Tower C"`.
- `overlays-drawer--start`, light RTL: the drawer opens on the right (correct for `start` in RTL),
  and ticking a checkbox inside it re-rendered the checkbox immediately.

**Baselines reviewed by eye.** A sample across all three modes, since no image changed: date picker
in light RTL, dark RTL and light LTR (right- and left-alignment, dark surface, the date frozen at
25.9.2026), the Hebrew calendar with the "today" ring on the 25th, the plans table in dark RTL with
its badges and pagination, the alert tones in dark RTL, the linear stepper in light LTR, and the
dialog, drawer and popover trigger baselines that revealed the closed-overlay gap above.

## Русский перевод

### 2026-10-06 — ничего не сдвинулось, поэтому ничего не переснималось

**Что сравнивалось.** `pnpm build-storybook` на текущей верхушке интеграционной ветки (`d2f610d` —
в ней webpack-билдер тикета 17, правка `OnPush` в диалоге из тикета 16 и метаданные пакета из
тикета 19), затем `pnpm test-visual` против 789 бейслайнов в `visual/`. Дословно:

```
Compared 263 stories in 3 modes.
No visual changes.
```

Запущено дважды, целиком, с тем же результатом и кодом выхода 0. Ни `ERR_NETWORK_IO_SUSPENDED`, ни
какой-либо другой ошибки ни в одном из запусков не было, так что решать «флак или реальный сбой»
было не о чем.

**Ни один бейслайн не переснят.** Утверждение тикета 17 было проверено, а не принято на веру, и оно
держится на всей текущей верхушке, а не только на том коммите, где его измеряли. Расхождений — ноль,
устаревших бейслайнов — ноль, недостающих — ноль: 789 файлов это ровно 263 стори × 3 режима, которые
перечисляет запуск. `pnpm test-visual:update` не запускался, `visual/` не тронут, поэтому критерий
«пересъёмка — отдельный коммит» не к чему применить и остаётся не отмеченным.

**Чего сравнение не покрывает и что вместо этого посмотрено глазами.** Скриншот берёт
`#storybook-root` плюс **открытые** `.cdk-overlay-pane`, а стори диалога, drawer, popover и меню
снимаются с закрытым оверлеем — бейслайны диалога это три кнопки на белой полосе. Единственная
правка исходников из тикета 16, `ChangeDetectionStrategy.OnPush` на `UiDialogContainerBase`,
наследуется `UiDialogContainer` и `UiDrawerContainer` и потому находится ровно в той части дерева,
которую бейслайны никогда не фотографируют. Она проверена руками в собранном Storybook через
Playwright:

- `overlays-dialog--default`, светлая RTL: диалог переименования открывается поверх подложки,
  заголовок справа, кнопка закрытия слева, поле и действия разложены как раньше.
- `overlays-dialog--default`, тёмная RTL: длинный диалог прокручивает тело, шапка и панель действий
  закреплены, на тёмной поверхности.
- `overlays-dialog--default`, светлая LTR: опасный confirm-диалог, заголовок и текст слева, красная
  кнопка подтверждения.
- Change detection через OnPush-контейнер по-прежнему работает: ввод в поле переименования и Save
  закрыли диалог, а live-регион хоста прочитал `Renamed to "Tower C"`.
- `overlays-drawer--start`, светлая RTL: drawer открывается справа (верно для `start` в RTL), и
  переключение чекбокса внутри него тут же перерисовало чекбокс.

**Бейслайны, просмотренные глазами.** Выборка по всем трём режимам, раз ни одна картинка не
изменилась: date picker в светлой RTL, тёмной RTL и светлой LTR (выравнивание вправо и влево, тёмная
поверхность, дата зафиксирована на 25.9.2026), ивритский календарь с кольцом «сегодня» на 25-м,
таблица планов в тёмной RTL с бейджами и пагинацией, тона алертов в тёмной RTL, линейный stepper в
светлой LTR, а также бейслайны триггеров диалога, drawer и popover, которые и вскрыли описанный выше
пробел с закрытыми оверлеями.
