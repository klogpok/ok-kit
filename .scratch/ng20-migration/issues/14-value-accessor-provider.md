# 14: Custom controls register as value accessors the standard way

**What to build:** every custom control announces itself to Angular's forms through the value
accessor token instead of reaching into the forms directive and assigning itself. Behaviour for a
consumer does not change at all; what changes is that the kit now registers the way the framework's
own documentation and the majority of Angular Material do.

This cannot be split: a control either injects the forms directive eagerly and assigns itself, or
provides the token and resolves the directive later. Doing both at once is a circular dependency,
so the base class and all fifteen controls move together.

A throwaway spec confirmed both halves of this. Injecting the directive in a constructor while
providing the token gives:

```
NG0200: Circular dependency detected for ProbeA.
Path: ProbeA -> unknown -> FormControlDirective -> InjectionToken NgValueAccessor -> ProbeA
```

Resolving it after construction works:

```ts
// from the probe: provider stays, the directive is resolved after construction
private readonly injector = inject(Injector);
ngOnInit(): void {
  this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
}
```

**Blocked by:** 13

**Status:** done

- [x] Each of the fifteen concrete custom controls provides the value accessor token pointing at itself; the shared base class remains the only implementation of the accessor methods
- [x] The base class no longer injects the forms directive during construction and no longer assigns itself to it
- [x] The control-state helper resolves the forms directive lazily, inside the synchronisation call its interface already declares
- [x] The "is a forms directive bound" flag of the control state becomes a signal, and everything reading it is updated
- [x] Native text inputs, which provide no accessor of their own, keep working unchanged
- [x] The full check passes, and no spec is weakened or skipped to get there

## Русский перевод

# 14: Кастомные контролы регистрируются как value accessor стандартным способом

**Что сделать:** каждый кастомный контрол объявляет себя формам Angular через токен value accessor,
а не лезет в директиву формы и не присваивает себя в неё. Для потребителя не меняется ничего;
меняется то, что кит регистрируется так, как это описано в документации фреймворка и как делает
большинство модулей Angular Material.

Разбить нельзя: контрол либо инжектит директиву формы в конструкторе и присваивает себя, либо
отдаёт токен и разрешает директиву позже. Одновременно — циклическая зависимость, поэтому базовый
класс и все пятнадцать контролов двигаются вместе.

Одноразовый спек подтвердил обе половины. Инжект директивы в конструкторе при отданном токене даёт:

```
NG0200: Circular dependency detected for ProbeA.
Path: ProbeA -> unknown -> FormControlDirective -> InjectionToken NgValueAccessor -> ProbeA
```

Разрешение после конструирования работает:

```ts
// из пробы: провайдер остаётся, директива разрешается после конструирования
private readonly injector = inject(Injector);
ngOnInit(): void {
  this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
}
```

**Блокируется:** 13

**Статус:** сделано

- [x] Каждый из пятнадцати конкретных кастомных контролов отдаёт токен value accessor, указывающий на себя; общий базовый класс остаётся единственной реализацией методов accessor
- [x] Базовый класс больше не инжектит директиву формы при конструировании и не присваивает себя в неё
- [x] Помощник состояния контрола разрешает директиву формы лениво, внутри вызова синхронизации, который уже объявлен в его интерфейсе
- [x] Флаг «директива формы связана» в состоянии контрола становится сигналом, всё читающее его обновлено
- [x] Нативные текстовые поля, которые своего accessor не отдают, продолжают работать без изменений
- [x] Полная проверка проходит, и ни один спек ради этого не ослаблен и не пропущен

## Comments

### 2026-10-06

Sixteen concrete controls, not fifteen, carry the provider: `slider` holds both `ui-slider` and
`ui-range-slider`. The count in the ticket came from the entry points; the two sliders are separate
components with separate decorators, so each needs its own `providers` entry.

What changed:

- `injectControlState()` takes an `Injector` and resolves `NgControl` on the first `sync()`;
  `UiControlState.bound` is a `Signal<boolean>`. Its two readers, `UiFormControlBase.showError` and
  `UiTextControlBase.showError`, call it.
- `UiFormControlBase` no longer injects `NgControl` and has no constructor.
- Each concrete control adds `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => X), multi: true }`.

One decision had to be made. Dropping the eager `inject(NgControl)` broke two native-input specs in
`form-field.spec.ts` (`aria-required` missing). The cause is not the laziness itself: injecting a
directive also instantiates it, and Angular registers the pre-order hooks in instantiation order, so
the old eager injection put `FormControlName.ngOnChanges` ahead of `UiTextControlBase.ngDoCheck`.
Without it, the first and only `ngDoCheck` of that spec ran before `setUpControl`, so `sync()` found
no control. A custom control does not have this problem, because `setUpControl` calls
`registerOnChange` / `registerOnTouched` on it and both call `sync()`. A native input provides no
accessor, so nothing calls it back. The fix is one hook: `UiTextControlBase` syncs again in
`ngAfterViewInit`, which runs after every pre-order hook of the view. No spec was changed to
accommodate this.

Rejected alternatives: giving the helper an "eager" option (two resolution paths for one helper),
and retrying the resolution on every `sync()` (does not help, the spec only runs `ngDoCheck` once).

Tests: three cases added to `control-state.spec.ts` for a probe that provides `NG_VALUE_ACCESSOR` —
it would have thrown NG0200 before this change. The existing suites are the regression net.

