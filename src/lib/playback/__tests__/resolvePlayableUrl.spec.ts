import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as musicCache from '../../cache/musicCache';
import {
  AUDIO_FILE_KEY,
  getCachedFile,
  isTrackCached,
  resetCacheDbForTests,
} from '../../cache/cacheStore';
import { resetMusicCacheAvailabilityForTests } from '../../cache/musicCacheAvailability';
import { resolvePlayableUrl } from '../resolvePlayableUrl';

describe('resolvePlayableUrl', () => {
  beforeEach(async () => {
    await resetCacheDbForTests();
    resetMusicCacheAvailabilityForTests();
    vi.restoreAllMocks();
  });

  it('caches remote audio and returns a blob URL', async () => {
    const path = 'https://example.com/song.mp3';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
        body: null,
        blob: async () => new Blob(['remote'], { type: 'audio/mpeg' }),
      }),
    );

    const url = await resolvePlayableUrl(path, 'r1');

    expect(url).toMatch(/^blob:/);
    expect(await isTrackCached(path)).toBe(true);
    expect(await getCachedFile(path, AUDIO_FILE_KEY)).not.toBeNull();
  });

  it('caches site-absolute audio and returns a blob URL', async () => {
    const path = '/sample-1.mp3';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
        body: null,
        blob: async () => new Blob(['local'], { type: 'audio/mpeg' }),
      }),
    );

    const url = await resolvePlayableUrl(path, 'local');

    expect(url).toMatch(/^blob:/);
    expect(await isTrackCached(path)).toBe(true);
    expect(fetch).toHaveBeenCalledWith(path, expect.objectContaining({ cache: 'no-cache' }));
    const blob = await getCachedFile(path);
    expect(blob).not.toBeNull();
    expect(await blob!.text()).toBe('local');
  });

  it('requests a high-priority download slot for play', async () => {
    const ensure = vi.spyOn(musicCache, 'ensureTrackCached').mockResolvedValue(undefined);
    vi.spyOn(musicCache, 'getCachedBlobUrl').mockResolvedValue('blob:play');

    await resolvePlayableUrl('https://example.com/now.mp3', 'now');

    expect(ensure).toHaveBeenCalledWith('https://example.com/now.mp3', 'now', {
      priority: 'high',
    });
  });

  it('falls back to the source URL when IndexedDB cache storage fails', async () => {
    const path = 'https://example.com/private.mp3';
    const storageError = Object.assign(new Error('Failed to open IndexedDB'), {
      name: 'OpenFailedError',
    });
    const ensure = vi.spyOn(musicCache, 'ensureTrackCached').mockRejectedValue(storageError);

    await expect(resolvePlayableUrl(path, 'private')).resolves.toBe(path);
    expect(ensure).toHaveBeenCalledTimes(1);
  });

  it('keeps failing when the download itself fails (not a cache storage problem)', async () => {
    const path = 'https://example.com/missing.mp3';
    vi.spyOn(musicCache, 'ensureTrackCached').mockRejectedValue(new Error('downloadFailed:404'));

    await expect(resolvePlayableUrl(path, 'missing')).rejects.toThrow(/downloadFailed:404/);
  });

  it('skips the cache on later plays after IndexedDB was marked unavailable', async () => {
    const path = 'https://example.com/again.mp3';
    const storageError = Object.assign(new Error('IndexedDB missing'), {
      name: 'MissingAPIError',
    });
    const ensure = vi.spyOn(musicCache, 'ensureTrackCached').mockRejectedValue(storageError);

    await expect(resolvePlayableUrl(path, 'a')).resolves.toBe(path);
    ensure.mockClear();

    await expect(resolvePlayableUrl(path, 'a')).resolves.toBe(path);
    expect(ensure).not.toHaveBeenCalled();
  });
});
