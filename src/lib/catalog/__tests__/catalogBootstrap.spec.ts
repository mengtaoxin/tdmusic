import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AUDIO_FILE_KEY,
  getExtractedTrackMeta,
  putExtractedTrackMeta,
  putFiles,
  resetCacheDbForTests,
} from '@/lib/cache/cacheStore'
import type { DisplayTrack } from '@/lib/catalog/catalogIndex'
import { useCatalogStore } from '@/stores/catalog'
import {
  clearMusicCachesAndRefresh,
  ensureCatalogLoaded,
  loadCatalogAndHydratePlayer,
} from '@/lib/catalog/catalogBootstrap'
import { usePlayerStore } from '@/stores/player'

function sampleTracks(): DisplayTrack[] {
  return [
    {
      id: 'a',
      path: '/a.mp3',
      displayTitle: 'A',
      displayArtist: 'Unknown artist',
      displayAlbum: 'Unknown album',
    },
  ] as DisplayTrack[]
}

describe('catalogBootstrap', () => {
  beforeEach(async () => {
    await resetCacheDbForTests()
    vi.restoreAllMocks()
  })

  it('loadCatalogAndHydratePlayer loads catalog then hydrates player', async () => {
    const catalog = useCatalogStore.getState()
    const player = usePlayerStore.getState()
    const load = vi.spyOn(catalog, 'load').mockImplementation(async () => {
      useCatalogStore.getState().setTracks(sampleTracks())
    })
    const hydrate = vi.spyOn(player, 'hydrate').mockReturnValue(true)

    await loadCatalogAndHydratePlayer()

    expect(load).toHaveBeenCalledOnce()
    expect(hydrate).toHaveBeenCalledWith(new Set(['a']))
  })

  it('ensureCatalogLoaded is a no-op when tracks are already present', async () => {
    useCatalogStore.getState().setTracks(sampleTracks())
    const catalog = useCatalogStore.getState()
    const player = usePlayerStore.getState()
    const load = vi.spyOn(catalog, 'load')
    const hydrate = vi.spyOn(player, 'hydrate')

    await ensureCatalogLoaded()

    expect(load).not.toHaveBeenCalled()
    expect(hydrate).not.toHaveBeenCalled()
  })

  it('ensureCatalogLoaded joins an in-flight loadCatalogAndHydratePlayer', async () => {
    const catalog = useCatalogStore.getState()
    const player = usePlayerStore.getState()
    let finishLoad!: () => void
    const loadGate = new Promise<void>((resolve) => {
      finishLoad = resolve
    })
    const load = vi.spyOn(catalog, 'load').mockImplementation(async () => {
      await loadGate
      useCatalogStore.getState().setTracks(sampleTracks())
    })
    const hydrate = vi.spyOn(player, 'hydrate').mockReturnValue(true)

    const first = loadCatalogAndHydratePlayer()
    const second = ensureCatalogLoaded()
    finishLoad()
    await Promise.all([first, second])

    expect(load).toHaveBeenCalledOnce()
    expect(hydrate).toHaveBeenCalledOnce()
  })

  it('clearMusicCachesAndRefresh clears IDB and resets extracted display fields', async () => {
    const sourceUrl = 'https://example.com/cached.mp3'
    await putFiles(sourceUrl, [{ relativePath: AUDIO_FILE_KEY, blob: new Blob(['audio']) }])
    await putExtractedTrackMeta({
      sourceUrl,
      title: 'Extracted Title',
      artist: 'Extracted Artist',
      album: 'Extracted Album',
      updatedAt: Date.now(),
    })

    useCatalogStore.getState().setTracks([
      {
        id: 't1',
        path: sourceUrl,
        title: 'Config',
        displayTitle: 'Extracted Title',
        displayArtist: 'Extracted Artist',
        displayAlbum: 'Extracted Album',
        displayCover: 'blob:http://tdmusic.test/old-cover',
      },
    ] as DisplayTrack[])

    const catalog = useCatalogStore.getState()
    const schedule = vi.spyOn(catalog, 'scheduleEnrichment').mockImplementation(() => {})

    await clearMusicCachesAndRefresh()

    expect(await getExtractedTrackMeta(sourceUrl)).toBeNull()
    const track = useCatalogStore.getState().snapshot.tracks[0]
    expect(track).toMatchObject({
      id: 't1',
      path: sourceUrl,
      title: 'Config',
      displayTitle: 'Config',
      displayArtist: 'Unknown artist',
      displayAlbum: 'Unknown album',
    })
    expect(track!.displayCover).toBeUndefined()
    expect(schedule).toHaveBeenCalledOnce()
  })

  it('clearMusicCachesAndRefresh also clears now playing and the play queue', async () => {
    useCatalogStore.getState().setTracks(sampleTracks())
    vi.spyOn(useCatalogStore.getState(), 'scheduleEnrichment').mockImplementation(() => {})

    const player = usePlayerStore.getState()
    player.playFrom(0, ['a'])
    usePlayerStore.setState({ playing: true })

    await clearMusicCachesAndRefresh()

    const after = usePlayerStore.getState()
    expect(after.queue).toEqual([])
    expect(after.originalQueue).toEqual([])
    expect(after.currentId).toBeNull()
    expect(after.playing).toBe(false)
  })
})
