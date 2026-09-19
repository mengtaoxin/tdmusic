import { blobForPlayableObjectUrl } from './audioMimeFromPath'

export type TrackCacheMeta = {
  sourceUrl: string
  id?: string
  status: 'pending' | 'ready'
  downloadedAt: number
}

export type ExtractedTrackMeta = {
  sourceUrl: string
  title?: string
  artist?: string
  album?: string
  updatedAt: number
}

const DB_NAME = 'music-cache'
const DB_VERSION = 1
const META_STORE = 'meta'
const FILES_STORE = 'files'
const TRACK_META_STORE = 'trackMeta'

export const AUDIO_FILE_KEY = '__audio__'
export const COVER_FILE_KEY = '__cover__'
const KEY_SEP = '\0'

const blobUrlCache = new Map<string, string>()

let dbPromise: Promise<IDBDatabase> | null = null

export function fileRecordKey(sourceUrl: string, relativePath: string) {
  return `${sourceUrl}${KEY_SEP}${relativePath}`
}

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => {
        dbPromise = null
        reject(request.error ?? new Error('IndexedDB open failed'))
      }
      request.onsuccess = () => {
        const db = request.result
        db.onclose = () => {
          dbPromise = null
        }
        resolve(db)
      }
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'sourceUrl' })
        }
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE)
        }
        if (!db.objectStoreNames.contains(TRACK_META_STORE)) {
          db.createObjectStore(TRACK_META_STORE, { keyPath: 'sourceUrl' })
        }
      }
    })
  }
  return dbPromise
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function idbTransactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

function revokeAllBlobUrls() {
  for (const [, url] of blobUrlCache) {
    URL.revokeObjectURL(url)
  }
  blobUrlCache.clear()
}

function revokeBlobUrlsForSource(sourceUrl: string) {
  const prefix = `${sourceUrl}${KEY_SEP}`
  for (const [key, url] of blobUrlCache) {
    if (key.startsWith(prefix)) {
      URL.revokeObjectURL(url)
      blobUrlCache.delete(key)
    }
  }
}

export async function isTrackCached(sourceUrl: string): Promise<boolean> {
  const db = await openDb()
  const meta = await idbRequest(
    db.transaction(META_STORE, 'readonly').objectStore(META_STORE).get(sourceUrl),
  )
  return Boolean(meta && (meta as TrackCacheMeta).status === 'ready')
}

export async function getCachedFile(
  sourceUrl: string,
  relativePath: string = AUDIO_FILE_KEY,
): Promise<Blob | null> {
  const db = await openDb()
  const key = fileRecordKey(sourceUrl, relativePath)
  const blob = await idbRequest(
    db.transaction(FILES_STORE, 'readonly').objectStore(FILES_STORE).get(key),
  )
  return blob instanceof Blob ? blob : null
}

export async function getCachedBlobUrl(
  sourceUrl: string,
  relativePath: string = AUDIO_FILE_KEY,
): Promise<string | null> {
  const cacheKey = fileRecordKey(sourceUrl, relativePath)
  const existing = blobUrlCache.get(cacheKey)
  if (existing) return existing

  const blob = await getCachedFile(sourceUrl, relativePath)
  if (!blob) return null

  const forUrl = relativePath === AUDIO_FILE_KEY ? blobForPlayableObjectUrl(sourceUrl, blob) : blob
  const url = URL.createObjectURL(forUrl)
  blobUrlCache.set(cacheKey, url)
  return url
}

export function peekBlobUrl(
  sourceUrl: string,
  relativePath: string = AUDIO_FILE_KEY,
): string | undefined {
  return blobUrlCache.get(fileRecordKey(sourceUrl, relativePath))
}

export async function putFiles(
  sourceUrl: string,
  entries: Array<{ relativePath: string; blob: Blob }>,
) {
  const db = await openDb()
  const tx = db.transaction(FILES_STORE, 'readwrite')
  const store = tx.objectStore(FILES_STORE)
  for (const entry of entries) {
    store.put(entry.blob, fileRecordKey(sourceUrl, entry.relativePath))
  }
  await idbTransactionDone(tx)
}

export async function putMeta(meta: TrackCacheMeta) {
  const db = await openDb()
  const tx = db.transaction(META_STORE, 'readwrite')
  tx.objectStore(META_STORE).put(meta)
  await idbTransactionDone(tx)
}

export async function putExtractedTrackMeta(meta: ExtractedTrackMeta) {
  const db = await openDb()
  const tx = db.transaction(TRACK_META_STORE, 'readwrite')
  tx.objectStore(TRACK_META_STORE).put(meta)
  await idbTransactionDone(tx)
}

export async function getExtractedTrackMeta(sourceUrl: string): Promise<ExtractedTrackMeta | null> {
  const db = await openDb()
  const meta = await idbRequest(
    db.transaction(TRACK_META_STORE, 'readonly').objectStore(TRACK_META_STORE).get(sourceUrl),
  )
  return (meta as ExtractedTrackMeta) ?? null
}

export async function listTrackMetas(): Promise<TrackCacheMeta[]> {
  const db = await openDb()
  const rows = await idbRequest(
    db.transaction(META_STORE, 'readonly').objectStore(META_STORE).getAll(),
  )
  return (rows as TrackCacheMeta[]) ?? []
}

/** Total size of cached audio and cover blobs in the files store. */
export async function getMusicCacheSizeBytes(): Promise<number> {
  const db = await openDb()
  const blobs = await idbRequest(
    db.transaction(FILES_STORE, 'readonly').objectStore(FILES_STORE).getAll(),
  )
  let total = 0
  for (const value of blobs ?? []) {
    if (value instanceof Blob) total += value.size
  }
  return total
}

export async function deleteTrackCacheRecords(sourceUrl: string): Promise<void> {
  revokeBlobUrlsForSource(sourceUrl)

  const db = await openDb()
  const tx = db.transaction([META_STORE, FILES_STORE, TRACK_META_STORE], 'readwrite')
  tx.objectStore(META_STORE).delete(sourceUrl)
  tx.objectStore(TRACK_META_STORE).delete(sourceUrl)

  const filesStore = tx.objectStore(FILES_STORE)
  const prefix = `${sourceUrl}${KEY_SEP}`
  const keys = await idbRequest(filesStore.getAllKeys())
  for (const key of keys) {
    if (typeof key === 'string' && key.startsWith(prefix)) {
      filesStore.delete(key)
    }
  }

  await idbTransactionDone(tx)
}

export async function clearAllCacheRecords(): Promise<void> {
  revokeAllBlobUrls()

  const db = await openDb()
  const tx = db.transaction([META_STORE, FILES_STORE, TRACK_META_STORE], 'readwrite')
  tx.objectStore(META_STORE).clear()
  tx.objectStore(FILES_STORE).clear()
  tx.objectStore(TRACK_META_STORE).clear()
  await idbTransactionDone(tx)
}

/** Close shared connection and clear in-memory blob URLs (tests). */
export async function resetCacheDbForTests(): Promise<void> {
  revokeAllBlobUrls()
  if (dbPromise) {
    try {
      const db = await dbPromise
      db.close()
    } catch {
      // ignore open failures during reset
    }
    dbPromise = null
  }
  // Delete the database so the next open starts clean for tests.
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error ?? new Error('IndexedDB delete failed'))
    req.onblocked = () => resolve()
  })
}

/** @deprecated Prefer resetCacheDbForTests */
export function resetBlobUrlCacheForTests() {
  revokeAllBlobUrls()
}
