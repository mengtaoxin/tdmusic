import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { resolveDisplayAlbum, resolveDisplayArtist } from '@/lib/displayLabels'
import { clearEnrichQueue, enqueueEnrich } from '@/lib/enrichQueue'
import { enrichOneTrack } from '@/lib/enrichTracks'
import { loadConfigsJson } from '@/lib/loadConfigs'
import { mergeTrackDisplay } from '@/lib/mergeTrackMeta'
import {
  normalizeConfigs,
  type CatalogError,
  type MusicTrack,
  type NormalizedPlaylist,
} from '@/lib/normalizeCatalog'

export type DisplayTrack = MusicTrack & {
  displayTitle: string
  displayArtist: string
  displayAlbum: string
  displayCover?: string
}

function toDisplayTrack(track: MusicTrack): DisplayTrack {
  const merged = mergeTrackDisplay(track, null)
  return {
    ...track,
    displayTitle: merged.title ?? track.id,
    displayArtist: resolveDisplayArtist(merged.artist),
    displayAlbum: resolveDisplayAlbum(merged.album),
    displayCover: merged.cover,
  }
}

export const useCatalogStore = defineStore('catalog', () => {
  const tracks = ref<DisplayTrack[]>([])
  const playlists = ref<NormalizedPlaylist[]>([])
  const errors = ref<CatalogError[]>([])
  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const trackById = computed(() => {
    const map = new Map<string, DisplayTrack>()
    for (const track of tracks.value) map.set(track.id, track)
    return map
  })

  const artists = computed(() => {
    const map = new Map<string, DisplayTrack[]>()
    for (const track of tracks.value) {
      const key = resolveDisplayArtist(track.displayArtist)
      const list = map.get(key) ?? []
      list.push(track)
      map.set(key, list)
    }
    return [...map.entries()]
      .map(([name, items]) => ({ name, tracks: items }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  const albums = computed(() => {
    const map = new Map<string, DisplayTrack[]>()
    for (const track of tracks.value) {
      const key = resolveDisplayAlbum(track.displayAlbum)
      const list = map.get(key) ?? []
      list.push(track)
      map.set(key, list)
    }
    return [...map.entries()]
      .map(([name, items]) => ({ name, tracks: items }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  async function applyEnrichment(track: DisplayTrack) {
    const patch = await enrichOneTrack(track)
    if (!patch) return
    const index = tracks.value.findIndex((t) => t.id === track.id)
    if (index < 0) return
    tracks.value[index] = {
      ...tracks.value[index]!,
      ...patch,
    }
  }

  /** Enqueue best-effort enrich for the current track list. */
  function scheduleEnrichment() {
    for (const track of tracks.value) {
      void enqueueEnrich(() => applyEnrichment(track))
    }
  }

  /** Reset display fields to config-only (drop extracted covers/meta in memory). */
  function resetDisplayFromConfig() {
    tracks.value = tracks.value.map((track) => toDisplayTrack(track))
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
      tracks.value = normalized.tracks.map(toDisplayTrack)
      scheduleEnrichment()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : String(error)
      tracks.value = []
      playlists.value = []
    } finally {
      loading.value = false
    }
  }

  function search(query: string) {
    const q = query.trim().toLowerCase()
    if (!q) {
      return {
        tracks: [] as DisplayTrack[],
        artists: [] as string[],
        albums: [] as string[],
      }
    }
    const matchedTracks = tracks.value.filter(
      (t) =>
        t.displayTitle.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.displayArtist.toLowerCase().includes(q) ||
        t.displayAlbum.toLowerCase().includes(q),
    )
    const matchedArtists = artists.value
      .filter((a) => a.name.toLowerCase().includes(q))
      .map((a) => a.name)
    const matchedAlbums = albums.value
      .filter((a) => a.name.toLowerCase().includes(q))
      .map((a) => a.name)
    return {
      tracks: matchedTracks,
      artists: matchedArtists,
      albums: matchedAlbums,
    }
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
    resetDisplayFromConfig,
  }
})
