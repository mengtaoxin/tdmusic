import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCachedFile, isTrackCached, resetCacheDbForTests } from '../cacheStore'
import { isTrackDownloading, resetCacheDownloadStateForTests } from '../cacheDownloadState'
import { resetDownloadLimiterForTests } from '../downloadLimiter'
import { ensureTrackCached } from '../cacheIngest'

function stubFetchBlob(body: string) {
  return vi.fn<typeof fetch>().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
    body: null,
    blob: async () => new Blob([body], { type: 'audio/mpeg' }),
  } as Response)
}

describe('ensureTrackCached', () => {
  beforeEach(async () => {
    await resetCacheDbForTests()
    resetCacheDownloadStateForTests()
    resetDownloadLimiterForTests()
    vi.restoreAllMocks()
  })

  it('downloads remote audio once', async () => {
    const sourceUrl = 'https://example.com/b.mp3'
    vi.stubGlobal('fetch', stubFetchBlob('bytes'))

    await ensureTrackCached(sourceUrl, 'b')
    expect(await isTrackCached(sourceUrl)).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)

    await ensureTrackCached(sourceUrl, 'b')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed download', async () => {
    const sourceUrl = 'https://example.com/fail-then-ok.mp3'
    const fetchMock = vi
      .fn<
        () => Promise<{
          ok: boolean
          status?: number
          headers: Headers
          body: null
          blob: () => Promise<Blob>
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
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(ensureTrackCached(sourceUrl, 'x')).rejects.toThrow(/downloadFailed/)
    expect(await isTrackCached(sourceUrl)).toBe(false)

    await ensureTrackCached(sourceUrl, 'x')
    expect(await isTrackCached(sourceUrl)).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('downloads site-absolute audio once', async () => {
    const sourceUrl = '/sample-1.mp3'
    vi.stubGlobal('fetch', stubFetchBlob('local-bytes'))

    await ensureTrackCached(sourceUrl, 'local')
    expect(await isTrackCached(sourceUrl)).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(sourceUrl)

    await ensureTrackCached(sourceUrl, 'local')
    expect(fetch).toHaveBeenCalledTimes(1)

    const blob = await getCachedFile(sourceUrl)
    expect(blob).not.toBeNull()
    expect(await blob!.text()).toBe('local-bytes')
  })

  it('skips non-playable paths', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>())
    await ensureTrackCached('sample-1.mp3')
    expect(fetch).not.toHaveBeenCalled()
    expect(await isTrackCached('sample-1.mp3')).toBe(false)
  })

  it('marks a track as downloading until the audio is stored', async () => {
    const sourceUrl = 'https://example.com/slow.mp3'
    const track = { id: 'slow', path: sourceUrl }
    let release!: (value: unknown) => void
    const gate = new Promise((resolve) => {
      release = resolve
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        await gate
        return {
          ok: true,
          headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
          body: null,
          blob: async () => new Blob(['slow-bytes'], { type: 'audio/mpeg' }),
        }
      }),
    )

    const job = ensureTrackCached(sourceUrl, 'slow')
    await vi.waitFor(() => {
      expect(isTrackDownloading(track)).toBe(true)
    })

    release(undefined)
    await job

    expect(isTrackDownloading(track)).toBe(false)
    expect(await isTrackCached(sourceUrl)).toBe(true)
  })

  it('clears the downloading marker when the download fails', async () => {
    const sourceUrl = 'https://example.com/boom.mp3'
    const track = { id: 'boom', path: sourceUrl }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        body: null,
        blob: async () => new Blob([]),
      }),
    )

    await expect(ensureTrackCached(sourceUrl, 'boom')).rejects.toThrow(/downloadFailed/)
    expect(isTrackDownloading(track)).toBe(false)
  })

  it('downloads at most three tracks at once', async () => {
    const started: string[] = []
    const releases = new Map<string, () => void>()
    let inFlight = 0
    let maxInFlight = 0

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        started.push(url)
        inFlight += 1
        maxInFlight = Math.max(maxInFlight, inFlight)
        await new Promise<void>((resolve) => {
          releases.set(url, resolve)
        })
        inFlight -= 1
        return {
          ok: true,
          headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
          body: null,
          blob: async () => new Blob(['bytes'], { type: 'audio/mpeg' }),
        }
      }),
    )

    const urls = [
      'https://example.com/1.mp3',
      'https://example.com/2.mp3',
      'https://example.com/3.mp3',
      'https://example.com/4.mp3',
    ]
    const jobs = urls.map((url, index) => ensureTrackCached(url, String(index)))

    await vi.waitFor(() => {
      expect(started).toHaveLength(3)
    })
    expect(maxInFlight).toBe(3)

    releases.get(urls[0]!)!()
    await vi.waitFor(() => {
      expect(started).toHaveLength(4)
    })

    for (const url of urls.slice(1)) {
      releases.get(url)!()
    }
    await Promise.all(jobs)
    expect(maxInFlight).toBe(3)
  })
})
