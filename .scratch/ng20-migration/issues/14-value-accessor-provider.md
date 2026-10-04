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

**Status:** ready-for-agent

- [ ] Each of the fifteen concrete custom controls provides the value accessor token pointing at itself; the shared base class remains the only implementation of the accessor methods
- [ ] The base class no longer injects the forms directive during construction and no longer assigns itself to it
- [ ] The control-state helper resolves the forms directive lazily, inside the synchronisation call its interface already declares
- [ ] The "is a forms directive bound" flag of the control state becomes a signal, and everything reading it is updated
- [ ] Native text inputs, which provide no accessor of their own, keep working unchanged
- [ ] The full check passes, and no spec is weakened or skipped to get there

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

**Статус:** ready-for-agent

- [ ] Каждый из пятнадцати конкретных кастомных контролов отдаёт токен value accessor, указывающий на себя; общий базовый класс остаётся единственной реализацией методов accessor
- [ ] Базовый класс больше не инжектит директиву формы при конструировании и не присваивает себя в неё
- [ ] Помощник состояния контрола разрешает директиву формы лениво, внутри вызова синхронизации, который уже объявлен в его интерфейсе
- [ ] Флаг «директива формы связана» в состоянии контрола становится сигналом, всё читающее его обновлено
- [ ] Нативные текстовые поля, которые своего accessor не отдают, продолжают работать без изменений
- [ ] Полная проверка проходит, и ни один спек ради этого не ослаблен и не пропущен
