# 07: Stepper tracks step completion through reactive forms only

**What to build:** a stepper whose steps each carry a reactive form group still marks a step done
when that group becomes valid, still blocks forward movement when the step requires validity, and
no longer accepts a Signal Forms field as a step's control.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The stepper no longer imports anything from the Signal Forms package
- [ ] The public type of a step's control is a reactive control, with the union and the field branch removed
- [ ] Step validity is read from the reactive control and updates as the control's own events fire
- [ ] The spec's Signal Forms host is gone and its cases are asserted on the reactive forms host through the existing harness
- [ ] Linear and non-linear modes, completed state set by hand, orientation and keyboard navigation are unchanged

## Русский перевод

# 07: Степпер отслеживает завершённость шага только через реактивные формы

**Что сделать:** степпер, у которого на каждом шаге реактивная группа, по-прежнему помечает шаг
выполненным, когда группа становится валидной, по-прежнему блокирует движение вперёд там, где шаг
требует валидности, и больше не принимает сигнальное поле в качестве контрола шага.

**Блокируется:** 01

**Статус:** ready-for-agent

- [ ] Степпер больше ничего не импортирует из пакета Signal Forms
- [ ] Публичный тип контрола шага — реактивный контрол, объединение типов и ветка поля удалены
- [ ] Валидность шага читается из реактивного контрола и обновляется по его собственным событиям
- [ ] Сигнальный хост в спеке удалён, его кейсы проверяются на реактивном хосте через существующий харнесс
- [ ] Линейный и нелинейный режимы, завершённость, выставленная вручную, ориентация и навигация с клавиатуры не изменились
