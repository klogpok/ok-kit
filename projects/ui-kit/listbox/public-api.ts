// The popup listbox of the kit's fields (`ui-select`, `ui-multi-select`, `ui-autocomplete`,
// `ui-time-input`). An internal entry point: apps import `UiOption`, `UiOptionGroup` and
// `UiOptionItem` from `@vplans/ui-kit/select`, which re-exports them.
export { UiOption, UiOptionGroup } from './option';
export type { UiOptionItem } from './option-items';
// Internal: shared with the fields of the kit. Not a public API.
export {
  UiListbox as ɵUiListbox,
  injectListbox as ɵinjectListbox,
  provideUiListbox as ɵprovideUiListbox,
  type UiListboxConfig as ɵUiListboxConfig,
} from './listbox';
export { UiListboxPanel as ɵUiListboxPanel } from './listbox-panel';
export type { UiOptionHandle as ɵUiOptionHandle } from './option';
