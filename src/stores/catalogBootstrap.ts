import { clearAllMusicCaches } from '@/lib/musicCache'

import { useCatalogStore } from './catalog'
import { usePlayerStore } from './player'

/** Load catalog from the current config URL, then hydrate player from known ids. */
export async function loadCatalogAndHydratePlayer(): Promise<void> {
  const catalog = useCatalogStore()
  const player = usePlayerStore()
  await catalog.load()
  player.hydrate(new Set(catalog.tracks.map((track) => track.id)))
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
