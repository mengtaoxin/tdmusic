import { clearAllMusicCaches } from '@/lib/cache/musicCache';
import { bindCatalogBootstrap } from '@/lib/catalog/catalogBootstrap';
import { clearEnrichQueue } from '@/lib/catalog/enrichQueue';
import { loadConfigsJson } from '@/lib/catalog/loadConfigs';
import { runCatalogLoad } from '@/lib/catalog/runCatalogLoad';
import { clearPlayHistory } from '@/lib/playback/playHistoryStore';
import { useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

/** Bind catalog bootstrap ports to the live Zustand stores. */
export function bindAppCatalogBootstrap() {
  bindCatalogBootstrap({
    loadCatalog: () =>
      runCatalogLoad({
        loadConfigsJson,
        beginLoad: () => useCatalogStore.getState().beginLoad(),
        applyNormalized: (normalized) => useCatalogStore.getState().applyNormalized(normalized),
        failLoad: (message) => useCatalogStore.getState().failLoad(message),
        finishLoad: () => useCatalogStore.getState().finishLoad(),
        clearEnrichQueue,
        scheduleEnrichment: () => useCatalogStore.getState().scheduleEnrichment(),
      }),
    getTrackIds: () => useCatalogStore.getState().snapshot.tracks.map((track) => track.id),
    hydratePlayer: (ids) => usePlayerStore.getState().hydrate(ids),
    clearAllMusicCaches,
    clearPlayHistory,
    clearEnrichQueue,
    resetDisplayFromConfig: () => useCatalogStore.getState().resetDisplayFromConfig(),
    scheduleEnrichment: () => useCatalogStore.getState().scheduleEnrichment(),
    clearNowPlaying: () => usePlayerStore.getState().clearNowPlaying(),
  });
}
