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

/** Same file picked twice: same name, size and modification time. */
export function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}
