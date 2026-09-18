import { clearAllMusicCaches } from '@/lib/cache/musicCache'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

/** Shared in-flight load so App bootstrap and route views do not race. */
let loadInFlight: Promise<void> | null = null

/** Load catalog from the current config URL, then hydrate player from known ids. */
export async function loadCatalogAndHydratePlayer(): Promise<void> {
  if (loadInFlight) return loadInFlight

  loadInFlight = (async () => {
    await useCatalogStore.getState().load()
    const ids = new Set(useCatalogStore.getState().snapshot.tracks.map((track) => track.id))
    usePlayerStore.getState().hydrate(ids)
  })().finally(() => {
    loadInFlight = null
  })

  return loadInFlight
}

/**
 * Ensure the catalog is loaded (with player hydrate). No-op when tracks already
 * exist; joins an in-flight bootstrap/load instead of starting a second fetch.
 */
export async function ensureCatalogLoaded(): Promise<void> {
  if (useCatalogStore.getState().snapshot.tracks.length) return
  await loadCatalogAndHydratePlayer()
}

/**
 * Clear IndexedDB audio/meta caches, reset in-memory display fields to config-only,
 * clear now playing / the play queue, and re-enqueue enrichment.
 */
export async function clearMusicCachesAndRefresh(): Promise<void> {
  await clearAllMusicCaches()
  const catalog = useCatalogStore.getState()
  catalog.resetDisplayFromConfig()
  catalog.scheduleEnrichment()
  usePlayerStore.getState().clearNowPlaying()
}
