import { create } from 'zustand'

import {
  buildCatalogSnapshot,
  patchCatalogTrack,
  searchCatalog,
  toDisplayTrack,
  type CatalogSearchResult,
  type CatalogSnapshot,
  type DisplayTrack,
} from '@/lib/catalog/catalogIndex'
import { clearEnrichQueue, enqueueEnrich } from '@/lib/catalog/enrichQueue'
import { enrichOneTrack } from '@/lib/catalog/enrichTracks'
import { loadConfigsJson } from '@/lib/catalog/loadConfigs'
import {
  normalizeConfigs,
  type CatalogError,
  type NormalizedPlaylist,
} from '@/lib/catalog/normalizeCatalog'

type CatalogState = {
  snapshot: CatalogSnapshot
  playlists: NormalizedPlaylist[]
  errors: CatalogError[]
  loading: boolean
  loadError: string | null
  load: () => Promise<void>
  search: (query: string) => CatalogSearchResult
  scheduleEnrichment: () => void
  scheduleEnrichTrack: (id: string) => void
  resetDisplayFromConfig: () => void
  /** Replace track list and rebuild indexes (tests / direct assignment). */
  setTracks: (next: DisplayTrack[]) => void
}

async function applyEnrichment(
  get: () => CatalogState,
  set: (partial: Partial<Pick<CatalogState, 'snapshot'>>) => void,
  track: DisplayTrack,
  options?: { network?: boolean },
) {
  const patch = await enrichOneTrack(track, options)
  if (!patch) return
  const result = patchCatalogTrack(get().snapshot, track.id, patch)
  if (!result) return
  set({ snapshot: result.snapshot })
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  snapshot: buildCatalogSnapshot([]),
  playlists: [],
  errors: [],
  loading: false,
  loadError: null,

  setTracks(next: DisplayTrack[]) {
    set({ snapshot: buildCatalogSnapshot(next) })
  },

  scheduleEnrichment() {
    for (const track of get().snapshot.tracks) {
      void enqueueEnrich(() => applyEnrichment(get, set, track))
    }
  },

  scheduleEnrichTrack(id: string) {
    const track = get().snapshot.trackById.get(id)
    if (!track) return
    void enqueueEnrich(() => applyEnrichment(get, set, track, { network: true }))
  },

  resetDisplayFromConfig() {
    set({
      snapshot: buildCatalogSnapshot(get().snapshot.tracks.map((track) => toDisplayTrack(track))),
    })
  },

  async load() {
    set({ loading: true, loadError: null })
    clearEnrichQueue()
    try {
      const raw = await loadConfigsJson()
      const normalized = normalizeConfigs(raw)
      set({
        errors: normalized.errors,
        playlists: normalized.playlists,
        snapshot: buildCatalogSnapshot(normalized.tracks.map(toDisplayTrack)),
      })
      get().scheduleEnrichment()
    } catch (error) {
      set({
        loadError: error instanceof Error ? error.message : String(error),
        playlists: [],
        snapshot: buildCatalogSnapshot([]),
      })
    } finally {
      set({ loading: false })
    }
  },

  search(query: string): CatalogSearchResult {
    return searchCatalog(get().snapshot, query)
  },
}))

/** Convenience selectors for React components. */
export const selectTracks = (s: CatalogState) => s.snapshot.tracks
export const selectTrackById = (s: CatalogState) => s.snapshot.trackById
export const selectArtists = (s: CatalogState) => s.snapshot.artists
export const selectAlbums = (s: CatalogState) => s.snapshot.albums
