import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetCacheDbForTests } from '../../cache/cacheStore'
import { enrichOneTrack } from '../enrichTracks'
import * as musicCache from '../../cache/musicCache'
import * as trackMetadata from '../../cache/trackMetadata'

describe('enrichOneTrack', () => {
  beforeEach(async () => {
    await resetCacheDbForTests()
    vi.restoreAllMocks()
  })

  it('does not download remote audio; extracts metadata with network disabled', async () => {
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

    expect(ensureCached).not.toHaveBeenCalled()
    expect(ensureMeta).toHaveBeenCalledWith(track.path, { network: false })
    expect(patch).toEqual({
      displayTitle: 'Parsed',
      displayArtist: 'Artist',
      displayAlbum: 'Album',
      displayCover: 'blob:http://tdmusic.test/cover',
    })
  })

  it('passes network:true when requested (e.g. after play)', async () => {
    const track = { id: 'local', path: '/sample.mp3' }
    const ensureMeta = vi.spyOn(trackMetadata, 'ensureTrackMetadata').mockResolvedValue({
      title: 'Local',
      artist: 'A',
      album: 'B',
    })

    await enrichOneTrack(track, { network: true })

    expect(ensureMeta).toHaveBeenCalledWith(track.path, { network: true })
  })

  it('does not call ensureTrackCached for site-absolute paths', async () => {
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

  it('returns null when metadata is unavailable', async () => {
    vi.spyOn(trackMetadata, 'ensureTrackMetadata').mockResolvedValue(null)

    const patch = await enrichOneTrack({
      id: 't1',
      path: 'https://example.com/song.mp3',
    })

    expect(patch).toBeNull()
  })

  it('swallows errors and returns null (best-effort)', async () => {
    vi.spyOn(trackMetadata, 'ensureTrackMetadata').mockRejectedValue(new Error('network'))

    const patch = await enrichOneTrack({
      id: 't1',
      path: 'https://example.com/song.mp3',
    })

    expect(patch).toBeNull()
  })
})
