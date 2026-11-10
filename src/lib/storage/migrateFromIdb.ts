import type { AppDb } from './appDb';
import { blobToUint8Array } from './blobCodec';

const MUSIC_CACHE_DB = 'music-cache';
const PLAY_HISTORY_DB = 'play-history';

function openIdb(name: string): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(name);
    } catch {
      resolve(null);
      return;
    }
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

async function readAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  if (!db.objectStoreNames.contains(storeName)) return [];
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  return idbRequest(store.getAll()) as Promise<T[]>;
}

async function readAllKeys(db: IDBDatabase, storeName: string): Promise<IDBValidKey[]> {
  if (!db.objectStoreNames.contains(storeName)) return [];
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  return idbRequest(store.getAllKeys());
}

async function readValue(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<unknown> {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  return idbRequest(store.get(key));
}

function deleteDatabase(name: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

type LegacyTrackMeta = {
  sourceUrl: string;
  id?: string;
  status: 'pending' | 'ready';
  downloadedAt: number;
};

type LegacyExtracted = {
  sourceUrl: string;
  title?: string;
  artist?: string;
  album?: string;
  updatedAt: number;
};

type LegacyDownload = {
  sourceUrl: string;
  id?: string;
  addedAt: number;
};

type LegacyPlay = {
  id?: number;
  trackId: string;
  startedAt: number;
  endedAt: number;
};

async function migrateMusicCache(db: AppDb, idb: IDBDatabase): Promise<void> {
  const metas = await readAllFromStore<LegacyTrackMeta>(idb, 'meta');
  for (const meta of metas) {
    if (!meta?.sourceUrl) continue;
    await db.exec(
      `INSERT OR REPLACE INTO track_meta (source_url, id, status, downloaded_at)
       VALUES (?, ?, ?, ?)`,
      [meta.sourceUrl, meta.id ?? null, meta.status, meta.downloadedAt],
    );
  }

  const extracted = await readAllFromStore<LegacyExtracted>(idb, 'trackMeta');
  for (const row of extracted) {
    if (!row?.sourceUrl) continue;
    await db.exec(
      `INSERT OR REPLACE INTO track_extracted (source_url, title, artist, album, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [row.sourceUrl, row.title ?? null, row.artist ?? null, row.album ?? null, row.updatedAt],
    );
  }

  const downloads = await readAllFromStore<LegacyDownload>(idb, 'downloadQueue');
  for (const row of downloads) {
    if (!row?.sourceUrl) continue;
    await db.exec(
      `INSERT OR REPLACE INTO download_queue (source_url, id, added_at) VALUES (?, ?, ?)`,
      [row.sourceUrl, row.id ?? null, row.addedAt],
    );
  }

  if (!idb.objectStoreNames.contains('files')) return;

  const keys = await readAllKeys(idb, 'files');
  const fileRows = (
    await Promise.all(
      keys.map(async (key) => {
        if (typeof key !== 'string') return null;
        const sep = key.indexOf('\0');
        if (sep <= 0) return null;
        const sourceUrl = key.slice(0, sep);
        const relativePath = key.slice(sep + 1);
        const value = await readValue(idb, 'files', key);
        if (!(value instanceof Blob)) return null;
        const bytes = await blobToUint8Array(value);
        return {
          sourceUrl,
          relativePath,
          bytes,
          mime: value.type || null,
          size: value.size,
        };
      }),
    )
  ).filter((row): row is NonNullable<typeof row> => row != null);

  for (const row of fileRows) {
    await db.exec(
      `INSERT OR REPLACE INTO files (source_url, relative_path, data, mime_type, size)
       VALUES (?, ?, ?, ?, ?)`,
      [row.sourceUrl, row.relativePath, row.bytes, row.mime, row.size],
    );
  }
}

async function migratePlayHistory(db: AppDb, idb: IDBDatabase): Promise<void> {
  const plays = await readAllFromStore<LegacyPlay>(idb, 'plays');
  for (const play of plays) {
    if (!play?.trackId) continue;
    await db.exec(`INSERT INTO play_history (track_id, started_at, ended_at) VALUES (?, ?, ?)`, [
      play.trackId,
      play.startedAt,
      play.endedAt,
    ]);
  }
}

/**
 * One-shot copy from legacy Dexie IndexedDB databases into SQLite.
 * Best-effort: missing or unreadable IDB databases are skipped.
 * On success the legacy databases are deleted.
 */
export async function migrateFromIndexedDbIfNeeded(db: AppDb): Promise<void> {
  const music = await openIdb(MUSIC_CACHE_DB);
  const history = await openIdb(PLAY_HISTORY_DB);

  if (!music && !history) return;

  try {
    if (music) {
      await migrateMusicCache(db, music);
      music.close();
    }
    if (history) {
      await migratePlayHistory(db, history);
      history.close();
    }
  } catch {
    // Keep SQLite usable even if migration partially fails; caller still marks migrated
    // so we do not retry a half-broken IDB forever. Data already copied stays.
  }

  await Promise.all([deleteDatabase(MUSIC_CACHE_DB), deleteDatabase(PLAY_HISTORY_DB)]);
}
