import { clearAllMusicCaches } from '@/lib/cache/musicCache'
import { bindCatalogBootstrap } from '@/lib/catalog/catalogBootstrap'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

/** Bind catalog bootstrap ports to the live Zustand stores. */
export function bindAppCatalogBootstrap() {
  bindCatalogBootstrap({
    loadCatalog: () => useCatalogStore.getState().load(),
    getTrackIds: () => useCatalogStore.getState().snapshot.tracks.map((track) => track.id),
    hydratePlayer: (ids) => usePlayerStore.getState().hydrate(ids),
    clearAllMusicCaches,
    resetDisplayFromConfig: () => useCatalogStore.getState().resetDisplayFromConfig(),
    scheduleEnrichment: () => useCatalogStore.getState().scheduleEnrichment(),
    clearNowPlaying: () => usePlayerStore.getState().clearNowPlaying(),
  })
}