Full check, all green: lint, `format:check`, 729 unit tests (69 files, coverage 96.08% stmts /
93.5% branches / 98.18% lines), 7 playground tests, `build`, `build:playground` (no budget
warnings), `build-storybook`, 263 stories x 3 modes with no a11y violations, visual comparison with
no changes, and the story type-check. Browser check in the playground: required markers, errors on
submit, error clearing, and two-way value flow through the checkbox and switch all behave as before;
no console errors.

Drive-by: `chip-input.spec.ts` and `multi-select.spec.ts` were left unformatted by an earlier
ticket and failed `format:check`. Reformatted in a separate commit.

Also updated `.claude/rules/forms.md`, whose CVA bullet described the assignment this ticket removed.

### Русский перевод

Провайдер несут шестнадцать конкретных контролов, а не пятнадцать: в `slider` живут и `ui-slider`,
и `ui-range-slider`. Число в тикете шло от точек входа, а это два отдельных компонента со своими
декораторами, поэтому у каждого свой `providers`.

Что изменилось:

- `injectControlState()` принимает `Injector` и разрешает `NgControl` при первом `sync()`;
  `UiControlState.bound` стал `Signal<boolean>`. Его читают `UiFormControlBase.showError` и
  `UiTextControlBase.showError` — оба обновлены.
- `UiFormControlBase` больше не инжектит `NgControl`, конструктор удалён.
- В каждый конкретный контрол добавлен `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => X), multi: true }`.

Пришлось принять одно решение. Снятие раннего `inject(NgControl)` сломало два спека нативного поля
в `form-field.spec.ts` (пропал `aria-required`). Причина не в ленивости как таковой: инжект
директивы её же и создаёт, а Angular регистрирует pre-order хуки в порядке создания, поэтому раньше
`FormControlName.ngOnChanges` шёл перед `UiTextControlBase.ngDoCheck`. Без инжекта единственный в
том спеке `ngDoCheck` отработал до `setUpControl`, и `sync()` не нашёл контрола. У кастомного
контрола такой проблемы нет: `setUpControl` зовёт у него `registerOnChange` / `registerOnTouched`, а
они зовут `sync()`. Нативное поле accessor не отдаёт, и звать его некому. Починка — один хук:
`UiTextControlBase` синхронизируется ещё раз в `ngAfterViewInit`, который идёт после всех pre-order
хуков вью. Ни один спек ради этого не менялся.

Отвергнутые варианты: опция «eager» у помощника (два пути разрешения в одном помощнике) и повторное
разрешение на каждом `sync()` (не помогает — `ngDoCheck` в том спеке случается один раз).

Тесты: в `control-state.spec.ts` добавлены три кейса на пробу, которая отдаёт `NG_VALUE_ACCESSOR`, —
до этого изменения она падала бы с NG0200. Остальные наборы работают как сетка от регрессий.

Полная проверка, всё зелёное: lint, `format:check`, 729 юнит-тестов (69 файлов, покрытие 96.08%
операторов / 93.5% ветвей / 98.18% строк), 7 тестов playground, `build`, `build:playground` (без
предупреждений по бюджетам), `build-storybook`, 263 истории в 3 режимах без нарушений доступности,
сравнение бейслайнов без изменений и typecheck историй. Проверка в браузере на playground: маркеры
обязательности, ошибки при отправке, их снятие и значение в обе стороны через чекбокс и свитч ведут
себя как раньше; ошибок в консоли нет.

Попутно: `chip-input.spec.ts` и `multi-select.spec.ts` остались неотформатированными после прошлого
тикета и валили `format:check`. Переформатированы отдельным коммитом.

Также обновлён `.claude/rules/forms.md`: его пункт про CVA описывал то самое присваивание, которое
этот тикет убрал.

### 2026-10-06 (recorded after the review)

**Deviation, recorded late.** The checkbox above says native text inputs "keep working unchanged",
and the spec says they are "unaffected beyond the helper's internal change". That is not literally
true: `UiTextControlBase` gained an `ngAfterViewInit` that calls `state.sync()` a second time. The
reason is the hook ordering described in the entry above — without the eager `inject(NgControl)`,
the single `ngDoCheck` of a native input runs before `setUpControl`, so the first `sync()` finds no
control and `aria-required` / the control-derived error state never appear. The change is necessary
and correct, and the rendered behaviour is the same as before; what was missing is this note. The
identical hook on `UiFormControlBase` was recorded in ticket 15, this one was not. It is now also
stated in `.claude/rules/forms.md`.

#### Русский перевод

**Отклонение, записанное задним числом.** Галочка выше говорит, что нативные текстовые поля
«продолжают работать без изменений», а спека — что их не затрагивает ничего, кроме внутреннего
изменения помощника. Буквально это не так: у `UiTextControlBase` появился `ngAfterViewInit`,
который второй раз зовёт `state.sync()`. Причина — порядок хуков, описанный в записи выше: без
раннего `inject(NgControl)` единственный `ngDoCheck` нативного поля отрабатывает до `setUpControl`,
первый `sync()` не находит контрола, и ни `aria-required`, ни состояние ошибки из контрола не
появляются. Изменение необходимо и корректно, отрисовка не изменилась — не хватало именно этой
записи. Такой же хук у `UiFormControlBase` был записан в тикете 15, а этот — нет. Теперь он назван
и в `.claude/rules/forms.md`.
