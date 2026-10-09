import { ensureQuota } from './cacheEviction';
import {
  cancelEnsureInFlight,
  clearEnsureInFlight,
  ensureTrackCached,
  type CacheProgress,
} from './cacheIngest';
import {
  isTrackDownloading,
  subscribeCacheDownloads,
  trackDownloadPercent,
  type CacheDownloadTrackRef,
} from './cacheDownloadState';
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
} from './cacheStore';
import {
  clearManualDownloads,
  enqueueManualDownloads,
  isTrackQueuedForDownload,
  resumeManualDownloads,
  setManualDownloadHooks,
  subscribeManualDownloads,
  type ManualDownloadHooks,
  type ManualDownloadTrackRef,
} from './downloadQueue';

export type {
  CacheProgress,
  CacheDownloadTrackRef,
  ExtractedTrackMeta,
  ManualDownloadHooks,
  ManualDownloadTrackRef,
  TrackCacheMeta,
};
export {
  COVER_FILE_KEY,
  enqueueManualDownloads,
  ensureTrackCached,
  getCachedBlobUrl,
  getCachedFile,
  getExtractedTrackMeta,
  getMusicCacheSizeBytes,
  isTrackCached,
  isTrackDownloading,
  isTrackQueuedForDownload,
  putExtractedTrackMeta,
  resumeManualDownloads,
  setManualDownloadHooks,
  subscribeCacheDownloads,
  subscribeManualDownloads,
  trackDownloadPercent,
};

/** Quota-check then store a cover blob under the standard cover key. */
export async function putCoverFile(sourceUrl: string, blob: Blob): Promise<void> {
  await ensureQuota(blob.size);
  await putFiles(sourceUrl, [{ relativePath: COVER_FILE_KEY, blob }]);
}

export async function clearTrackCache(sourceUrl: string): Promise<void> {
  cancelEnsureInFlight(sourceUrl);
  await deleteTrackCacheRecords(sourceUrl);
}

export async function clearAllMusicCaches(): Promise<void> {
  clearEnsureInFlight();
  await Promise.all([clearManualDownloads(), clearAllCacheRecords()]);
}
