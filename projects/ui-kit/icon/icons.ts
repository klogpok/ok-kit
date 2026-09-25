import { UiIconDefinition } from './icon-registry';

// Built-in icons. Tree-shakable: register only what you use via provideUiIcons([...]).

const svg = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const uiIconCheck: UiIconDefinition = {
  name: 'check',
  svg: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
};

export const uiIconMinus: UiIconDefinition = { name: 'minus', svg: svg('<path d="M5 12h14"/>') };

export const uiIconPlus: UiIconDefinition = {
  name: 'plus',
  svg: svg('<path d="M12 5v14M5 12h14"/>'),
};

export const uiIconX: UiIconDefinition = {
  name: 'x',
  svg: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
};

export const uiIconChevronDown: UiIconDefinition = {
  name: 'chevron-down',
  svg: svg('<path d="M6 9l6 6 6-6"/>'),
};

export const uiIconChevronUp: UiIconDefinition = {
  name: 'chevron-up',
  svg: svg('<path d="M6 15l6-6 6 6"/>'),
};

export const uiIconChevronLeft: UiIconDefinition = {
  name: 'chevron-left',
  svg: svg('<path d="M15 6l-6 6 6 6"/>'),
};

export const uiIconChevronRight: UiIconDefinition = {
  name: 'chevron-right',
  svg: svg('<path d="M9 6l6 6-6 6"/>'),
};

export const uiIconChevronsLeft: UiIconDefinition = {
  name: 'chevrons-left',
  svg: svg('<path d="M18 6l-6 6 6 6M11 6l-6 6 6 6"/>'),
};

export const uiIconChevronsRight: UiIconDefinition = {
  name: 'chevrons-right',
  svg: svg('<path d="M6 6l6 6-6 6M13 6l6 6-6 6"/>'),
};

export const uiIconArrowLeft: UiIconDefinition = {
  name: 'arrow-left',
  svg: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
};

export const uiIconArrowRight: UiIconDefinition = {
  name: 'arrow-right',
  svg: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
};

export const uiIconSearch: UiIconDefinition = {
  name: 'search',
  svg: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
};

export const uiIconInfo: UiIconDefinition = {
  name: 'info',
  svg: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.01"/>'),
};

export const uiIconAlertCircle: UiIconDefinition = {
  name: 'alert-circle',
  svg: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16.5v.01"/>'),
};

export const uiIconAlertTriangle: UiIconDefinition = {
  name: 'alert-triangle',
  svg: svg('<path d="M12 3.5L2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.5v.01"/>'),
};

export const uiIconCheckCircle: UiIconDefinition = {
  name: 'check-circle',
  svg: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'),
};

export const uiIconEye: UiIconDefinition = {
  name: 'eye',
  svg: svg(
    '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  ),
};

export const uiIconEyeOff: UiIconDefinition = {
  name: 'eye-off',
  svg: svg(
    '<path d="M4 4l16 16"/><path d="M10.6 5.6A9.7 9.7 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-3 3.8M6.6 6.6A16.8 16.8 0 0 0 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 4.4-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  ),
};

export const uiIconCalendar: UiIconDefinition = {
  name: 'calendar',
  svg: svg(
    '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  ),
};

export const uiIconMenu: UiIconDefinition = {
  name: 'menu',
  svg: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
};

export const uiIconMoreHorizontal: UiIconDefinition = {
  name: 'more-horizontal',
  svg: svg('<path d="M6 12h.01M12 12h.01M18 12h.01"/>'),
};

export const uiIconTrash: UiIconDefinition = {
  name: 'trash',
  svg: svg('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>'),
};

export const uiIconEdit: UiIconDefinition = {
  name: 'edit',
  svg: svg('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
};

/** All built-in icons. Convenient for prototypes; prefer registering individual icons in apps. */
export const UI_ICONS_ALL: readonly UiIconDefinition[] = [
  uiIconCheck,
  uiIconMinus,
  uiIconPlus,
  uiIconX,
  uiIconChevronDown,
  uiIconChevronUp,
  uiIconChevronLeft,
  uiIconChevronRight,
  uiIconChevronsLeft,
  uiIconChevronsRight,
  uiIconArrowLeft,
  uiIconArrowRight,
  uiIconSearch,
  uiIconInfo,
  uiIconAlertCircle,
  uiIconAlertTriangle,
  uiIconCheckCircle,
  uiIconEye,
  uiIconEyeOff,
  uiIconCalendar,
  uiIconMenu,
  uiIconMoreHorizontal,
  uiIconTrash,
  uiIconEdit,
];
