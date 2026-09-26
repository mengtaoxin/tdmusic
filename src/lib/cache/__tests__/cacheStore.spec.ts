import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COVER_FILE_KEY,
  getCachedBlobUrl,
  getCachedFile,
  getMusicCacheSizeBytes,
  isTrackCached,
  listTrackMetas,
  putFiles,
  putMeta,
  resetCacheDbForTests,
  AUDIO_FILE_KEY,
} from '../cacheStore';
import { clearAllMusicCaches } from '../musicCache';

describe('music cache', () => {
  beforeEach(async () => {
    await resetCacheDbForTests();
    vi.restoreAllMocks();
  });

  it('stores and reads audio blobs', async () => {
    const sourceUrl = 'https://example.com/a.mp3';
    await putFiles(sourceUrl, [
      { relativePath: AUDIO_FILE_KEY, blob: new Blob(['audio'], { type: 'audio/mpeg' }) },
    ]);
    await putMeta({
      sourceUrl,
      id: 'a',
      status: 'ready',
      downloadedAt: Date.now(),
    });

    expect(await isTrackCached(sourceUrl)).toBe(true);
    const blob = await getCachedFile(sourceUrl);
    expect(blob).not.toBeNull();
    expect(await blob!.text()).toBe('audio');
  });

  it('stores and reads cover blobs', async () => {
    const sourceUrl = 'https://example.com/cover-track.mp3';
    await putFiles(sourceUrl, [
      { relativePath: COVER_FILE_KEY, blob: new Blob(['img'], { type: 'image/jpeg' }) },
    ]);
    const cover = await getCachedFile(sourceUrl, COVER_FILE_KEY);
    expect(cover).not.toBeNull();
    expect(await cover!.text()).toBe('img');
  });

  it('pending status is not treated as cached', async () => {
    const sourceUrl = 'https://example.com/pending.mp3';
    await putMeta({
      sourceUrl,
      status: 'pending',
      downloadedAt: Date.now(),
    });
    expect(await isTrackCached(sourceUrl)).toBe(false);
  });

  it('listTrackMetas returns all meta records', async () => {
    await putMeta({
      sourceUrl: 'https://example.com/1.mp3',
      status: 'ready',
      downloadedAt: 10,
    });
    await putMeta({
      sourceUrl: 'https://example.com/2.mp3',
      status: 'pending',
      downloadedAt: 20,
    });
    const metas = await listTrackMetas();
    expect(metas).toHaveLength(2);
    expect(metas.map((m) => m.sourceUrl).sort()).toEqual([
      'https://example.com/1.mp3',
      'https://example.com/2.mp3',
    ]);
  });

  it('reuses db connection across successive operations', async () => {
    const sourceUrl = 'https://example.com/reuse.mp3';
    await putMeta({
      sourceUrl,
      status: 'ready',
      downloadedAt: Date.now(),
    });
    expect(await isTrackCached(sourceUrl)).toBe(true);
    expect(await isTrackCached(sourceUrl)).toBe(true);
  });

  it('returns 0 when no files are cached', async () => {
    expect(await getMusicCacheSizeBytes()).toBe(0);
  });

  it('sums audio and cover blob sizes across tracks', async () => {
    await putFiles('https://example.com/a.mp3', [
      { relativePath: AUDIO_FILE_KEY, blob: new Blob(['12345']) },
      { relativePath: COVER_FILE_KEY, blob: new Blob(['img']) },
    ]);
    await putFiles('https://example.com/b.mp3', [
      { relativePath: AUDIO_FILE_KEY, blob: new Blob(['xy']) },
    ]);

    expect(await getMusicCacheSizeBytes()).toBe(10);
  });

  it('clearAllMusicCaches removes records', async () => {
    const sourceUrl = 'https://example.com/c.mp3';
    await putFiles(sourceUrl, [{ relativePath: AUDIO_FILE_KEY, blob: new Blob(['x']) }]);
    await putMeta({
      sourceUrl,
      status: 'ready',
      downloadedAt: Date.now(),
    });
    await clearAllMusicCaches();
    expect(await isTrackCached(sourceUrl)).toBe(false);
  });

  it('getCachedBlobUrl rewraps audio MIME from path without mutating IndexedDB', async () => {
    const sourceUrl = 'https://example.com/batch01/song.flac?x=1';
    const stored = new Blob(['fLaC-bytes'], { type: 'application/octet-stream' });
    await putFiles(sourceUrl, [{ relativePath: AUDIO_FILE_KEY, blob: stored }]);

    const createObjectURL = vi.spyOn(URL, 'createObjectURL');
    const url = await getCachedBlobUrl(sourceUrl);
    expect(url).toMatch(/^blob:/);

    expect(createObjectURL).toHaveBeenCalledOnce();
    const playable = createObjectURL.mock.calls[0]![0] as Blob;
    expect(playable.type).toBe('audio/flac');
    expect(await playable.text()).toBe('fLaC-bytes');

    const fromDb = await getCachedFile(sourceUrl);
    expect(fromDb).not.toBeNull();
    expect(fromDb!.type).toBe('application/octet-stream');
    expect(await fromDb!.text()).toBe('fLaC-bytes');
  });

  it('getCachedBlobUrl does not rewrite cover blob MIME from the audio path', async () => {
    const sourceUrl = 'https://example.com/song.flac';
    await putFiles(sourceUrl, [
      { relativePath: COVER_FILE_KEY, blob: new Blob(['img'], { type: 'image/jpeg' }) },
    ]);

    const createObjectURL = vi.spyOn(URL, 'createObjectURL');
    await getCachedBlobUrl(sourceUrl, COVER_FILE_KEY);

    expect(createObjectURL).toHaveBeenCalledOnce();
    const cover = createObjectURL.mock.calls[0]![0] as Blob;
    expect(cover.type).toBe('image/jpeg');
  });
});
