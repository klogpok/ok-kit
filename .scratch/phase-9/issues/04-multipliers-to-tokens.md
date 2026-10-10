# 04: Size and duration multipliers become component tokens

**Spec:** [../spec.md](../spec.md)

**What to build:** a theme author can tune the switch sm/lg track scale, the avatar initials size ratio, the spinner stroke width, the dialog enter scale and the animation durations of spinner, skeleton, progress bar and table through component tokens, without overriding component styles. Today's values are the defaults, so nothing looks different. Geometry (`* 2`, `* -1`, the calendar's seven columns, `0.875em` in typography) stays in the styles.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Each listed value is a component token in the token source, and the generated files are rebuilt
- [ ] The component styles read the tokens; no listed magic multiplier remains
- [ ] Visual baselines do not change
- [ ] The component tokens story shows the new tokens

## Русский перевод

# 04: Множители размеров и длительностей становятся component-токенами

**Спека:** [../spec.md](../spec.md)

**Что сделать:** автор темы может настроить масштаб дорожки switch sm/lg, долю размера инициалов avatar, толщину обводки spinner, масштаб появления диалога и длительности анимаций spinner, skeleton, progress bar и table через component-токены, не перекрывая стили компонентов. Сегодняшние значения — умолчания, так что ничего не выглядит иначе. Геометрия (`* 2`, `* -1`, семь колонок календаря, `0.875em` в типографике) остаётся в стилях.

**Заблокировано:** Нет (можно начинать сразу)

**Статус:** ready-for-agent

- [ ] Каждое перечисленное значение — component-токен в источнике токенов, сгенерированные файлы пересобраны
- [ ] Стили компонентов читают токены; ни одного перечисленного магического множителя не осталось
- [ ] Визуальные снимки не меняются
- [ ] Story component-токенов показывает новые токены
