import { beforeEach, describe, expect, it } from 'vitest';

import {
  isMusicCacheStorageError,
  isMusicCacheUnavailable,
  markMusicCacheUnavailable,
  musicCacheUnavailableError,
  resetMusicCacheAvailabilityForTests,
} from '../musicCacheAvailability';

describe('musicCacheAvailability', () => {
  beforeEach(() => {
    resetMusicCacheAvailabilityForTests();
  });

  it('recognizes SQLite / OPFS storage error names', () => {
    expect(
      isMusicCacheStorageError(Object.assign(new Error('open'), { name: 'OpenFailedError' })),
    ).toBe(true);
    expect(
      isMusicCacheStorageError(Object.assign(new Error('quota'), { name: 'QuotaExceededError' })),
    ).toBe(true);
    expect(
      isMusicCacheStorageError(Object.assign(new Error('sqlite'), { name: 'SQLite3Error' })),
    ).toBe(true);
    expect(isMusicCacheStorageError(musicCacheUnavailableError())).toBe(true);
  });

  it('treats nested storage failures as storage errors', () => {
    const writeError = Object.assign(new Error('OPFS write failed'), { name: 'UnknownError' });
    const wrapped = Object.assign(new Error('cache write failed'), {
      name: 'Error',
      cause: writeError,
    });
    expect(isMusicCacheStorageError(wrapped)).toBe(true);
  });

  it('does not treat network download failures as storage errors', () => {
    expect(isMusicCacheStorageError(new Error('downloadFailed:404'))).toBe(false);
    expect(
      isMusicCacheStorageError(Object.assign(new Error('aborted'), { name: 'AbortError' })),
    ).toBe(false);
  });

  it('remembers unavailability for the session', () => {
    expect(isMusicCacheUnavailable()).toBe(false);
    markMusicCacheUnavailable();
    expect(isMusicCacheUnavailable()).toBe(true);
  });
});
