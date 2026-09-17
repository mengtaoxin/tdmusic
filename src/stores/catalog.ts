import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  buildCatalogSnapshot,
  patchCatalogTrack,
  searchCatalog,
  toDisplayTrack,
  type CatalogSearchResult,
  type CatalogSnapshot,
  type CatalogTrackGroup,
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

export type { DisplayTrack, CatalogTrackGroup, CatalogSearchResult }

export const useCatalogStore = defineStore('catalog', () => {
  const snapshot = ref<CatalogSnapshot>(buildCatalogSnapshot([]))
  const playlists = ref<NormalizedPlaylist[]>([])
  const errors = ref<CatalogError[]>([])
  const loading = ref(false)
  const loadError = ref<string | null>(null)

  function applySnapshot(next: CatalogSnapshot) {
    snapshot.value = next
  }

  /** Writable so tests/callers can assign `catalog.tracks = […]` and rebuild indexes. */
  const tracks = computed({
    get: () => snapshot.value.tracks,
    set: (next: DisplayTrack[]) => {
      applySnapshot(buildCatalogSnapshot(next))
    },
  })

  const trackById = computed(() => snapshot.value.trackById)
  const artists = computed(() => snapshot.value.artists)
  const albums = computed(() => snapshot.value.albums)

  async function applyEnrichment(track: DisplayTrack, options?: { network?: boolean }) {
    const patch = await enrichOneTrack(track, options)
    if (!patch) return
    const result = patchCatalogTrack(snapshot.value, track.id, patch)
    if (!result) return
    applySnapshot(result.snapshot)
  }

  /** Enqueue best-effort enrich for the current track list (no network audio fetch). */
  function scheduleEnrichment() {
    for (const track of snapshot.value.tracks) {
      void enqueueEnrich(() => applyEnrichment(track))
    }
  }

  /** After play download, re-enrich one track (may use cached audio for ID3). */
  function scheduleEnrichTrack(id: string) {
    const track = snapshot.value.trackById.get(id)
    if (!track) return
    void enqueueEnrich(() => applyEnrichment(track, { network: true }))
  }

  /** Reset display fields to config-only (drop extracted covers/meta in memory). */
  function resetDisplayFromConfig() {
    applySnapshot(buildCatalogSnapshot(snapshot.value.tracks.map((track) => toDisplayTrack(track))))
  }

  async function load() {
    loading.value = true
    loadError.value = null
    clearEnrichQueue()
    try {
      const raw = await loadConfigsJson()
      const normalized = normalizeConfigs(raw)
      errors.value = normalized.errors
      playlists.value = normalized.playlists
      applySnapshot(buildCatalogSnapshot(normalized.tracks.map(toDisplayTrack)))
      scheduleEnrichment()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : String(error)
      applySnapshot(buildCatalogSnapshot([]))
      playlists.value = []
    } finally {
      loading.value = false
    }
  }

  function search(query: string): CatalogSearchResult {
    return searchCatalog(snapshot.value, query)
  }

  return {
    tracks,
    playlists,
    errors,
    loading,
    loadError,
    trackById,
    artists,
    albums,
    load,
    search,
    scheduleEnrichment,
    scheduleEnrichTrack,
    resetDisplayFromConfig,
  }
})
