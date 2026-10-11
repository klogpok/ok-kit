# 34: Toast harness through `documentRootLoader`

**Spec:** [../spec.md](../spec.md) → 9.4, user story 45

**Status:** needs-info

**Facts:** the spec says harnesses for overlay content are looked up from the document root, "so that I do not have to know about the overlay container". Menu, popover and tooltip harnesses sit on their trigger and find the panel from the document root themselves, so a test uses the fixture loader. A toast has no trigger in the component under test, so `UiToastHarness` is loaded with `documentRootLoader(fixture)`, the same way the existing `UiDialogHarness` is. The README says so.

**Options:**

1. Keep it: toasts and dialogs load through `documentRootLoader`, as documented (recommended; it is the CDK convention for content without a trigger).
2. Add a helper, e.g. `UiToastHarness.all(fixture)`, that hides the loader call.

## Русский перевод

# 34: Harness toast через `documentRootLoader`

**Спека:** [../spec.md](../spec.md) → 9.4, пользовательская история 45

**Статус:** needs-info

**Факты:** спека говорит, что harnesses для содержимого оверлеев ищут его от корня документа, «чтобы мне не нужно было знать о контейнере оверлеев». Harnesses menu, popover и tooltip сидят на своём триггере и сами находят панель от корня документа, поэтому тест пользуется обычным loader фикстуры. У toast нет триггера в тестируемом компоненте, поэтому `UiToastHarness` загружается через `documentRootLoader(fixture)` — так же, как существующий `UiDialogHarness`. README это описывает.

**Варианты:**

1. Оставить: toast и dialog загружаются через `documentRootLoader`, как задокументировано (рекомендую; это соглашение CDK для содержимого без триггера).
2. Добавить помощник, например `UiToastHarness.all(fixture)`, который прячет вызов loader.
