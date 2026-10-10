# 15: Harnesses for radio, switch, datepicker and form-field

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer tests forms built with radio groups, switches, datepickers and form fields without querying the kit's DOM: read and change the radio selection, read and toggle a switch, read and type a date and open the calendar (consistent with the date-range-picker harness), read a form field's label, hint and error and get the harness of its control.

**Blocked by:** 14 (Phase 9.3 report)

**Status:** ready-for-agent

- [ ] Four harnesses on the `UiHarness` base, one commit each, each with its own spec
- [ ] Filters by label where the component has one
- [ ] Exported from the testing entry point; README table and CHANGELOG updated

## Русский перевод

# 15: Harnesses для radio, switch, datepicker и form-field

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения тестирует формы с radio-группами, switch, datepicker и form-field, не лазая в DOM кита: читает и меняет выбор radio, читает и переключает switch, читает и вводит дату и открывает календарь (согласованно с harness date-range-picker), читает подпись, подсказку и ошибку form-field и получает harness его контрола.

**Заблокировано:** 14 (Отчёт подфазы 9.3)

**Статус:** ready-for-agent

- [ ] Четыре harness на базе `UiHarness`, по коммиту на каждый, у каждого свой спек
- [ ] Фильтры по подписи там, где она есть у компонента
- [ ] Экспортируются из entry point testing; таблица README и CHANGELOG обновлены
