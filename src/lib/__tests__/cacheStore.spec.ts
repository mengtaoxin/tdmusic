import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  COVER_FILE_KEY,
  getCachedFile,
  isTrackCached,
  listTrackMetas,
  putFiles,
  putMeta,
  resetCacheDbForTests,
  AUDIO_FILE_KEY,
} from '../cacheStore'
import { ensureTrackCached } from '../cacheIngest'
import { clearAllMusicCaches } from '../musicCache'

describe('music cache', () => {
  beforeEach(async () => {
    await resetCacheDbForTests()
    vi.restoreAllMocks()
  })

  it('stores and reads audio blobs', async () => {
    const sourceUrl = 'https://example.com/a.mp3'
    await putFiles(sourceUrl, [
      { relativePath: AUDIO_FILE_KEY, blob: new Blob(['audio'], { type: 'audio/mpeg' }) },
    ])
    await putMeta({
      sourceUrl,
      id: 'a',
      status: 'ready',
      downloadedAt: Date.now(),
    })

    expect(await isTrackCached(sourceUrl)).toBe(true)
    const blob = await getCachedFile(sourceUrl)
    expect(blob).not.toBeNull()
    expect(await blob!.text()).toBe('audio')
  })

  it('stores and reads cover blobs', async () => {
    const sourceUrl = 'https://example.com/cover-track.mp3'
    await putFiles(sourceUrl, [
      { relativePath: COVER_FILE_KEY, blob: new Blob(['img'], { type: 'image/jpeg' }) },
    ])
    const cover = await getCachedFile(sourceUrl, COVER_FILE_KEY)
    expect(cover).not.toBeNull()
    expect(await cover!.text()).toBe('img')
  })

  it('pending status is not treated as cached', async () => {
    const sourceUrl = 'https://example.com/pending.mp3'
    await putMeta({
      sourceUrl,
      status: 'pending',
      downloadedAt: Date.now(),
    })
    expect(await isTrackCached(sourceUrl)).toBe(false)
  })

  it('listTrackMetas returns all meta records', async () => {
    await putMeta({
      sourceUrl: 'https://example.com/1.mp3',
      status: 'ready',
      downloadedAt: 10,
    })
    await putMeta({
      sourceUrl: 'https://example.com/2.mp3',
      status: 'pending',
      downloadedAt: 20,
    })
    const metas = await listTrackMetas()
    expect(metas).toHaveLength(2)
    expect(metas.map((m) => m.sourceUrl).sort()).toEqual([
      'https://example.com/1.mp3',
      'https://example.com/2.mp3',
    ])
  })

  it('reuses db connection across successive operations', async () => {
    const sourceUrl = 'https://example.com/reuse.mp3'
    await putMeta({
      sourceUrl,
      status: 'ready',
      downloadedAt: Date.now(),
    })
    expect(await isTrackCached(sourceUrl)).toBe(true)
    expect(await isTrackCached(sourceUrl)).toBe(true)
  })

  it('ensureTrackCached downloads remote audio once', async () => {
    const sourceUrl = 'https://example.com/b.mp3'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
        body: null,
        blob: async () => new Blob(['bytes'], { type: 'audio/mpeg' }),
      }),
    )

    await ensureTrackCached(sourceUrl, 'b')
    expect(await isTrackCached(sourceUrl)).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)

    await ensureTrackCached(sourceUrl, 'b')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('ensureTrackCached retries after a failed download', async () => {
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

  it('ensureTrackCached skips non-remote paths', async () => {
    vi.stubGlobal('fetch', vi.fn())
    await ensureTrackCached('/sample-1.mp3')
    expect(fetch).not.toHaveBeenCalled()
    expect(await isTrackCached('/sample-1.mp3')).toBe(false)
  })

  it('clearAllMusicCaches removes records', async () => {
    const sourceUrl = 'https://example.com/c.mp3'
    await putFiles(sourceUrl, [{ relativePath: AUDIO_FILE_KEY, blob: new Blob(['x']) }])
    await putMeta({
      sourceUrl,
      status: 'ready',
      downloadedAt: Date.now(),
    })
    await clearAllMusicCaches()
    expect(await isTrackCached(sourceUrl)).toBe(false)
  })
})
