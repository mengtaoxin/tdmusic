import { beforeEach, describe, expect, it } from 'vitest';

import {
  AUDIO_FILE_KEY,
  getCachedFile,
  isTrackCached,
  listDownloadQueue,
} from '@/lib/cache/cacheStore';
import { listPlayHistory } from '@/lib/playback/playHistoryStore';
import { closeAppDbForTests, openAppDb } from '@/lib/storage/appDb';
import { META_IDB_MIGRATED_KEY } from '@/lib/storage/appDbSchema';

function waitTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('tx failed'));
  });
}

async function seedLegacyMusicCache(): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('music-cache', 2);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains('meta'))
        database.createObjectStore('meta', { keyPath: 'sourceUrl' });
      if (!database.objectStoreNames.contains('files')) database.createObjectStore('files');
      if (!database.objectStoreNames.contains('trackMeta')) {
        database.createObjectStore('trackMeta', { keyPath: 'sourceUrl' });
      }
      if (!database.objectStoreNames.contains('downloadQueue')) {
        database.createObjectStore('downloadQueue', { keyPath: 'sourceUrl' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('open music-cache failed'));
  });

  const sourceUrl = 'https://example.com/migrated.mp3';
  const tx = db.transaction(['meta', 'files', 'trackMeta', 'downloadQueue'], 'readwrite');
  tx.objectStore('meta').put({
    sourceUrl,
    id: 'migrated',
    status: 'ready',
    downloadedAt: 42,
  });
  tx.objectStore('files').put(
    new Blob(['audio-bytes'], { type: 'audio/mpeg' }),
    `${sourceUrl}\0${AUDIO_FILE_KEY}`,
  );
  tx.objectStore('trackMeta').put({
    sourceUrl,
    title: 'Migrated',
    updatedAt: 99,
  });
  tx.objectStore('downloadQueue').put({
    sourceUrl: 'https://example.com/queued.mp3',
    id: 'queued',
    addedAt: 7,
  });
  await waitTx(tx);
  db.close();
}

async function seedLegacyPlayHistory(): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('play-history', 1);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains('plays')) {
        const store = database.createObjectStore('plays', { keyPath: 'id', autoIncrement: true });
        store.createIndex('startedAt', 'startedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('open play-history failed'));
  });

  const tx = db.transaction('plays', 'readwrite');
  tx.objectStore('plays').add({
    trackId: 'track-migrated',
    startedAt: 1000,
    endedAt: 2000,
  });
  await waitTx(tx);
  db.close();
}

async function deleteDb(name: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('migrateFromIndexedDbIfNeeded', () => {
  beforeEach(async () => {
    await closeAppDbForTests();
    await Promise.all([deleteDb('music-cache'), deleteDb('play-history')]);
  });

  it('copies legacy IndexedDB music cache and play history into SQLite once', async () => {
    await seedLegacyMusicCache();
    await seedLegacyPlayHistory();

    const db = await openAppDb({ memory: true });

    expect(await db.getMeta(META_IDB_MIGRATED_KEY)).toBe('1');
    expect(await isTrackCached('https://example.com/migrated.mp3')).toBe(true);
    const audio = await getCachedFile('https://example.com/migrated.mp3');
    expect(audio).not.toBeNull();
    expect(await audio!.text()).toBe('audio-bytes');
    expect(await listDownloadQueue()).toEqual([
      { sourceUrl: 'https://example.com/queued.mp3', id: 'queued', addedAt: 7 },
    ]);
    expect(await listPlayHistory()).toEqual([
      expect.objectContaining({ trackId: 'track-migrated', startedAt: 1000, endedAt: 2000 }),
    ]);

    const remaining = await indexedDB.databases();
    expect(remaining.some((info) => info.name === 'music-cache')).toBe(false);
    expect(remaining.some((info) => info.name === 'play-history')).toBe(false);
  });
});
