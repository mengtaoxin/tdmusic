export type CatalogBootstrapPorts = {
  loadCatalog: () => Promise<void>
  getTrackIds: () => readonly string[]
  hydratePlayer: (knownIds: Set<string>) => boolean | void
  clearAllMusicCaches: () => Promise<void>
  /** Clear listen-history IndexedDB (Settings → Clear all cache). */
  clearPlayHistory: () => Promise<void>
  /** Drop queued ID3/cover enrich work (catalog owns this queue, not cache). */
  clearEnrichQueue: () => void
  resetDisplayFromConfig: () => void
  scheduleEnrichment: () => void
  clearNowPlaying: () => void
}

export function createCatalogBootstrap(ports: CatalogBootstrapPorts) {
  let loadInFlight: Promise<void> | null = null

  async function loadCatalogAndHydratePlayer(): Promise<void> {
    if (loadInFlight) return loadInFlight

    loadInFlight = (async () => {
      await ports.loadCatalog()
      ports.hydratePlayer(new Set(ports.getTrackIds()))
    })().finally(() => {
      loadInFlight = null
    })

    return loadInFlight
  }

  async function ensureCatalogLoaded(): Promise<void> {
    if (ports.getTrackIds().length) return
    await loadCatalogAndHydratePlayer()
  }

  async function clearMusicCachesAndRefresh(): Promise<void> {
    ports.clearEnrichQueue()
    await Promise.all([ports.clearAllMusicCaches(), ports.clearPlayHistory()])
    ports.resetDisplayFromConfig()
    ports.scheduleEnrichment()
    ports.clearNowPlaying()
  }

  return {
    loadCatalogAndHydratePlayer,
    ensureCatalogLoaded,
    clearMusicCachesAndRefresh,
  }
}
