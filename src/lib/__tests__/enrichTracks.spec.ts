import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetCacheDbForTests } from '../cacheStore'
import { enrichOneTrack } from '../enrichTracks'
import * as musicCache from '../musicCache'
import * as trackMetadata from '../trackMetadata'

describe('enrichOneTrack', () => {
  beforeEach(async () => {
    await resetCacheDbForTests()
    vi.restoreAllMocks()
  })

  it('caches remote audio, extracts metadata, and returns display fields', async () => {
    const track = {
      id: 't1',
      path: 'https://example.com/song.mp3',
    }

    const ensureCached = vi.spyOn(musicCache, 'ensureTrackCached').mockResolvedValue(undefined)
    const ensureMeta = vi.spyOn(trackMetadata, 'ensureTrackMetadata').mockResolvedValue({
      title: 'Parsed',
      artist: 'Artist',
      album: 'Album',
      coverUrl: 'blob:http://tdmusic.test/cover',
    })

    const patch = await enrichOneTrack(track)

    expect(ensureCached).toHaveBeenCalledWith(track.path, track.id)
    expect(ensureMeta).toHaveBeenCalledWith(track.path, undefined)
    expect(patch).toEqual({
      displayTitle: 'Parsed',
      displayArtist: 'Artist',
      displayAlbum: 'Album',
      displayCover: 'blob:http://tdmusic.test/cover',
    })
  })

  it('skips cache for site-absolute paths', async () => {
    const track = { id: 'local', path: '/sample.mp3' }
    const ensureCached = vi.spyOn(musicCache, 'ensureTrackCached').mockResolvedValue(undefined)
    vi.spyOn(trackMetadata, 'ensureTrackMetadata').mockResolvedValue({
      title: 'Local',
      artist: 'A',
      album: 'B',
    })

    await enrichOneTrack(track)

    expect(ensureCached).not.toHaveBeenCalled()
  })

  it('prefers config fields over extracted metadata', async () => {
    const track = {
      id: 't1',
      path: 'https://example.com/song.mp3',
      title: 'Config Title',
      artist: 'Config Artist',
    }
    vi.spyOn(musicCache, 'ensureTrackCached').mockResolvedValue(undefined)
    vi.spyOn(trackMetadata, 'ensureTrackMetadata').mockResolvedValue({
      title: 'Parsed',
      artist: 'Artist',
      album: 'Album',
    })

    const patch = await enrichOneTrack(track)

    expect(patch).toEqual({
      displayTitle: 'Config Title',
      displayArtist: 'Config Artist',
      displayAlbum: 'Album',
      displayCover: undefined,
    })
  })

  it('returns null when metadata is unavailable', async () => {
    vi.spyOn(musicCache, 'ensureTrackCached').mockResolvedValue(undefined)
    vi.spyOn(trackMetadata, 'ensureTrackMetadata').mockResolvedValue(null)

    const patch = await enrichOneTrack({
      id: 't1',
      path: 'https://example.com/song.mp3',
    })

    expect(patch).toBeNull()
  })

  it('swallows errors and returns null (best-effort)', async () => {
    vi.spyOn(musicCache, 'ensureTrackCached').mockRejectedValue(new Error('network'))

    const patch = await enrichOneTrack({
      id: 't1',
      path: 'https://example.com/song.mp3',
    })

    expect(patch).toBeNull()
  })
})
