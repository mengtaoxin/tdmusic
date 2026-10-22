import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedFile, isTrackCached, resetCacheDbForTests } from '../cacheStore';
import {
  getTrackDownloadFailure,
  isTrackDownloading,
  resetCacheDownloadStateForTests,
} from '../cacheDownloadState';
import { abortAudioDownloads, resetDownloadLimiterForTests } from '../downloadLimiter';
import { ensureTrackCached } from '../cacheIngest';

function stubFetchBlob(body: string) {
  return vi.fn<typeof fetch>().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
    body: null,
    blob: async () => new Blob([body], { type: 'audio/mpeg' }),
  } as Response);
}

describe('ensureTrackCached', () => {
  beforeEach(async () => {
    await resetCacheDbForTests();
    resetCacheDownloadStateForTests();
    resetDownloadLimiterForTests();
    vi.restoreAllMocks();
  });

  it('downloads remote audio once', async () => {
    const sourceUrl = 'https://example.com/b.mp3';
    vi.stubGlobal('fetch', stubFetchBlob('bytes'));

    await ensureTrackCached(sourceUrl, 'b');
    expect(await isTrackCached(sourceUrl)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(sourceUrl, expect.objectContaining({ cache: 'no-cache' }));

    await ensureTrackCached(sourceUrl, 'b');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed download', async () => {
    const sourceUrl = 'https://example.com/fail-then-ok.mp3';
    const fetchMock = vi
      .fn<
        () => Promise<{
          ok: boolean;
          status?: number;
          headers: Headers;
          body: null;
          blob: () => Promise<Blob>;
        }>
      >()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
        body: null,
        blob: async () => new Blob([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
        body: null,
        blob: async () => new Blob(['ok'], { type: 'audio/mpeg' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(ensureTrackCached(sourceUrl, 'x')).rejects.toThrow(/downloadFailed/);
    expect(await isTrackCached(sourceUrl)).toBe(false);

    await ensureTrackCached(sourceUrl, 'x');
    expect(await isTrackCached(sourceUrl)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('downloads site-absolute audio once', async () => {
    const sourceUrl = '/sample-1.mp3';
    vi.stubGlobal('fetch', stubFetchBlob('local-bytes'));

    await ensureTrackCached(sourceUrl, 'local');
    expect(await isTrackCached(sourceUrl)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(sourceUrl, expect.objectContaining({ cache: 'no-cache' }));

    await ensureTrackCached(sourceUrl, 'local');
    expect(fetch).toHaveBeenCalledTimes(1);

    const blob = await getCachedFile(sourceUrl);
    expect(blob).not.toBeNull();
    expect(await blob!.text()).toBe('local-bytes');
  });

  it('skips non-playable paths', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>());
    await ensureTrackCached('sample-1.mp3');
    expect(fetch).not.toHaveBeenCalled();
    expect(await isTrackCached('sample-1.mp3')).toBe(false);
  });

  it('marks a track as downloading until the audio is stored', async () => {
    const sourceUrl = 'https://example.com/slow.mp3';
    const track = { id: 'slow', path: sourceUrl };
    let release!: (value: unknown) => void;
    const gate = new Promise((resolve) => {
      release = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        await gate;
        return {
          ok: true,
          headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
          body: null,
          blob: async () => new Blob(['slow-bytes'], { type: 'audio/mpeg' }),
        };
      }),
    );

    const job = ensureTrackCached(sourceUrl, 'slow');
    await vi.waitFor(() => {
      expect(isTrackDownloading(track)).toBe(true);
    });

    release(undefined);
    await job;

    expect(isTrackDownloading(track)).toBe(false);
    expect(await isTrackCached(sourceUrl)).toBe(true);
  });

  it('clears the downloading marker when the download fails', async () => {
    const sourceUrl = 'https://example.com/boom.mp3';
    const track = { id: 'boom', path: sourceUrl };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        body: null,
        blob: async () => new Blob([]),
      }),
    );

    await expect(ensureTrackCached(sourceUrl, 'boom')).rejects.toThrow(/downloadFailed/);
    expect(isTrackDownloading(track)).toBe(false);
  });

  it('remembers why the last download failed', async () => {
    const sourceUrl = 'https://example.com/missing.mp3';
    vi.spyOn(Date, 'now').mockReturnValue(1234);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers(),
        body: null,
        blob: async () => new Blob([]),
      }),
    );

    await expect(ensureTrackCached(sourceUrl, 'missing')).rejects.toThrow(/downloadFailed/);

    expect(getTrackDownloadFailure(sourceUrl)).toEqual({
      message: 'downloadFailed:404',
      httpStatus: 404,
      failedAt: 1234,
    });
  });

  it('keeps the error message when the network request fails', async () => {
    const sourceUrl = 'https://example.com/offline.mp3';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(ensureTrackCached(sourceUrl, 'offline')).rejects.toThrow('Failed to fetch');

    expect(getTrackDownloadFailure(sourceUrl)).toMatchObject({ message: 'Failed to fetch' });
    expect(getTrackDownloadFailure(sourceUrl)?.httpStatus).toBeUndefined();
  });

  it('does not remember a failure when a prefetch download is aborted', async () => {
    const sourceUrl = 'https://example.com/prefetch-abort.mp3';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      }),
    );

    const job = ensureTrackCached(sourceUrl, 'prefetch');
    const settled = expect(job).rejects.toThrow(/abort/i);
    await vi.waitFor(() => {
      expect(isTrackDownloading({ id: 'prefetch', path: sourceUrl })).toBe(true);
    });

    abortAudioDownloads('normal');
    await settled;

    expect(getTrackDownloadFailure(sourceUrl)).toBeNull();
    expect(await isTrackCached(sourceUrl)).toBe(false);
    expect(isTrackDownloading({ id: 'prefetch', path: sourceUrl })).toBe(false);
  });

  it('forgets the failure once a retry succeeds', async () => {
    const sourceUrl = 'https://example.com/flaky.mp3';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
          body: null,
          blob: async () => new Blob(['ok'], { type: 'audio/mpeg' }),
        }),
    );

    await expect(ensureTrackCached(sourceUrl, 'flaky')).rejects.toThrow();
    expect(getTrackDownloadFailure(sourceUrl)).not.toBeNull();

    await ensureTrackCached(sourceUrl, 'flaky');
    expect(getTrackDownloadFailure(sourceUrl)).toBeNull();
  });

  it('does not record a failure for a download preempted by a higher priority', async () => {
    const lowUrl = 'https://example.com/low-preempted.mp3';
    const highUrl = 'https://example.com/high-preempting.mp3';
    const { fetchMock, release, calls } = gatedFetch();
    vi.stubGlobal('fetch', fetchMock);

    const low = ensureTrackCached(lowUrl, 'low', { priority: 'low' });
    await vi.waitFor(() => expect(calls(lowUrl)).toBe(1));
    const high = ensureTrackCached(highUrl, 'high', { priority: 'high' });
    await vi.waitFor(() => expect(calls(highUrl)).toBe(1));

    expect(getTrackDownloadFailure(lowUrl)).toBeNull();

    release(highUrl);
    await high;
    await vi.waitFor(() => expect(calls(lowUrl)).toBe(2));
    release(lowUrl);
    await low;
    expect(getTrackDownloadFailure(lowUrl)).toBeNull();
  });

  it('restarts a lower-priority download aborted by a higher-priority one', async () => {
    const lowUrl = 'https://example.com/low.mp3';
    const highUrl = 'https://example.com/high.mp3';
    const { fetchMock, release, calls } = gatedFetch();
    vi.stubGlobal('fetch', fetchMock);

    const low = ensureTrackCached(lowUrl, 'low', { priority: 'low' });
    await vi.waitFor(() => expect(calls(lowUrl)).toBe(1));

    const high = ensureTrackCached(highUrl, 'high', { priority: 'high' });
    await vi.waitFor(() => expect(calls(highUrl)).toBe(1));
    expect(await isTrackCached(lowUrl)).toBe(false);

    release(highUrl);
    await high;
    await vi.waitFor(() => expect(calls(lowUrl)).toBe(2));

    release(lowUrl);
    await low;
    expect(await isTrackCached(lowUrl)).toBe(true);
    expect(await isTrackCached(highUrl)).toBe(true);
  });

  it('raises an in-flight download when the same URL is requested at a higher priority', async () => {
    const sharedUrl = 'https://example.com/shared.mp3';
    const otherUrl = 'https://example.com/other.mp3';
    const { fetchMock, release, calls } = gatedFetch();
    vi.stubGlobal('fetch', fetchMock);

    const low = ensureTrackCached(sharedUrl, 'shared', { priority: 'low' });
    await vi.waitFor(() => expect(calls(sharedUrl)).toBe(1));

    const play = ensureTrackCached(sharedUrl, 'shared', { priority: 'high' });
    const prefetch = ensureTrackCached(otherUrl, 'other', { priority: 'normal' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls(otherUrl)).toBe(0);
    expect(calls(sharedUrl)).toBe(1);

    release(sharedUrl);
    await Promise.all([low, play]);
    expect(calls(sharedUrl)).toBe(1);

    await vi.waitFor(() => expect(calls(otherUrl)).toBe(1));
    release(otherUrl);
    await prefetch;
  });
});

/** fetch stub whose responses wait for `release(url)` and reject when aborted. */
function gatedFetch() {
  const gates = new Map<string, () => void>();
  const callCounts = new Map<string, number>();

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    callCounts.set(url, (callCounts.get(url) ?? 0) + 1);
    await new Promise<void>((resolve, reject) => {
      gates.set(url, resolve);
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    });
    return {
      ok: true,
      headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
      body: null,
      blob: async () => new Blob([url], { type: 'audio/mpeg' }),
    } as Response;
  });

  return {
    fetchMock,
    release: (url: string) => gates.get(url)!(),
    calls: (url: string) => callCounts.get(url) ?? 0,
  };
}
