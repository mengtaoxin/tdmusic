import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AUDIO_FILE_KEY,
  getExtractedTrackMeta,
  putExtractedTrackMeta,
  putFiles,
  resetCacheDbForTests,
} from '@/lib/cache/cacheStore'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
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
    const catalog = useCatalogStore()
    const player = usePlayerStore()
    const load = vi.spyOn(catalog, 'load').mockImplementation(async () => {
      catalog.tracks = sampleTracks()
    })
    const hydrate = vi.spyOn(player, 'hydrate').mockReturnValue(true)

    await loadCatalogAndHydratePlayer()

    expect(load).toHaveBeenCalledOnce()
    expect(hydrate).toHaveBeenCalledWith(new Set(['a']))
  })

  it('ensureCatalogLoaded loads and hydrates when the catalog is empty', async () => {
    const catalog = useCatalogStore()
    const player = usePlayerStore()
    const load = vi.spyOn(catalog, 'load').mockImplementation(async () => {
      catalog.tracks = sampleTracks()
    })
    const hydrate = vi.spyOn(player, 'hydrate').mockReturnValue(true)

    await ensureCatalogLoaded()

    expect(load).toHaveBeenCalledOnce()
    expect(hydrate).toHaveBeenCalledWith(new Set(['a']))
  })

  it('ensureCatalogLoaded is a no-op when tracks are already present', async () => {
    const catalog = useCatalogStore()
    const player = usePlayerStore()
    catalog.tracks = sampleTracks()
    const load = vi.spyOn(catalog, 'load')
    const hydrate = vi.spyOn(player, 'hydrate')

    await ensureCatalogLoaded()

    expect(load).not.toHaveBeenCalled()
    expect(hydrate).not.toHaveBeenCalled()
  })

  it('ensureCatalogLoaded joins an in-flight loadCatalogAndHydratePlayer', async () => {
    const catalog = useCatalogStore()
    const player = usePlayerStore()
    let finishLoad!: () => void
    const loadGate = new Promise<void>((resolve) => {
      finishLoad = resolve
    })
    const load = vi.spyOn(catalog, 'load').mockImplementation(async () => {
      await loadGate
      catalog.tracks = sampleTracks()
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

    const catalog = useCatalogStore()
    catalog.tracks = [
      {
        id: 't1',
        path: sourceUrl,
        title: 'Config',
        displayTitle: 'Extracted Title',
        displayArtist: 'Extracted Artist',
        displayAlbum: 'Extracted Album',
        displayCover: 'blob:http://tdmusic.test/old-cover',
      },
    ] as DisplayTrack[]

    const schedule = vi.spyOn(catalog, 'scheduleEnrichment').mockImplementation(() => {})

    await clearMusicCachesAndRefresh()

    expect(await getExtractedTrackMeta(sourceUrl)).toBeNull()
    expect(catalog.tracks[0]).toMatchObject({
      id: 't1',
      path: sourceUrl,
      title: 'Config',
      displayTitle: 'Config',
      displayArtist: 'Unknown artist',
      displayAlbum: 'Unknown album',
    })
    expect(catalog.tracks[0]!.displayCover).toBeUndefined()
    expect(schedule).toHaveBeenCalledOnce()
  })
})
