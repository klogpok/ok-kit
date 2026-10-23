import {
  UiIconDefinition,
  uiIconFile,
  uiIconFileArchive,
  uiIconFileDrawing,
  uiIconFileImage,
  uiIconFilePdf,
  uiIconFilePresentation,
  uiIconFileSpreadsheet,
  uiIconFileText,
} from '@vplans/ui-kit/icon';

/** Why a file cannot be attached. */
export type UiFileProblem = 'type' | 'size';

/**
 * Whether `file` matches an `accept` list like the one of `<input type="file">`:
 * extensions (`.pdf`), wildcards (`image/*`) and MIME types (`application/pdf`).
 * An empty list accepts everything.
 */
export function acceptsFile(file: File, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/** The first problem of a file, or `null` when it can be attached. */
export function fileProblem(
  file: File,
  accept: string,
  maxSize: number | null,
): UiFileProblem | null {
  if (!acceptsFile(file, accept)) return 'type';
  if (maxSize !== null && file.size > maxSize) return 'size';
  return null;
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

/** A size for people: "820 bytes", "12.5 KB", "3.2 MB", in the format of `locale`. */
export function formatFileSize(bytes: number, locale: string): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: UNITS[unit],
    unitDisplay: unit === 0 ? 'long' : 'short',
    maximumFractionDigits: unit === 0 || value >= 100 ? 0 : 1,
  }).format(value);
}

const FILE_TYPES: readonly { icon: UiIconDefinition; types: string[]; extensions: string[] }[] = [
  {
    // Before images: AutoCAD files have `image/vnd.dwg` and `image/vnd.dxf`.
    icon: uiIconFileDrawing,
    types: [
      'image/vnd.dwg',
      'image/vnd.dxf',
      'model/vnd.dwf',
      'application/acad',
      'application/dxf',
      'application/x-dwg',
    ],
    extensions: ['dwg', 'dxf', 'dwf', 'dgn', 'ifc', 'rvt'],
  },
  {
    icon: uiIconFileImage,
    types: ['image/*'],
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic', 'avif'],
  },
  { icon: uiIconFilePdf, types: ['application/pdf'], extensions: ['pdf'] },
  {
    icon: uiIconFileText,
    types: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.*',
      'application/vnd.oasis.opendocument.text',
      'application/rtf',
      'text/rtf',
      'text/plain',
    ],
    extensions: ['doc', 'docx', 'odt', 'rtf', 'txt'],
  },
  {
    icon: uiIconFileSpreadsheet,
    types: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.*',
      'application/vnd.oasis.opendocument.spreadsheet',
      'text/csv',
    ],
    extensions: ['xls', 'xlsx', 'csv', 'ods'],
  },
  {
    icon: uiIconFilePresentation,
    types: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.*',
      'application/vnd.oasis.opendocument.presentation',
    ],
    extensions: ['ppt', 'pptx', 'odp'],
  },
  {
    icon: uiIconFileArchive,
    types: [
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.rar',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-tar',
    ],
    extensions: ['zip', 'rar', '7z', 'gz', 'tar'],
  },
];

const matchesType = (type: string, pattern: string): boolean =>
  pattern.endsWith('*') ? type.startsWith(pattern.slice(0, -1)) : type === pattern;

/**
 * The icon of a file's type: by its MIME type, else by the extension of its name (browsers leave
 * the type of `.dwg` and often `.csv` or `.rar` empty). Unknown files get `uiIconFile`.
 */
export function fileTypeIcon(file: Pick<File, 'name' | 'type'>): UiIconDefinition {
  const type = file.type.toLowerCase();
  const byType = type && FILE_TYPES.find((t) => t.types.some((p) => matchesType(type, p)));
  if (byType) return byType.icon;
  const dot = file.name.lastIndexOf('.');
  const extension = dot < 0 ? '' : file.name.slice(dot + 1).toLowerCase();
  return FILE_TYPES.find((t) => t.extensions.includes(extension))?.icon ?? uiIconFile;
}

/** Same file picked twice: same name, size and modification time. */
export function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}
