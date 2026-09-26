import {
  createCatalogBootstrap,
  type CatalogBootstrapPorts,
} from '@/lib/catalog/createCatalogBootstrap';

export { createCatalogBootstrap };
export type { CatalogBootstrapPorts };

type CatalogBootstrapApi = ReturnType<typeof createCatalogBootstrap>;

let bound: CatalogBootstrapApi | null = null;

/** Wire store/cache ports once at app (or test) startup. `lib` does not import Zustand. */
export function bindCatalogBootstrap(ports: CatalogBootstrapPorts) {
  bound = createCatalogBootstrap(ports);
}

function api(): CatalogBootstrapApi {
  if (!bound) {
    throw new Error('Catalog bootstrap is not bound');
  }
  return bound;
}

/** Load catalog from the current config URL, then hydrate player from known ids. */
export async function loadCatalogAndHydratePlayer(): Promise<void> {
  return api().loadCatalogAndHydratePlayer();
}

/**
 * Ensure the catalog is loaded (with player hydrate). No-op when tracks already
 * exist; joins an in-flight bootstrap/load instead of starting a second fetch.
 */
export async function ensureCatalogLoaded(): Promise<void> {
  return api().ensureCatalogLoaded();
}

/**
 * Clear IndexedDB audio/meta caches, reset in-memory display fields to config-only,
 * clear now playing / the play queue, and re-enqueue enrichment.
 */
export async function clearMusicCachesAndRefresh(): Promise<void> {
  return api().clearMusicCachesAndRefresh();
}
