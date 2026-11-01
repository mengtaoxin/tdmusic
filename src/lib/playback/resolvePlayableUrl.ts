import {
  ensureTrackCached,
  getCachedBlobUrl,
  isMusicCacheStorageError,
  isMusicCacheUnavailable,
  markMusicCacheUnavailable,
} from '../cache/musicCache';
import { isPlayablePath } from '../paths';

/**
 * Resolve a playable URL for a track path.
 * Prefer a blob URL from IndexedDB; when the music cache cannot be used
 * (private browsing / IndexedDB failure), fall back to the source path so
 * `<audio>` streams directly without caching.
 */
export async function resolvePlayableUrl(path: string, id?: string): Promise<string> {
  if (!isPlayablePath(path)) return path;
  if (isMusicCacheUnavailable()) return path;

  try {
    await ensureTrackCached(path, id, { priority: 'high' });
    const blobUrl = await getCachedBlobUrl(path);
    if (!blobUrl) throw new Error(`No cached audio for ${path}`);
    return blobUrl;
  } catch (error) {
    if (isMusicCacheStorageError(error)) {
      markMusicCacheUnavailable();
      return path;
    }
    throw error;
  }
}
