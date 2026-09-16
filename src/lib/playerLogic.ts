export type RepeatMode = 'off' | 'all' | 'one'

export function nextIndex(
  currentIndex: number,
  queueLength: number,
  options: { repeatMode: RepeatMode; shuffle: boolean; random?: () => number },
): number | null {
  if (queueLength <= 0) return null
  if (options.repeatMode === 'one') return currentIndex

  if (options.shuffle) {
    if (queueLength === 1) {
      return options.repeatMode === 'all' ? 0 : null
    }
    const rnd = options.random ?? Math.random
    let next = currentIndex
    while (next === currentIndex) {
      next = Math.floor(rnd() * queueLength)
    }
    return next
  }

  const next = currentIndex + 1
  if (next < queueLength) return next
  return options.repeatMode === 'all' ? 0 : null
}

export function prevIndex(
  currentIndex: number,
  queueLength: number,
  options: { repeatMode: RepeatMode },
): number | null {
  if (queueLength <= 0) return null
  if (options.repeatMode === 'one') return currentIndex
  const prev = currentIndex - 1
  if (prev >= 0) return prev
  return options.repeatMode === 'all' ? queueLength - 1 : null
}

/** Upcoming queue ids to prefetch (does not include current). */
export function upcomingQueueIds(
  queue: string[],
  currentIndex: number,
  options: {
    count: number
    repeatMode: RepeatMode
    shuffle: boolean
    random?: () => number
  },
): string[] {
  const { count, repeatMode, shuffle } = options
  if (count <= 0 || queue.length === 0) return []
  if (currentIndex < 0 || currentIndex >= queue.length) return []
  if (repeatMode === 'one') return []

  if (shuffle) {
    const rnd = options.random ?? Math.random
    const picked = new Set<number>([currentIndex])
    const result: string[] = []
    const maxAttempts = queue.length * 8
    let attempts = 0
    while (result.length < count && picked.size < queue.length && attempts < maxAttempts) {
      attempts += 1
      const next = Math.floor(rnd() * queue.length)
      if (picked.has(next)) continue
      picked.add(next)
      const id = queue[next]
      if (id != null) result.push(id)
    }
    return result
  }

  const result: string[] = []
  let i = currentIndex + 1
  while (result.length < count) {
    if (i >= queue.length) {
      if (repeatMode !== 'all') break
      i = 0
    }
    if (i === currentIndex) break
    const id = queue[i]
    if (id != null) result.push(id)
    i += 1
  }
  return result
}

export type QueueChunkCallback = (chunk: string[]) => void

/** Synchronously take first id at startIndex; async append the rest in chunks. */
export function buildQueueFrom(
  sourceIds: string[],
  startIndex: number,
  options: {
    chunkSize?: number
    schedule?: (cb: () => void) => void
    onHead: (headId: string) => void
    onChunk: QueueChunkCallback
    onDone?: () => void
  },
): { cancel: () => void } {
  const chunkSize = options.chunkSize ?? 50
  const schedule = options.schedule ?? ((cb) => setTimeout(cb, 0))
  let cancelled = false

  if (startIndex < 0 || startIndex >= sourceIds.length) {
    options.onDone?.()
    return { cancel: () => {} }
  }

  const head = sourceIds[startIndex]!
  options.onHead(head)

  let offset = startIndex + 1

  const pump = () => {
    if (cancelled) return
    if (offset >= sourceIds.length) {
      options.onDone?.()
      return
    }
    const chunk = sourceIds.slice(offset, offset + chunkSize)
    offset += chunk.length
    options.onChunk(chunk)
    schedule(pump)
  }

  schedule(pump)

  return {
    cancel: () => {
      cancelled = true
    },
  }
}

export type PersistedPlayerState = {
  queue: string[]
  currentId: string | null
  currentTime: number
  repeatMode: RepeatMode
  shuffle: boolean
}

export const PLAYER_STORAGE_KEY = 'tdmusic.player'
export const PLAYER_STATE_VERSION = 1

export function serializePlayerState(state: PersistedPlayerState): string {
  return JSON.stringify({ v: PLAYER_STATE_VERSION, ...state })
}

export function parsePlayerState(raw: string | null): PersistedPlayerState | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<PersistedPlayerState> & { v?: unknown }
    if (data.v != null && data.v !== PLAYER_STATE_VERSION) return null
    if (!Array.isArray(data.queue)) return null
    return {
      queue: data.queue.filter((id): id is string => typeof id === 'string'),
      currentId: typeof data.currentId === 'string' ? data.currentId : null,
      currentTime: typeof data.currentTime === 'number' ? data.currentTime : 0,
      repeatMode:
        data.repeatMode === 'off' || data.repeatMode === 'all' || data.repeatMode === 'one'
          ? data.repeatMode
          : 'off',
      shuffle: Boolean(data.shuffle),
    }
  } catch {
    return null
  }
}

/** Drop queue ids not in knownIds; fix currentId/time if invalid. */
export function hydratePlayerState(
  persisted: PersistedPlayerState,
  knownIds: Set<string>,
): PersistedPlayerState | null {
  const queue = persisted.queue.filter((id) => knownIds.has(id))
  if (queue.length === 0) return null

  let currentId = persisted.currentId
  if (!currentId || !queue.includes(currentId)) {
    currentId = queue[0]!
  }

  return {
    queue,
    currentId,
    currentTime: Math.max(0, persisted.currentTime),
    repeatMode: persisted.repeatMode,
    shuffle: persisted.shuffle,
  }
}
