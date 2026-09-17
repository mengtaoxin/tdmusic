import {
  isTrackCached,
  putFiles,
  putMeta,
  deleteTrackCacheRecords,
  AUDIO_FILE_KEY,
  type TrackCacheMeta,
} from './cacheStore'
import { ensureQuota } from './cacheEviction'
import { reportCacheDownload, clearCacheDownloadState } from './cacheDownloadState'
import { isPlayablePath } from '../paths'

export type CacheProgress = {
  phase: 'download' | 'done'
  loaded: number
  total: number | null
}

const ensureInFlight = new Map<string, Promise<void>>()

function emitProgress(
  sourceUrl: string,
  id: string | undefined,
  progress: CacheProgress,
  onProgress?: (progress: CacheProgress) => void,
) {
  reportCacheDownload(sourceUrl, id, progress)
  onProgress?.(progress)
}

async function fetchAsBlob(
  sourceUrl: string,
  id?: string,
  onProgress?: (progress: CacheProgress) => void,
): Promise<Blob> {
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`downloadFailed:${response.status}`)
  }

  const totalHeader = response.headers.get('Content-Length')
  const total = totalHeader ? Number.parseInt(totalHeader, 10) : null
  const body = response.body
  if (!body || total == null || !Number.isFinite(total)) {
    const blob = await response.blob()
    emitProgress(
      sourceUrl,
      id,
      { phase: 'download', loaded: blob.size, total: blob.size },
      onProgress,
    )
    return blob
  }

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      loaded += value.byteLength
      emitProgress(sourceUrl, id, { phase: 'download', loaded, total }, onProgress)
    }
  }

  const merged = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new Blob([merged], {
    type: response.headers.get('Content-Type') ?? 'audio/mpeg',
  })
}

async function downloadAndStore(
  sourceUrl: string,
  id?: string,
  onProgress?: (progress: CacheProgress) => void,
): Promise<void> {
  const pendingMeta: TrackCacheMeta = {
    sourceUrl,
    id,
    status: 'pending',
    downloadedAt: Date.now(),
  }
  emitProgress(sourceUrl, id, { phase: 'download', loaded: 0, total: null }, onProgress)
  await putMeta(pendingMeta)

  try {
    const blob = await fetchAsBlob(sourceUrl, id, onProgress)
    await ensureQuota(blob.size)
    await putFiles(sourceUrl, [{ relativePath: AUDIO_FILE_KEY, blob }])
    const meta: TrackCacheMeta = {
      sourceUrl,
      id,
      status: 'ready',
      downloadedAt: Date.now(),
    }
    await putMeta(meta)
    emitProgress(sourceUrl, id, { phase: 'done', loaded: blob.size, total: blob.size }, onProgress)
  } catch (error) {
    await deleteTrackCacheRecords(sourceUrl)
    emitProgress(sourceUrl, id, { phase: 'done', loaded: 0, total: 0 }, onProgress)
    throw error
  }
}

/** Cache playable audio (http(s) or site-absolute). No-op for other paths. */
export async function ensureTrackCached(
  sourceUrl: string,
  id?: string,
  onProgress?: (progress: CacheProgress) => void,
): Promise<void> {
  if (!isPlayablePath(sourceUrl)) return

  if (await isTrackCached(sourceUrl)) {
    onProgress?.({ phase: 'done', loaded: 0, total: 0 })
    return
  }

  const existing = ensureInFlight.get(sourceUrl)
  if (existing) {
    await existing
    return
  }

  const job = downloadAndStore(sourceUrl, id, onProgress).finally(() => {
    ensureInFlight.delete(sourceUrl)
  })
  ensureInFlight.set(sourceUrl, job)
  await job
}

export function cancelEnsureInFlight(sourceUrl: string) {
  ensureInFlight.delete(sourceUrl)
  reportCacheDownload(sourceUrl, undefined, { phase: 'done', loaded: 0, total: 0 })
}

export function clearEnsureInFlight() {
  ensureInFlight.clear()
  clearCacheDownloadState()
}
