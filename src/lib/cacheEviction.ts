import { deleteTrackCacheRecords, listTrackMetas } from './cacheStore'

const SOFT_QUOTA_RATIO = 0.85

export type StorageEstimate = {
  usage?: number
  quota?: number
}

export type EstimateFn = () => Promise<StorageEstimate>

async function defaultEstimate(): Promise<StorageEstimate> {
  const storage = navigator.storage
  if (!storage?.estimate) return {}
  return storage.estimate()
}

/**
 * Evict oldest ready tracks until usage + minBytes fits under soft quota.
 * No-ops when quota is unknown. Re-estimates after each eviction.
 */
export async function ensureQuota(
  minBytes: number,
  estimate: EstimateFn = defaultEstimate,
): Promise<void> {
  const initial = await estimate()
  if (
    initial.usage == null ||
    initial.quota == null ||
    !Number.isFinite(initial.usage) ||
    !Number.isFinite(initial.quota)
  ) {
    return
  }

  let usage = initial.usage
  const quota = initial.quota
  const limit = quota * SOFT_QUOTA_RATIO
  if (usage + Math.max(0, minBytes) <= limit) return

  const ready = (await listTrackMetas())
    .filter((m) => m.status === 'ready')
    .sort((a, b) => a.downloadedAt - b.downloadedAt)

  for (const meta of ready) {
    if (usage + Math.max(0, minBytes) <= limit) break
    await deleteTrackCacheRecords(meta.sourceUrl)
    const next = await estimate()
    if (next.usage == null || !Number.isFinite(next.usage)) {
      // Cannot observe reclaim; stop after one eviction to avoid wiping cache.
      break
    }
    usage = next.usage
  }
}
