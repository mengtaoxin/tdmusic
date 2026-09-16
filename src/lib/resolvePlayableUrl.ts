import { ensureTrackCached, getCachedBlobUrl } from './musicCache'
import { isRemotePath } from './paths'

/** Resolve a playable URL for a track path (blob URL for remote cache, path otherwise). */
export async function resolvePlayableUrl(path: string, id?: string): Promise<string> {
  if (!isRemotePath(path)) return path
  await ensureTrackCached(path, id)
  const blobUrl = await getCachedBlobUrl(path)
  if (!blobUrl) throw new Error(`No cached audio for ${path}`)
  return blobUrl
}
