import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AUDIO_FILE_KEY,
  isTrackCached,
  listTrackMetas,
  putFiles,
  putMeta,
  resetCacheDbForTests,
} from '../cacheStore';
import { ensureQuota } from '../cacheEviction';
import { clearTrackCache } from '../musicCache';

describe('ensureQuota', () => {
  beforeEach(async () => {
    await resetCacheDbForTests();
    vi.restoreAllMocks();
  });

  it('evicts oldest ready tracks when usage would exceed soft quota', async () => {
    await putFiles('https://example.com/old.mp3', [
      { relativePath: AUDIO_FILE_KEY, blob: new Blob(['old']) },
    ]);
    await putMeta({
      sourceUrl: 'https://example.com/old.mp3',
      status: 'ready',
      downloadedAt: 1,
    });
    await putFiles('https://example.com/new.mp3', [
      { relativePath: AUDIO_FILE_KEY, blob: new Blob(['new']) },
    ]);
    await putMeta({
      sourceUrl: 'https://example.com/new.mp3',
      status: 'ready',
      downloadedAt: 100,
    });

    let usage = 900;
    vi.stubGlobal('navigator', {
      storage: {
        estimate: vi
          .fn<() => Promise<{ usage: number; quota: number }>>()
          .mockImplementation(async () => {
            const metas = await listTrackMetas();
            usage = metas.length * 450;
            return { usage, quota: 1000 };
          }),
      },
    });

    await ensureQuota(100);

    expect(await isTrackCached('https://example.com/old.mp3')).toBe(false);
    expect(await isTrackCached('https://example.com/new.mp3')).toBe(true);
    const metas = await listTrackMetas();
    expect(metas.map((m) => m.sourceUrl)).toEqual(['https://example.com/new.mp3']);
  });

  it('skips eviction when estimate has no quota', async () => {
    await putMeta({
      sourceUrl: 'https://example.com/a.mp3',
      status: 'ready',
      downloadedAt: 1,
    });
    vi.stubGlobal('navigator', {
      storage: {
        estimate: vi.fn<() => Promise<{ usage: number }>>().mockResolvedValue({ usage: 100 }),
      },
    });
    await ensureQuota(999_999);
    expect(await isTrackCached('https://example.com/a.mp3')).toBe(true);
  });
});

describe('clearTrackCache', () => {
  beforeEach(async () => {
    await resetCacheDbForTests();
  });

  it('removes a single track cache', async () => {
    await putFiles('https://example.com/x.mp3', [
      { relativePath: AUDIO_FILE_KEY, blob: new Blob(['x']) },
    ]);
    await putMeta({
      sourceUrl: 'https://example.com/x.mp3',
      status: 'ready',
      downloadedAt: 1,
    });
    await clearTrackCache('https://example.com/x.mp3');
    expect(await isTrackCached('https://example.com/x.mp3')).toBe(false);
  });
});
