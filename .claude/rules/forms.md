---
paths:
  - "projects/ui-kit/{core,input,select,datepicker,number-input,chip,autocomplete,file-upload,checkbox,radio,switch,form-field}/**/*.ts"
  - "projects/playground/**/*.ts"
---

# Form controls: Signal Forms and CVA

- Signal Forms' `[formField]` sets the inputs `disabled`, `invalid`, `required`, `touched` and `name` on **every** directive of the host.
- If a component provides `NG_VALUE_ACCESSOR`, `[formField]` falls back to CVA interop. This is why `UiFormControlBase` assigns `ngControl.valueAccessor` manually.
- A component cannot provide `NG_VALIDATORS` pointing at itself when it injects `NgControl` (circular DI). Provide a separate injectable (see `provideUiCheckedValidator()`).
- Signal Forms `required()` treats only `null`, `''` and `false` as empty. An empty array needs `minLength(path, 1)`. `[formField]` also binds `min`/`max` (a `Date` for `minDate()`/`maxDate()`), so date inputs must accept `Date | null | undefined`.
- `[formField]` forbids static or bound `min`/`max` (and the other state inputs) on the same element (NG8022). With Signal Forms, set limits with the `min()`/`max()` rules.
- Signal Forms `transformedValue()` reports parse errors to `[formField]` and to Reactive Forms only in its custom-control mode. Our CVA path (`UiFormControlBase` assigns `valueAccessor`) does not get them, so the datepicker also adds a validator to `ngControl.control`.
