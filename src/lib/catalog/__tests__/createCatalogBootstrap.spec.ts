import { describe, expect, it, vi } from 'vitest';

import { createCatalogBootstrap } from '../createCatalogBootstrap';

function fakePorts() {
  return {
    loadCatalog: vi.fn<() => Promise<void>>(async () => undefined),
    getTrackIds: vi.fn<() => readonly string[]>(() => ['a', 'b']),
    hydratePlayer: vi.fn<(knownIds: Set<string>) => boolean>(() => true),
    clearAllMusicCaches: vi.fn<() => Promise<void>>(async () => undefined),
    clearPlayHistory: vi.fn<() => Promise<void>>(async () => undefined),
    clearEnrichQueue: vi.fn<() => void>(),
    resetDisplayFromConfig: vi.fn<() => void>(),
    scheduleEnrichment: vi.fn<() => void>(),
    clearNowPlaying: vi.fn<() => void>(),
  };
}

describe('createCatalogBootstrap', () => {
  it('loadCatalogAndHydratePlayer loads then hydrates known ids', async () => {
    const ports = fakePorts();
    const api = createCatalogBootstrap(ports);

    await api.loadCatalogAndHydratePlayer();

    expect(ports.loadCatalog).toHaveBeenCalledOnce();
    expect(ports.hydratePlayer).toHaveBeenCalledWith(new Set(['a', 'b']));
  });

  it('ensureCatalogLoaded is a no-op when tracks already exist', async () => {
    const ports = fakePorts();
    const api = createCatalogBootstrap(ports);

    await api.ensureCatalogLoaded();

    expect(ports.loadCatalog).not.toHaveBeenCalled();
    expect(ports.hydratePlayer).not.toHaveBeenCalled();
  });

  it('ensureCatalogLoaded loads when the catalog is empty', async () => {
    const ports = fakePorts();
    ports.getTrackIds.mockReturnValue([]);
    const api = createCatalogBootstrap(ports);

    await api.ensureCatalogLoaded();

    expect(ports.loadCatalog).toHaveBeenCalledOnce();
    expect(ports.hydratePlayer).toHaveBeenCalledWith(new Set());
  });

  it('concurrent loadCatalogAndHydratePlayer callers share one in-flight load', async () => {
    const ports = fakePorts();
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    ports.loadCatalog.mockImplementation(async () => {
      await gate;
    });
    const api = createCatalogBootstrap(ports);

    const first = api.loadCatalogAndHydratePlayer();
    const second = api.ensureCatalogLoaded();
    finish();
    await Promise.all([first, second]);

    expect(ports.loadCatalog).toHaveBeenCalledOnce();
    expect(ports.hydratePlayer).toHaveBeenCalledOnce();
  });

  it('clearMusicCachesAndRefresh clears caches, play history, resets display, re-enriches, and clears now playing', async () => {
    const ports = fakePorts();
    const api = createCatalogBootstrap(ports);

    await api.clearMusicCachesAndRefresh();

    expect(ports.clearEnrichQueue).toHaveBeenCalledOnce();
    expect(ports.clearAllMusicCaches).toHaveBeenCalledOnce();
    expect(ports.clearPlayHistory).toHaveBeenCalledOnce();
    expect(ports.resetDisplayFromConfig).toHaveBeenCalledOnce();
    expect(ports.scheduleEnrichment).toHaveBeenCalledOnce();
    expect(ports.clearNowPlaying).toHaveBeenCalledOnce();
    expect(ports.clearEnrichQueue.mock.invocationCallOrder[0]).toBeLessThan(
      ports.scheduleEnrichment.mock.invocationCallOrder[0]!,
    );
  });
});
