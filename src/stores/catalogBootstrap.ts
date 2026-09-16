import { clearAllMusicCaches } from '@/lib/musicCache'

import { useCatalogStore } from './catalog'
import { usePlayerStore } from './player'

/** Shared in-flight load so App bootstrap and route views do not race. */
let loadInFlight: Promise<void> | null = null

/** Load catalog from the current config URL, then hydrate player from known ids. */
export async function loadCatalogAndHydratePlayer(): Promise<void> {
  if (loadInFlight) return loadInFlight

  loadInFlight = (async () => {
    const catalog = useCatalogStore()
    const player = usePlayerStore()
    await catalog.load()
    player.hydrate(new Set(catalog.tracks.map((track) => track.id)))
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
  const catalog = useCatalogStore()
  if (catalog.tracks.length) return
  await loadCatalogAndHydratePlayer()
}

/**
 * Clear IndexedDB audio/meta caches, reset in-memory display fields to config-only,
 * and re-enqueue enrichment.
 */
export async function clearMusicCachesAndRefresh(): Promise<void> {
  await clearAllMusicCaches()
  const catalog = useCatalogStore()
  catalog.resetDisplayFromConfig()
  catalog.scheduleEnrichment()
}
