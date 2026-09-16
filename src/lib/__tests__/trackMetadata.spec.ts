import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AUDIO_FILE_KEY,
  COVER_FILE_KEY,
  getCachedFile,
  putFiles,
  resetCacheDbForTests,
} from '../cacheStore'
import { ensureTrackMetadata } from '../trackMetadata'

describe('ensureTrackMetadata', () => {
  beforeEach(async () => {
    await resetCacheDbForTests()
    vi.restoreAllMocks()
  })

  it('parses blob, caches text + cover blob, and reuses cache', async () => {
    const sourceUrl = 'https://example.com/song.mp3'
    await putFiles(sourceUrl, [{ relativePath: AUDIO_FILE_KEY, blob: new Blob(['audio']) }])

    const coverBlob = new Blob(['cover-bytes'], { type: 'image/png' })
    const parser = vi
      .fn<() => Promise<{ title: string; artist: string; album: string; coverBlob: Blob }>>()
      .mockResolvedValue({
        title: 'Parsed',
        artist: 'Artist',
        album: 'Album',
        coverBlob,
      })

    const first = await ensureTrackMetadata(sourceUrl, { parser })
    expect(first?.title).toBe('Parsed')
    expect(first?.artist).toBe('Artist')
    expect(first?.album).toBe('Album')
    expect(first?.coverUrl).toMatch(/^blob:/)
    expect(parser).toHaveBeenCalledTimes(1)

    const storedCover = await getCachedFile(sourceUrl, COVER_FILE_KEY)
    expect(storedCover).not.toBeNull()
    expect(await storedCover!.text()).toBe('cover-bytes')

    const second = await ensureTrackMetadata(sourceUrl, { parser })
    expect(second?.title).toBe('Parsed')
    expect(second?.coverUrl).toMatch(/^blob:/)
    expect(parser).toHaveBeenCalledTimes(1)
  })

  it('cache hit without cover still returns text meta', async () => {
    const sourceUrl = 'https://example.com/no-cover.mp3'
    await putFiles(sourceUrl, [{ relativePath: AUDIO_FILE_KEY, blob: new Blob(['audio']) }])

    const parser = vi
      .fn<() => Promise<{ title: string; artist: string; album: string }>>()
      .mockResolvedValue({
        title: 'Solo',
        artist: 'A',
        album: 'B',
      })

    const first = await ensureTrackMetadata(sourceUrl, { parser })
    expect(first).toEqual({
      title: 'Solo',
      artist: 'A',
      album: 'B',
      coverUrl: undefined,
    })

    const second = await ensureTrackMetadata(sourceUrl, { parser })
    expect(second?.title).toBe('Solo')
    expect(second?.coverUrl).toBeUndefined()
    expect(parser).toHaveBeenCalledTimes(1)
  })

  it('with network:false does not fetch site-absolute audio', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(new Blob(['audio']), { status: 200 }))
    const parser = vi.fn<() => Promise<{ title: string; artist: string; album: string }>>()

    const result = await ensureTrackMetadata('/sample.mp3', { network: false, parser })

    expect(result).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(parser).not.toHaveBeenCalled()
  })

  it('with network:true fetches site-absolute audio for parsing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Blob(['audio']), { status: 200 }),
    )
    const parser = vi
      .fn<() => Promise<{ title: string; artist: string; album: string }>>()
      .mockResolvedValue({
        title: 'Local',
        artist: 'A',
        album: 'B',
      })

    const result = await ensureTrackMetadata('/sample.mp3', { network: true, parser })

    expect(result?.title).toBe('Local')
    expect(parser).toHaveBeenCalledTimes(1)
  })
})
