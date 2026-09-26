import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AUDIO_FILE_KEY,
  getExtractedTrackMeta,
  putExtractedTrackMeta,
  putFiles,
  resetCacheDbForTests,
} from '@/lib/cache/cacheStore';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import {
  clearMusicCachesAndRefresh,
  ensureCatalogLoaded,
  loadCatalogAndHydratePlayer,
} from '@/lib/catalog/catalogBootstrap';
import { enqueueEnrich, getEnrichQueueStatsForTests } from '@/lib/catalog/enrichQueue';
import * as loadConfigs from '@/lib/catalog/loadConfigs';
import {
  listPlayHistory,
  resetPlayHistoryDbForTests,
  savePlayRecord,
} from '@/lib/playback/playHistoryStore';
import { useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

function sampleTracks(): DisplayTrack[] {
  return [
    {
      id: 'a',
      path: '/a.mp3',
      volumeRatio: 100,
      displayTitle: 'A',
      displayArtist: 'Unknown artist',
      displayAlbum: 'Unknown album',
    },
  ];
}

function sampleConfigs() {
  return { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
}

describe('catalogBootstrap', () => {
  beforeEach(async () => {
    await resetCacheDbForTests();
    await resetPlayHistoryDbForTests();
    vi.restoreAllMocks();
  });

  it('loadCatalogAndHydratePlayer loads catalog then hydrates player', async () => {
    const fetchConfigs = vi
      .spyOn(loadConfigs, 'loadConfigsJson')
      .mockResolvedValue(sampleConfigs());
    const hydrate = vi.spyOn(usePlayerStore.getState(), 'hydrate').mockReturnValue(true);

    await loadCatalogAndHydratePlayer();

    expect(fetchConfigs).toHaveBeenCalledOnce();
    expect(useCatalogStore.getState().snapshot.tracks.map((track) => track.id)).toEqual(['a']);
    expect(hydrate).toHaveBeenCalledWith(new Set(['a']));
  });

  it('ensureCatalogLoaded is a no-op when tracks are already present', async () => {
    useCatalogStore.getState().setTracks(sampleTracks());
    const fetchConfigs = vi.spyOn(loadConfigs, 'loadConfigsJson');
    const hydrate = vi.spyOn(usePlayerStore.getState(), 'hydrate');

    await ensureCatalogLoaded();

    expect(fetchConfigs).not.toHaveBeenCalled();
    expect(hydrate).not.toHaveBeenCalled();
  });

  it('ensureCatalogLoaded joins an in-flight loadCatalogAndHydratePlayer', async () => {
    let finishLoad!: () => void;
    const loadGate = new Promise<void>((resolve) => {
      finishLoad = resolve;
    });
    const fetchConfigs = vi.spyOn(loadConfigs, 'loadConfigsJson').mockImplementation(async () => {
      await loadGate;
      return sampleConfigs();
    });
    const hydrate = vi.spyOn(usePlayerStore.getState(), 'hydrate').mockReturnValue(true);

    const first = loadCatalogAndHydratePlayer();
    const second = ensureCatalogLoaded();
    finishLoad();
    await Promise.all([first, second]);

    expect(fetchConfigs).toHaveBeenCalledOnce();
    expect(hydrate).toHaveBeenCalledOnce();
  });

  it('clearMusicCachesAndRefresh clears IDB and resets extracted display fields', async () => {
    const sourceUrl = 'https://example.com/cached.mp3';
    await putFiles(sourceUrl, [{ relativePath: AUDIO_FILE_KEY, blob: new Blob(['audio']) }]);
    await putExtractedTrackMeta({
      sourceUrl,
      title: 'Extracted Title',
      artist: 'Extracted Artist',
      album: 'Extracted Album',
      updatedAt: Date.now(),
    });

    useCatalogStore.getState().setTracks([
      {
        id: 't1',
        path: sourceUrl,
        title: 'Config',
        displayTitle: 'Extracted Title',
        displayArtist: 'Extracted Artist',
        displayAlbum: 'Extracted Album',
        displayCover: 'blob:http://tdmusic.test/old-cover',
      },
    ] as DisplayTrack[]);

    const catalog = useCatalogStore.getState();
    const schedule = vi.spyOn(catalog, 'scheduleEnrichment').mockImplementation(() => {});

    await clearMusicCachesAndRefresh();

    expect(await getExtractedTrackMeta(sourceUrl)).toBeNull();
    const track = useCatalogStore.getState().snapshot.tracks[0];
    expect(track).toMatchObject({
      id: 't1',
      path: sourceUrl,
      title: 'Config',
      displayTitle: 'Config',
      displayArtist: 'Unknown artist',
      displayAlbum: 'Unknown album',
    });
    expect(track!.displayCover).toBeUndefined();
    expect(schedule).toHaveBeenCalledOnce();
  });

  it('clearMusicCachesAndRefresh also clears now playing and the play queue', async () => {
    useCatalogStore.getState().setTracks(sampleTracks());
    vi.spyOn(useCatalogStore.getState(), 'scheduleEnrichment').mockImplementation(() => {});

    const player = usePlayerStore.getState();
    player.playFrom(0, ['a']);
    usePlayerStore.setState({ playing: true });

    await clearMusicCachesAndRefresh();

    const after = usePlayerStore.getState();
    expect(after.queue).toEqual([]);
    expect(after.originalQueue).toEqual([]);
    expect(after.currentId).toBeNull();
    expect(after.playing).toBe(false);
  });

  it('clearMusicCachesAndRefresh also clears play history', async () => {
    vi.spyOn(useCatalogStore.getState(), 'scheduleEnrichment').mockImplementation(() => {});
    const now = Date.now();
    await savePlayRecord({ trackId: 'a', startedAt: now - 2_000, endedAt: now - 1_000 });
    expect(await listPlayHistory()).toHaveLength(1);

    await clearMusicCachesAndRefresh();

    expect(await listPlayHistory()).toEqual([]);
  });

  it('clearMusicCachesAndRefresh drops queued enrich work', async () => {
    vi.spyOn(useCatalogStore.getState(), 'scheduleEnrichment').mockImplementation(() => {});
    const releases: Array<() => void> = [];
    const blocked = () =>
      new Promise<void>((resolve) => {
        releases.push(resolve);
      });
    void enqueueEnrich(blocked);
    void enqueueEnrich(blocked);
    void enqueueEnrich(blocked);
    await Promise.resolve();
    await Promise.resolve();
    expect(getEnrichQueueStatsForTests().pending).toBe(1);

    await clearMusicCachesAndRefresh();

    expect(getEnrichQueueStatsForTests().pending).toBe(0);
    for (const release of releases) release();
  });
});
