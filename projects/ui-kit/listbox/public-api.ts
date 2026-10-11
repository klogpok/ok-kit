// The popup listbox of the kit's fields (`ui-select`, `ui-multi-select`, `ui-autocomplete`,
// `ui-time-input`). An internal entry point: apps import `UiOption`, `UiOptionGroup` and
// `UiOptionItem` from `@vplans/ui-kit/select`, which re-exports them.
export { UiOption, UiOptionGroup } from './option';
export type { UiOptionItem } from './option-items';
// Internal: shared with the fields of the kit. Not a public API.
export {
  UiListboxController as ɵUiListboxController,
  fieldListboxConfig as ɵfieldListboxConfig,
  injectListbox as ɵinjectListbox,
  provideUiListbox as ɵprovideUiListbox,
  type UiListboxConfig as ɵUiListboxConfig,
} from './listbox-controller';
export { UiListbox as ɵUiListbox } from './listbox';
export type { UiOptionHandle as ɵUiOptionHandle } from './option';
