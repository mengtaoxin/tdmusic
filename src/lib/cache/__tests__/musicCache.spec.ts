import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COVER_FILE_KEY,
  getCachedFile,
  putFiles,
  AUDIO_FILE_KEY,
  resetCacheDbForTests,
} from '../cacheStore';
import * as cacheEviction from '../cacheEviction';
import { putCoverFile } from '../musicCache';
import { ensureTrackMetadata } from '../trackMetadata';
import * as musicCache from '../musicCache';

describe('musicCache facade', () => {
  beforeEach(async () => {
    await resetCacheDbForTests();
    vi.restoreAllMocks();
  });

  it('putCoverFile enforces quota then stores the cover blob', async () => {
    const sourceUrl = 'https://example.com/song.mp3';
    const cover = new Blob(['cover'], { type: 'image/png' });
    const ensureQuota = vi.spyOn(cacheEviction, 'ensureQuota').mockResolvedValue(undefined);

    await putCoverFile(sourceUrl, cover);

    expect(ensureQuota).toHaveBeenCalledWith(cover.size);
    const stored = await getCachedFile(sourceUrl, COVER_FILE_KEY);
    expect(stored).not.toBeNull();
    expect(await stored!.text()).toBe('cover');
  });

  it('ensureTrackMetadata stores covers via putCoverFile (not raw cacheStore)', async () => {
    const sourceUrl = 'https://example.com/via-facade.mp3';
    await putFiles(sourceUrl, [{ relativePath: AUDIO_FILE_KEY, blob: new Blob(['audio']) }]);

    const putCover = vi.spyOn(musicCache, 'putCoverFile').mockResolvedValue(undefined);
    const coverBlob = new Blob(['cover-bytes'], { type: 'image/png' });

    await ensureTrackMetadata(sourceUrl, {
      parser: async () => ({
        title: 'T',
        artist: 'A',
        album: 'B',
        coverBlob,
      }),
    });

    expect(putCover).toHaveBeenCalledWith(sourceUrl, coverBlob);
  });
});
