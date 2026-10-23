/** Size scale shared by all sized components. */
export type UiSize = 'sm' | 'md' | 'lg';

/** Size scale of the choice controls (checkbox, radio group): `UiSize` plus `xl`, for emphasis. */
export type UiChoiceSize = UiSize | 'xl';

/** Visual emphasis shared by action components (button, icon-button, ...). */
export type UiVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
