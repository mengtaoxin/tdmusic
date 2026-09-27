import Dexie, { type EntityTable, type Table } from 'dexie';

import { blobForPlayableObjectUrl } from './audioMimeFromPath';

export type TrackCacheMeta = {
  sourceUrl: string;
  id?: string;
  status: 'pending' | 'ready';
  downloadedAt: number;
};

export type ExtractedTrackMeta = {
  sourceUrl: string;
  title?: string;
  artist?: string;
  album?: string;
  updatedAt: number;
};

export const AUDIO_FILE_KEY = '__audio__';
export const COVER_FILE_KEY = '__cover__';
const KEY_SEP = '\0';

const db = new Dexie('music-cache') as Dexie & {
  meta: EntityTable<TrackCacheMeta, 'sourceUrl'>;
  /** Outbound keys from `fileRecordKey`; values are raw Blobs. */
  files: Table<Blob, string>;
  trackMeta: EntityTable<ExtractedTrackMeta, 'sourceUrl'>;
};

db.version(1).stores({
  meta: 'sourceUrl',
  files: '',
  trackMeta: 'sourceUrl',
});

const blobUrlCache = new Map<string, string>();

export function fileRecordKey(sourceUrl: string, relativePath: string) {
  return `${sourceUrl}${KEY_SEP}${relativePath}`;
}

function revokeAllBlobUrls() {
  for (const [, url] of blobUrlCache) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();
}

function revokeBlobUrlsForSource(sourceUrl: string) {
  const prefix = `${sourceUrl}${KEY_SEP}`;
  for (const [key, url] of blobUrlCache) {
    if (key.startsWith(prefix)) {
      URL.revokeObjectURL(url);
      blobUrlCache.delete(key);
    }
  }
}

export async function isTrackCached(sourceUrl: string): Promise<boolean> {
  const meta = await db.meta.get(sourceUrl);
  return meta?.status === 'ready';
}

export async function getCachedFile(
  sourceUrl: string,
  relativePath: string = AUDIO_FILE_KEY,
): Promise<Blob | null> {
  const blob = await db.files.get(fileRecordKey(sourceUrl, relativePath));
  return blob instanceof Blob ? blob : null;
}

export async function getCachedBlobUrl(
  sourceUrl: string,
  relativePath: string = AUDIO_FILE_KEY,
): Promise<string | null> {
  const cacheKey = fileRecordKey(sourceUrl, relativePath);
  const existing = blobUrlCache.get(cacheKey);
  if (existing) return existing;

  const blob = await getCachedFile(sourceUrl, relativePath);
  if (!blob) return null;

  const forUrl = relativePath === AUDIO_FILE_KEY ? blobForPlayableObjectUrl(sourceUrl, blob) : blob;
  const url = URL.createObjectURL(forUrl);
  blobUrlCache.set(cacheKey, url);
  return url;
}

export function peekBlobUrl(
  sourceUrl: string,
  relativePath: string = AUDIO_FILE_KEY,
): string | undefined {
  return blobUrlCache.get(fileRecordKey(sourceUrl, relativePath));
}

export async function putFiles(
  sourceUrl: string,
  entries: Array<{ relativePath: string; blob: Blob }>,
) {
  await db.files.bulkPut(
    entries.map((entry) => entry.blob),
    entries.map((entry) => fileRecordKey(sourceUrl, entry.relativePath)),
  );
}

export async function putMeta(meta: TrackCacheMeta) {
  await db.meta.put(meta);
}

export async function putExtractedTrackMeta(meta: ExtractedTrackMeta) {
  await db.trackMeta.put(meta);
}

export async function getExtractedTrackMeta(sourceUrl: string): Promise<ExtractedTrackMeta | null> {
  return (await db.trackMeta.get(sourceUrl)) ?? null;
}

export async function listTrackMetas(): Promise<TrackCacheMeta[]> {
  return db.meta.toArray();
}

/** Total size of cached audio and cover blobs in the files store. */
export async function getMusicCacheSizeBytes(): Promise<number> {
  let total = 0;
  await db.files.each((value) => {
    if (value instanceof Blob) total += value.size;
  });
  return total;
}

export async function deleteTrackCacheRecords(sourceUrl: string): Promise<void> {
  revokeBlobUrlsForSource(sourceUrl);

  await db.transaction('rw', db.meta, db.files, db.trackMeta, async () => {
    await Promise.all([
      db.meta.delete(sourceUrl),
      db.trackMeta.delete(sourceUrl),
      db.files.where(':id').startsWith(`${sourceUrl}${KEY_SEP}`).delete(),
    ]);
  });
}

export async function clearAllCacheRecords(): Promise<void> {
  revokeAllBlobUrls();

  await db.transaction('rw', db.meta, db.files, db.trackMeta, async () => {
    await Promise.all([db.meta.clear(), db.files.clear(), db.trackMeta.clear()]);
  });
}

/** Clear all records and in-memory blob URLs (tests). */
export async function resetCacheDbForTests(): Promise<void> {
  await clearAllCacheRecords();
}

/** @deprecated Prefer resetCacheDbForTests */
export function resetBlobUrlCacheForTests() {
  revokeAllBlobUrls();
}
