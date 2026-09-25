import { UiIconDefinition } from './icon-registry';

// Built-in icons. Tree-shakable: register only what you use via provideUiIcons([...]).

const svg = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const uiIconCheck = {
  name: 'check',
  svg: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
} as const satisfies UiIconDefinition;

export const uiIconMinus = {
  name: 'minus',
  svg: svg('<path d="M5 12h14"/>'),
} as const satisfies UiIconDefinition;

export const uiIconPlus = {
  name: 'plus',
  svg: svg('<path d="M12 5v14M5 12h14"/>'),
} as const satisfies UiIconDefinition;

export const uiIconX = {
  name: 'x',
  svg: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
} as const satisfies UiIconDefinition;

export const uiIconChevronDown = {
  name: 'chevron-down',
  svg: svg('<path d="M6 9l6 6 6-6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconChevronUp = {
  name: 'chevron-up',
  svg: svg('<path d="M6 15l6-6 6 6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconChevronLeft = {
  name: 'chevron-left',
  svg: svg('<path d="M15 6l-6 6 6 6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconChevronRight = {
  name: 'chevron-right',
  svg: svg('<path d="M9 6l6 6-6 6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconChevronsLeft = {
  name: 'chevrons-left',
  svg: svg('<path d="M18 6l-6 6 6 6M11 6l-6 6 6 6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconChevronsRight = {
  name: 'chevrons-right',
  svg: svg('<path d="M6 6l6 6-6 6M13 6l6 6-6 6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconArrowLeft = {
  name: 'arrow-left',
  svg: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconArrowRight = {
  name: 'arrow-right',
  svg: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconArrowUp = {
  name: 'arrow-up',
  svg: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconArrowDown = {
  name: 'arrow-down',
  svg: svg('<path d="M12 5v14M18 13l-6 6-6-6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconSearch = {
  name: 'search',
  svg: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
} as const satisfies UiIconDefinition;

export const uiIconInfo = {
  name: 'info',
  svg: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.01"/>'),
} as const satisfies UiIconDefinition;

export const uiIconAlertCircle = {
  name: 'alert-circle',
  svg: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16.5v.01"/>'),
} as const satisfies UiIconDefinition;

export const uiIconAlertTriangle = {
  name: 'alert-triangle',
  svg: svg('<path d="M12 3.5L2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.5v.01"/>'),
} as const satisfies UiIconDefinition;

export const uiIconCheckCircle = {
  name: 'check-circle',
  svg: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconEye = {
  name: 'eye',
  svg: svg(
    '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconEyeOff = {
  name: 'eye-off',
  svg: svg(
    '<path d="M4 4l16 16"/><path d="M10.6 5.6A9.7 9.7 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-3 3.8M6.6 6.6A16.8 16.8 0 0 0 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 4.4-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconCalendar = {
  name: 'calendar',
  svg: svg(
    '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconMenu = {
  name: 'menu',
  svg: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
} as const satisfies UiIconDefinition;

export const uiIconMoreHorizontal = {
  name: 'more-horizontal',
  svg: svg('<path d="M6 12h.01M12 12h.01M18 12h.01"/>'),
} as const satisfies UiIconDefinition;

export const uiIconTrash = {
  name: 'trash',
  svg: svg('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>'),
} as const satisfies UiIconDefinition;

export const uiIconEdit = {
  name: 'edit',
  svg: svg('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
} as const satisfies UiIconDefinition;

export const uiIconMoreVertical = {
  name: 'more-vertical',
  svg: svg('<path d="M12 6h.01M12 12h.01M12 18h.01"/>'),
} as const satisfies UiIconDefinition;

export const uiIconGripVertical = {
  name: 'grip-vertical',
  svg: svg('<path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"/>'),
} as const satisfies UiIconDefinition;

export const uiIconXCircle = {
  name: 'x-circle',
  svg: svg('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
} as const satisfies UiIconDefinition;

export const uiIconHelpCircle = {
  name: 'help-circle',
  svg: svg(
    '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconFilter = {
  name: 'filter',
  svg: svg('<path d="M4 5h16l-6 7.5V19l-4 1.5v-8L4 5z"/>'),
} as const satisfies UiIconDefinition;

export const uiIconSliders = {
  name: 'sliders',
  svg: svg(
    '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconDownload = {
  name: 'download',
  svg: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
} as const satisfies UiIconDefinition;

export const uiIconUpload = {
  name: 'upload',
  svg: svg('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
} as const satisfies UiIconDefinition;

export const uiIconCopy = {
  name: 'copy',
  svg: svg(
    '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconExternalLink = {
  name: 'external-link',
  svg: svg(
    '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconUser = {
  name: 'user',
  svg: svg('<circle cx="12" cy="8" r="4"/><path d="M4 20.5a8 8 0 0 1 16 0"/>'),
} as const satisfies UiIconDefinition;

export const uiIconUsers = {
  name: 'users',
  svg: svg(
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconHome = {
  name: 'home',
  svg: svg('<path d="M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>'),
} as const satisfies UiIconDefinition;

export const uiIconBell = {
  name: 'bell',
  svg: svg('<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20.5a2 2 0 0 0 4 0"/>'),
} as const satisfies UiIconDefinition;

export const uiIconClock = {
  name: 'clock',
  svg: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
} as const satisfies UiIconDefinition;

export const uiIconRefresh = {
  name: 'refresh',
  svg: svg('<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>'),
} as const satisfies UiIconDefinition;

export const uiIconLock = {
  name: 'lock',
  svg: svg(
    '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5v-3a4 4 0 0 1 8 0v3"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconLogOut = {
  name: 'log-out',
  svg: svg('<path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3M16 16l4-4-4-4M20 12H9"/>'),
} as const satisfies UiIconDefinition;

export const uiIconFile = {
  name: 'file',
  svg: svg(
    '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10l-5-5zM14 3.5v5h5"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconPaperclip = {
  name: 'paperclip',
  svg: svg(
    '<path d="M20 11.5l-8.2 8.2a5 5 0 0 1-7-7L13 4.5a3.3 3.3 0 0 1 4.7 4.7l-8.3 8.3a1.7 1.7 0 0 1-2.4-2.4l7.5-7.6"/>',
  ),
} as const satisfies UiIconDefinition;

export const uiIconArrowsUpDown = {
  name: 'arrows-up-down',
  svg: svg('<path d="M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4"/>'),
} as const satisfies UiIconDefinition;

/** All built-in icons. Convenient for prototypes; prefer registering individual icons in apps. */
export const UI_ICONS_ALL = [
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
  uiIconArrowUp,
  uiIconArrowDown,
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
  uiIconMoreVertical,
  uiIconGripVertical,
  uiIconXCircle,
  uiIconHelpCircle,
  uiIconFilter,
  uiIconSliders,
  uiIconDownload,
  uiIconUpload,
  uiIconCopy,
  uiIconExternalLink,
  uiIconUser,
  uiIconUsers,
  uiIconHome,
  uiIconBell,
  uiIconClock,
  uiIconRefresh,
  uiIconLock,
  uiIconLogOut,
  uiIconFile,
  uiIconPaperclip,
  uiIconArrowsUpDown,
] as const satisfies readonly UiIconDefinition[];

/** Names of the built-in icons. */
export type UiIconName = (typeof UI_ICONS_ALL)[number]['name'];
