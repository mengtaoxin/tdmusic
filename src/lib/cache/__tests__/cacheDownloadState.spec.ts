import { describe, expect, it, beforeEach } from 'vitest';

import {
  isTrackDownloading,
  reportCacheDownload,
  resetCacheDownloadStateForTests,
  subscribeCacheDownloads,
  trackDownloadPercent,
} from '../cacheDownloadState';

const track = { id: 't1', path: 'https://example.com/t1.mp3' };

describe('cacheDownloadState', () => {
  beforeEach(() => {
    resetCacheDownloadStateForTests();
  });

  it('is idle until a download is reported', () => {
    expect(isTrackDownloading(track)).toBe(false);
    expect(trackDownloadPercent(track)).toBeNull();
  });

  it('tracks an in-flight download by id or path and percent when total is known', () => {
    reportCacheDownload(track.path, track.id, { phase: 'download', loaded: 25, total: 100 });

    expect(isTrackDownloading(track)).toBe(true);
    expect(isTrackDownloading({ id: 't1', path: '/other' })).toBe(true);
    expect(isTrackDownloading({ id: 'other', path: track.path })).toBe(true);
    expect(isTrackDownloading({ id: 't2', path: 'https://example.com/t2.mp3' })).toBe(false);
    expect(trackDownloadPercent(track)).toBe(25);
  });

  it('returns null percent while total is unknown', () => {
    reportCacheDownload(track.path, track.id, { phase: 'download', loaded: 0, total: null });
    expect(isTrackDownloading(track)).toBe(true);
    expect(trackDownloadPercent(track)).toBeNull();
  });

  it('clears the track when the download finishes', () => {
    reportCacheDownload(track.path, track.id, { phase: 'download', loaded: 10, total: 10 });
    reportCacheDownload(track.path, track.id, { phase: 'done', loaded: 10, total: 10 });

    expect(isTrackDownloading(track)).toBe(false);
    expect(trackDownloadPercent(track)).toBeNull();
  });

  it('notifies subscribers on report', () => {
    const seen: number[] = [];
    const stop = subscribeCacheDownloads(() => {
      seen.push(1);
    });

    reportCacheDownload(track.path, track.id, { phase: 'download', loaded: 0, total: null });
    reportCacheDownload(track.path, track.id, { phase: 'done', loaded: 0, total: 0 });
    stop();
    reportCacheDownload(track.path, track.id, { phase: 'download', loaded: 0, total: null });

    expect(seen).toHaveLength(2);
  });
});
