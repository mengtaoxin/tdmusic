import { ensureTrackCached, getCachedBlobUrl } from '../cache/musicCache'
import { isPlayablePath } from '../paths'

/** Resolve a playable URL for a track path (blob URL from IndexedDB cache). */
export async function resolvePlayableUrl(path: string, id?: string): Promise<string> {
  if (!isPlayablePath(path)) return path
  await ensureTrackCached(path, id, { priority: 'high' })
  const blobUrl = await getCachedBlobUrl(path)
  if (!blobUrl) throw new Error(`No cached audio for ${path}`)
  return blobUrl
}
