/** Format a byte count for display (1024-based units). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  if (unit === 0) return `${Math.round(value)} B`;

  const rounded = Math.round(value * 10) / 10;
  const amount = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${amount} ${units[unit]}`;
}
