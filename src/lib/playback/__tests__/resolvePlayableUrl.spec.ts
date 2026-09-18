import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as musicCache from '../../cache/musicCache'
import {
  AUDIO_FILE_KEY,
  getCachedFile,
  isTrackCached,
  resetCacheDbForTests,
} from '../../cache/cacheStore'
import { resolvePlayableUrl } from '../resolvePlayableUrl'

describe('resolvePlayableUrl', () => {
  beforeEach(async () => {
    await resetCacheDbForTests()
    vi.restoreAllMocks()
  })

  it('caches remote audio and returns a blob URL', async () => {
    const path = 'https://example.com/song.mp3'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
        body: null,
        blob: async () => new Blob(['remote'], { type: 'audio/mpeg' }),
      }),
    )

    const url = await resolvePlayableUrl(path, 'r1')

    expect(url).toMatch(/^blob:/)
    expect(await isTrackCached(path)).toBe(true)
    expect(await getCachedFile(path, AUDIO_FILE_KEY)).not.toBeNull()
  })

  it('caches site-absolute audio and returns a blob URL', async () => {
    const path = '/sample-1.mp3'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
        body: null,
        blob: async () => new Blob(['local'], { type: 'audio/mpeg' }),
      }),
    )

    const url = await resolvePlayableUrl(path, 'local')

    expect(url).toMatch(/^blob:/)
    expect(await isTrackCached(path)).toBe(true)
    expect(fetch).toHaveBeenCalledWith(path)
    const blob = await getCachedFile(path)
    expect(blob).not.toBeNull()
    expect(await blob!.text()).toBe('local')
  })

  it('requests a high-priority download slot for play', async () => {
    const ensure = vi.spyOn(musicCache, 'ensureTrackCached').mockResolvedValue(undefined)
    vi.spyOn(musicCache, 'getCachedBlobUrl').mockResolvedValue('blob:play')

    await resolvePlayableUrl('https://example.com/now.mp3', 'now')

    expect(ensure).toHaveBeenCalledWith('https://example.com/now.mp3', 'now', {
      priority: 'high',
    })
  })
})
