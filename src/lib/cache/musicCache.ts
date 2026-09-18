import { ensureQuota } from './cacheEviction'
import {
  cancelEnsureInFlight,
  clearEnsureInFlight,
  ensureTrackCached,
  type CacheProgress,
} from './cacheIngest'
import {
  isTrackDownloading,
  subscribeCacheDownloads,
  trackDownloadPercent,
  type CacheDownloadTrackRef,
} from './cacheDownloadState'
import {
  clearAllCacheRecords,
  COVER_FILE_KEY,
  deleteTrackCacheRecords,
  getCachedBlobUrl,
  getCachedFile,
  getExtractedTrackMeta,
  getMusicCacheSizeBytes,
  isTrackCached,
  putExtractedTrackMeta,
  putFiles,
  type ExtractedTrackMeta,
  type TrackCacheMeta,
} from './cacheStore'

export type { CacheProgress, CacheDownloadTrackRef, ExtractedTrackMeta, TrackCacheMeta }
export {
  COVER_FILE_KEY,
  ensureTrackCached,
  getCachedBlobUrl,
  getCachedFile,
  getExtractedTrackMeta,
  getMusicCacheSizeBytes,
  isTrackCached,
  isTrackDownloading,
  putExtractedTrackMeta,
  subscribeCacheDownloads,
  trackDownloadPercent,
}

/** Quota-check then store a cover blob under the standard cover key. */
export async function putCoverFile(sourceUrl: string, blob: Blob): Promise<void> {
  await ensureQuota(blob.size)
  await putFiles(sourceUrl, [{ relativePath: COVER_FILE_KEY, blob }])
}

export async function clearTrackCache(sourceUrl: string): Promise<void> {
  cancelEnsureInFlight(sourceUrl)
  await deleteTrackCacheRecords(sourceUrl)
}

export async function clearAllMusicCaches(): Promise<void> {
  clearEnsureInFlight()
  await clearAllCacheRecords()
}
