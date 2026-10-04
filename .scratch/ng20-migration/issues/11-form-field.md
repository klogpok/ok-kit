# 11: The form field shows reactive forms errors in its spec and its stories

**What to build:** the form field's own proof that it renders a label, a hint, a required marker
and an error at the right moment is written against reactive forms, and the story that demonstrates
validation to a reader of the component library demonstrates it the way consumers will actually
write it.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The Signal Forms host is removed from the form field spec
- [ ] The reactive forms host asserts: the label association, the required marker, the hint, the error appearing only when the control is invalid and touched, the error text coming from the validator, and the accessible description linking the control to its hint and error
- [ ] The form field stories no longer use Signal Forms and demonstrate validation with a reactive form instead
- [ ] The stories still cover the same states, so that no visual baseline is removed by this ticket
- [ ] Assertions go through the existing harnesses

## Русский перевод

# 11: Поле формы показывает ошибки реактивных форм в спеке и в сторис

**Что сделать:** собственное доказательство поля формы — что оно рисует метку, подсказку, маркер
обязательности и ошибку в нужный момент — написано на реактивных формах, а стори, демонстрирующая
валидацию читателю витрины, демонстрирует её так, как её реально будут писать потребители.

**Блокируется:** 01

**Статус:** ready-for-agent

- [ ] Сигнальный хост удалён из спека поля формы
- [ ] Реактивный хост проверяет: связь метки с контролом, маркер обязательности, подсказку, появление ошибки только когда контрол невалиден и тронут, текст ошибки из валидатора и доступное описание, связывающее контрол с подсказкой и ошибкой
- [ ] Стори поля формы больше не используют Signal Forms и демонстрируют валидацию на реактивной форме
- [ ] Стори покрывают те же состояния, поэтому этот тикет не удаляет ни одного визуального бейслайна
- [ ] Проверки идут через существующие харнессы
