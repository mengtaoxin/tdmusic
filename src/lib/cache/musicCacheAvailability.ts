/** Session flag: local music cache cannot be used (e.g. private browsing / no OPFS). */
let unavailable = false;

const STORAGE_ERROR_NAMES = new Set([
  'OpenFailedError',
  'MissingAPIError',
  'DatabaseClosedError',
  'InvalidStateError',
  'UnknownError',
  'QuotaExceededError',
  'SecurityError',
  'UnsupportedError',
  'MusicCacheUnavailableError',
  'SQLite3Error',
  'WasmAllocError',
]);

function errorName(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as { name: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return undefined;
}

function nestedStorageErrors(error: object): unknown[] {
  const nested: unknown[] = [];
  if ('inner' in error) nested.push(error.inner);
  if ('failures' in error && Array.isArray(error.failures)) nested.push(...error.failures);
  if ('cause' in error) nested.push(error.cause);
  return nested;
}

function hasStorageCause(error: unknown, seen: Set<unknown>): boolean {
  if (!error || typeof error !== 'object') return false;
  if (seen.has(error)) return false;
  seen.add(error);
  const name = errorName(error);
  if (name && STORAGE_ERROR_NAMES.has(name)) return true;
  return nestedStorageErrors(error).some((nested) => hasStorageCause(nested, seen));
}

/** True when the failure is from local SQLite / OPFS storage, not a network download. */
export function isMusicCacheStorageError(error: unknown): boolean {
  return hasStorageCause(error, new Set());
}

export function isMusicCacheUnavailable(): boolean {
  return unavailable;
}

export function markMusicCacheUnavailable(): void {
  unavailable = true;
}

export function musicCacheUnavailableError(): Error {
  return Object.assign(new Error('Music cache unavailable'), {
    name: 'MusicCacheUnavailableError',
  });
}

/** Reset session availability (tests). */
export function resetMusicCacheAvailabilityForTests(): void {
  unavailable = false;
}
