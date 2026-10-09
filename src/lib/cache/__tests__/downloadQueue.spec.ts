import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearEnsureInFlight } from '../cacheIngest';
import { resetCacheDownloadStateForTests } from '../cacheDownloadState';
import {
  AUDIO_FILE_KEY,
  isTrackCached,
  listDownloadQueue,
  putFiles,
  putMeta,
  resetCacheDbForTests,
} from '../cacheStore';
import { resetDownloadLimiterForTests } from '../downloadLimiter';
import {
  clearManualDownloads,
  enqueueManualDownloads,
  isTrackQueuedForDownload,
  resetManualDownloadsForTests,
  resumeManualDownloads,
  setManualDownloadHooks,
} from '../downloadQueue';

function okResponse(url: string) {
  return {
    ok: true,
    headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
    body: null,
    blob: async () => new Blob([url], { type: 'audio/mpeg' }),
  } as Response;
}

function stubFetchOk() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => okResponse(String(input)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Simulates closing and reopening the page: in-memory state is lost, IndexedDB is kept. */
function simulateReload() {
  resetManualDownloadsForTests();
  resetDownloadLimiterForTests();
  clearEnsureInFlight();
}

async function queuedUrls() {
  return (await listDownloadQueue()).map((entry) => entry.sourceUrl);
}

describe('downloadQueue', () => {
  beforeEach(async () => {
    simulateReload();
    resetCacheDownloadStateForTests();
    setManualDownloadHooks({});
    await resetCacheDbForTests();
    vi.restoreAllMocks();
  });

  it('downloads enqueued tracks and removes them from the persisted queue', async () => {
    stubFetchOk();
    const onCached = vi.fn();
    setManualDownloadHooks({ onCached });

    await enqueueManualDownloads([
      { id: 'a', path: 'https://example.com/a.mp3' },
      { id: 'b', path: '/b.mp3' },
    ]);

    await vi.waitFor(async () => {
      expect(await isTrackCached('https://example.com/a.mp3')).toBe(true);
      expect(await isTrackCached('/b.mp3')).toBe(true);
      expect(await queuedUrls()).toEqual([]);
    });
    expect(onCached).toHaveBeenCalledWith('a');
    expect(onCached).toHaveBeenCalledWith('b');
    expect(isTrackQueuedForDownload('/b.mp3')).toBe(false);
  });

  it('skips non-playable, already cached, and already queued tracks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    );
    await putFiles('/cached.mp3', [{ relativePath: AUDIO_FILE_KEY, blob: new Blob(['x']) }]);
    await putMeta({ sourceUrl: '/cached.mp3', status: 'ready', downloadedAt: 1 });

    await enqueueManualDownloads([
      { id: 'rel', path: 'relative.mp3' },
      { id: 'cached', path: '/cached.mp3' },
      { id: 'new', path: '/new.mp3' },
    ]);
    await enqueueManualDownloads([{ id: 'new', path: '/new.mp3' }]);

    expect(await queuedUrls()).toEqual(['/new.mp3']);
    expect(isTrackQueuedForDownload('/new.mp3')).toBe(true);
    expect(isTrackQueuedForDownload('/cached.mp3')).toBe(false);
  });

  it('continues unfinished downloads after the page is reopened', async () => {
    const hangingFetch = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', hangingFetch);
    await enqueueManualDownloads([
      { id: '1', path: '/1.mp3' },
      { id: '2', path: '/2.mp3' },
      { id: '3', path: '/3.mp3' },
      { id: '4', path: '/4.mp3' },
    ]);
    await vi.waitFor(() => expect(hangingFetch).toHaveBeenCalledTimes(3));
    expect(await queuedUrls()).toEqual(['/1.mp3', '/2.mp3', '/3.mp3', '/4.mp3']);

    simulateReload();
    expect(isTrackQueuedForDownload('/1.mp3')).toBe(false);
    const fetchMock = stubFetchOk();

    await resumeManualDownloads();
    expect(isTrackQueuedForDownload('/1.mp3')).toBe(true);

    await vi.waitFor(async () => {
      expect(await queuedUrls()).toEqual([]);
    });
    for (const path of ['/1.mp3', '/2.mp3', '/3.mp3', '/4.mp3']) {
      // oxlint-disable-next-line no-await-in-loop -- assertions are independent reads
      expect(await isTrackCached(path)).toBe(true);
    }
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/1.mp3',
      '/2.mp3',
      '/3.mp3',
      '/4.mp3',
    ]);
  });

  it('drops a failed download from the queue and reports it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => ({ ok: false, status: 404, headers: new Headers(), body: null }) as Response,
      ),
    );
    const onFailed = vi.fn();
    setManualDownloadHooks({ onFailed });

    await enqueueManualDownloads([{ id: 'x', path: '/missing.mp3' }]);

    await vi.waitFor(async () => {
      expect(await queuedUrls()).toEqual([]);
    });
    expect(onFailed).toHaveBeenCalledWith('/missing.mp3', expect.any(Error));
    expect(await isTrackCached('/missing.mp3')).toBe(false);
  });

  it('clears the persisted queue and stops starting queued downloads', async () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    await enqueueManualDownloads(
      [1, 2, 3, 4, 5].map((n) => ({ id: String(n), path: `/${n}.mp3` })),
    );
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    await clearManualDownloads();

    expect(await queuedUrls()).toEqual([]);
    expect(isTrackQueuedForDownload('/4.mp3')).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
