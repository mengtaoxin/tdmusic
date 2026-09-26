import {
  normalizeConfigs,
  type CatalogError,
  type MusicTrack,
  type NormalizedPlaylist,
} from './normalizeCatalog';

export type NormalizedCatalog = {
  tracks: MusicTrack[];
  playlists: NormalizedPlaylist[];
  errors: CatalogError[];
};

export type CatalogLoadPorts = {
  loadConfigsJson: () => Promise<unknown>;
  beginLoad: () => void;
  applyNormalized: (normalized: NormalizedCatalog) => void;
  failLoad: (message: string) => void;
  finishLoad: () => void;
  clearEnrichQueue: () => void;
  scheduleEnrichment: () => void;
};

/** Fetch + normalize configs.json; the catalog store only applies the snapshot. */
export async function runCatalogLoad(ports: CatalogLoadPorts): Promise<void> {
  ports.beginLoad();
  ports.clearEnrichQueue();
  try {
    const raw = await ports.loadConfigsJson();
    ports.applyNormalized(normalizeConfigs(raw));
    ports.scheduleEnrichment();
  } catch (error) {
    ports.failLoad(error instanceof Error ? error.message : String(error));
  } finally {
    ports.finishLoad();
  }
}
