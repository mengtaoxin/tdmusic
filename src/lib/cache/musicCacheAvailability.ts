/** Session flag: IndexedDB music cache cannot be used (e.g. private browsing). */
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
]);

function errorName(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as { name: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return undefined;
}

/** True when the failure is from IndexedDB / Dexie storage, not a network download. */
export function isMusicCacheStorageError(error: unknown): boolean {
  const name = errorName(error);
  if (name && STORAGE_ERROR_NAMES.has(name)) return true;
  if (error && typeof error === 'object' && 'inner' in error) {
    return isMusicCacheStorageError((error as { inner: unknown }).inner);
  }
  return false;
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
