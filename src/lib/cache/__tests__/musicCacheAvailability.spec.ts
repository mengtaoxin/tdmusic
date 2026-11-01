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

  it('recognizes Dexie / IndexedDB storage error names', () => {
    expect(
      isMusicCacheStorageError(Object.assign(new Error('open'), { name: 'OpenFailedError' })),
    ).toBe(true);
    expect(
      isMusicCacheStorageError(Object.assign(new Error('quota'), { name: 'QuotaExceededError' })),
    ).toBe(true);
    expect(isMusicCacheStorageError(musicCacheUnavailableError())).toBe(true);
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
