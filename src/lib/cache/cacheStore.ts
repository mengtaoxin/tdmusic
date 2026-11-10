import type { SqlValue } from '@sqlite.org/sqlite-wasm';

import { openAppDb } from '@/lib/storage/appDb';
import { blobToUint8Array, uint8ArrayToBlob } from '@/lib/storage/blobCodec';

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

/** A user-requested (manual) download that has not finished yet. */
export type DownloadQueueEntry = {
  sourceUrl: string;
  id?: string;
  addedAt: number;
};

export const AUDIO_FILE_KEY = '__audio__';
export const COVER_FILE_KEY = '__cover__';

const blobUrlCache = new Map<string, string>();

export function fileRecordKey(sourceUrl: string, relativePath: string) {
  return `${sourceUrl}\0${relativePath}`;
}

function revokeAllBlobUrls() {
  for (const [, url] of blobUrlCache) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();
}

function revokeBlobUrlsForSource(sourceUrl: string) {
  const prefix = `${sourceUrl}\0`;
  for (const [key, url] of blobUrlCache) {
    if (key.startsWith(prefix)) {
      URL.revokeObjectURL(url);
      blobUrlCache.delete(key);
    }
  }
}

function optionalString(value: SqlValue | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export async function isTrackCached(sourceUrl: string): Promise<boolean> {
  const db = await openAppDb();
  const row = await db.get<{ status: string }>(
    'SELECT status FROM track_meta WHERE source_url = ?',
    [sourceUrl],
  );
  return row?.status === 'ready';
}

export async function getCachedFile(
  sourceUrl: string,
  relativePath: string = AUDIO_FILE_KEY,
): Promise<Blob | null> {
  const db = await openAppDb();
  const row = await db.get<{ data: Uint8Array; mime_type: string | null }>(
    'SELECT data, mime_type FROM files WHERE source_url = ? AND relative_path = ?',
    [sourceUrl, relativePath],
  );
  if (!row?.data) return null;
  return uint8ArrayToBlob(row.data, row.mime_type);
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

const AUDIO_BLOB_KEY_SUFFIX = `\0${AUDIO_FILE_KEY}`;

/** Drop audio object URLs other than `keepUrl`. Cover URLs stay. */
export function releaseAudioBlobUrlsExcept(keepUrl: string | null): void {
  for (const [key, url] of blobUrlCache) {
    if (!key.endsWith(AUDIO_BLOB_KEY_SUFFIX)) continue;
    if (keepUrl != null && url === keepUrl) continue;
    URL.revokeObjectURL(url);
    blobUrlCache.delete(key);
  }
}

export async function putFiles(
  sourceUrl: string,
  entries: Array<{ relativePath: string; blob: Blob }>,
) {
  const db = await openAppDb();
  const prepared = await Promise.all(
    entries.map(async (entry) => ({
      relativePath: entry.relativePath,
      bytes: await blobToUint8Array(entry.blob),
      mime: entry.blob.type,
      size: entry.blob.size,
    })),
  );

  await db.runInTransaction(
    prepared.map((entry) => ({
      sql: `INSERT OR REPLACE INTO files (source_url, relative_path, data, mime_type, size)
            VALUES (?, ?, ?, ?, ?)`,
      bind: [sourceUrl, entry.relativePath, entry.bytes, entry.mime || null, entry.size] as const,
    })),
  );
}

export async function putMeta(meta: TrackCacheMeta) {
  const db = await openAppDb();
  await db.exec(
    `INSERT OR REPLACE INTO track_meta (source_url, id, status, downloaded_at)
     VALUES (?, ?, ?, ?)`,
    [meta.sourceUrl, meta.id ?? null, meta.status, meta.downloadedAt],
  );
}

export async function putExtractedTrackMeta(meta: ExtractedTrackMeta) {
  const db = await openAppDb();
  await db.exec(
    `INSERT OR REPLACE INTO track_extracted (source_url, title, artist, album, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [meta.sourceUrl, meta.title ?? null, meta.artist ?? null, meta.album ?? null, meta.updatedAt],
  );
}

export async function getExtractedTrackMeta(sourceUrl: string): Promise<ExtractedTrackMeta | null> {
  const db = await openAppDb();
  const row = await db.get<{
    source_url: string;
    title: string | null;
    artist: string | null;
    album: string | null;
    updated_at: number;
  }>(
    'SELECT source_url, title, artist, album, updated_at FROM track_extracted WHERE source_url = ?',
    [sourceUrl],
  );
  if (!row) return null;
  return {
    sourceUrl: row.source_url,
    title: optionalString(row.title),
    artist: optionalString(row.artist),
    album: optionalString(row.album),
    updatedAt: Number(row.updated_at),
  };
}

export type CachedFileInfo = { size: number; type: string };

/** What the local DB holds for one track (audio, extracted cover, tags). */
export type TrackCacheDetails = {
  status: TrackCacheMeta['status'] | null;
  downloadedAt: number | null;
  audio: CachedFileInfo | null;
  cover: CachedFileInfo | null;
  extracted: ExtractedTrackMeta | null;
};

function fileInfo(
  size: number | null | undefined,
  type: string | null | undefined,
): CachedFileInfo | null {
  if (size == null) return null;
  return { size: Number(size), type: type ?? '' };
}

export async function getTrackCacheDetails(sourceUrl: string): Promise<TrackCacheDetails> {
  const db = await openAppDb();
  const meta = await db.get<{ status: TrackCacheMeta['status']; downloaded_at: number }>(
    'SELECT status, downloaded_at FROM track_meta WHERE source_url = ?',
    [sourceUrl],
  );
  const audio = await db.get<{ size: number; mime_type: string | null }>(
    'SELECT size, mime_type FROM files WHERE source_url = ? AND relative_path = ?',
    [sourceUrl, AUDIO_FILE_KEY],
  );
  const cover = await db.get<{ size: number; mime_type: string | null }>(
    'SELECT size, mime_type FROM files WHERE source_url = ? AND relative_path = ?',
    [sourceUrl, COVER_FILE_KEY],
  );
  const extracted = await getExtractedTrackMeta(sourceUrl);
  return {
    status: meta?.status ?? null,
    downloadedAt: meta ? Number(meta.downloaded_at) : null,
    audio: fileInfo(audio?.size, audio?.mime_type),
    cover: fileInfo(cover?.size, cover?.mime_type),
    extracted,
  };
}

export async function listTrackMetas(): Promise<TrackCacheMeta[]> {
  const db = await openAppDb();
  const rows = await db.all<{
    source_url: string;
    id: string | null;
    status: TrackCacheMeta['status'];
    downloaded_at: number;
  }>('SELECT source_url, id, status, downloaded_at FROM track_meta');
  return rows.map((row) => ({
    sourceUrl: row.source_url,
    id: optionalString(row.id),
    status: row.status,
    downloadedAt: Number(row.downloaded_at),
  }));
}

/** Total size of cached audio and cover blobs in the files table. */
export async function getMusicCacheSizeBytes(): Promise<number> {
  const db = await openAppDb();
  const row = await db.get<{ total: number | null }>(
    'SELECT COALESCE(SUM(size), 0) AS total FROM files',
  );
  return Number(row?.total ?? 0);
}

export async function deleteTrackCacheRecords(sourceUrl: string): Promise<void> {
  revokeBlobUrlsForSource(sourceUrl);
  const db = await openAppDb();
  await db.runInTransaction([
    { sql: 'DELETE FROM track_meta WHERE source_url = ?', bind: [sourceUrl] },
    { sql: 'DELETE FROM track_extracted WHERE source_url = ?', bind: [sourceUrl] },
    { sql: 'DELETE FROM files WHERE source_url = ?', bind: [sourceUrl] },
  ]);
}

export async function clearAllCacheRecords(): Promise<void> {
  revokeAllBlobUrls();
  const db = await openAppDb();
  await db.runInTransaction([
    { sql: 'DELETE FROM track_meta' },
    { sql: 'DELETE FROM track_extracted' },
    { sql: 'DELETE FROM files' },
  ]);
}

/** Manual download queue, oldest first. */
export async function listDownloadQueue(): Promise<DownloadQueueEntry[]> {
  const db = await openAppDb();
  const rows = await db.all<{ source_url: string; id: string | null; added_at: number }>(
    'SELECT source_url, id, added_at FROM download_queue ORDER BY added_at ASC',
  );
  return rows.map((row) => ({
    sourceUrl: row.source_url,
    id: optionalString(row.id),
    addedAt: Number(row.added_at),
  }));
}

export async function putDownloadQueueEntries(entries: DownloadQueueEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const db = await openAppDb();
  await db.runInTransaction(
    entries.map((entry) => ({
      sql: `INSERT OR REPLACE INTO download_queue (source_url, id, added_at) VALUES (?, ?, ?)`,
      bind: [entry.sourceUrl, entry.id ?? null, entry.addedAt] as const,
    })),
  );
}

export async function deleteDownloadQueueEntry(sourceUrl: string): Promise<void> {
  const db = await openAppDb();
  await db.exec('DELETE FROM download_queue WHERE source_url = ?', [sourceUrl]);
}

export async function clearDownloadQueue(): Promise<void> {
  const db = await openAppDb();
  await db.exec('DELETE FROM download_queue');
}

/** Clear cache tables and in-memory blob URLs (tests). */
export async function resetCacheDbForTests(): Promise<void> {
  revokeAllBlobUrls();
  const db = await openAppDb({ memory: true });
  await db.runInTransaction([
    { sql: 'DELETE FROM track_meta' },
    { sql: 'DELETE FROM track_extracted' },
    { sql: 'DELETE FROM files' },
    { sql: 'DELETE FROM download_queue' },
  ]);
}

/** @deprecated Prefer resetCacheDbForTests */
export function resetBlobUrlCacheForTests() {
  revokeAllBlobUrls();
}
