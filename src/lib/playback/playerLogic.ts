export type RepeatMode = 'off' | 'all' | 'one'

/** Manual next/prev/skip leave the current track even when repeat is one. */
export function repeatModeForManualAdvance(repeatMode: RepeatMode): RepeatMode {
  return repeatMode === 'one' ? 'off' : repeatMode
}

export function nextIndex(
  currentIndex: number,
  queueLength: number,
  options: { repeatMode: RepeatMode; shuffle?: boolean },
): number | null {
  if (queueLength <= 0) return null
  if (options.repeatMode === 'one') return currentIndex

  // Shuffle reorders the queue up front; next always walks that order linearly.
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

/** Fisher–Yates shuffle of a copy. */
export function shuffleIds(ids: string[], random: () => number = Math.random): string[] {
  const a = [...ids]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

/** Keep prefix through currentIndex; shuffle only the upcoming tail (Spotify-style). */
export function shuffleUpcoming(
  queue: string[],
  currentIndex: number,
  random: () => number = Math.random,
): string[] {
  if (currentIndex < 0 || currentIndex >= queue.length) return [...queue]
  const head = queue.slice(0, currentIndex + 1)
  const rest = queue.slice(currentIndex + 1)
  return head.concat(shuffleIds(rest, random))
}

/** Fresh shuffle session: current track first, every other id shuffled (no original-order prefix). */
export function shuffleFromCurrent(
  queue: string[],
  currentIndex: number,
  random: () => number = Math.random,
): string[] {
  if (currentIndex < 0 || currentIndex >= queue.length) return shuffleIds(queue, random)
  const current = queue[currentIndex]!
  const rest = queue.slice(0, currentIndex).concat(queue.slice(currentIndex + 1))
  return [current, ...shuffleIds(rest, random)]
}

/** Insert id immediately after currentIndex (append if index is last/invalid). */
export function insertAfterCurrent(queue: string[], currentIndex: number, id: string): string[] {
  if (currentIndex < 0 || currentIndex >= queue.length) {
    return queue.concat(id)
  }
  const next = [...queue]
  next.splice(currentIndex + 1, 0, id)
  return next
}

/** Append id at the end of the queue. */
export function appendToQueue(queue: string[], id: string): string[] {
  return queue.concat(id)
}

/** Remove one index; report whether that index was the current track. */
export function removeAtIndex(
  queue: string[],
  index: number,
  currentIndex: number,
): { queue: string[]; removedCurrent: boolean } {
  if (index < 0 || index >= queue.length) {
    return { queue: [...queue], removedCurrent: false }
  }
  const next = queue.slice(0, index).concat(queue.slice(index + 1))
  return { queue: next, removedCurrent: index === currentIndex }
}

/** Keep 0..currentIndex inclusive; drop the upcoming tail. */
export function clearUpcoming(queue: string[], currentIndex: number): string[] {
  if (currentIndex < 0) return []
  if (currentIndex >= queue.length) return [...queue]
  return queue.slice(0, currentIndex + 1)
}

/** How many times `id` appears in `queue[0..index)` (exclusive of `index`). */
export function occurrenceCountBefore(queue: string[], index: number, id: string): number {
  let n = 0
  const end = Math.min(Math.max(index, 0), queue.length)
  for (let i = 0; i < end; i += 1) {
    if (queue[i] === id) n += 1
  }
  return n
}

/** Index of the `occurrence`-th match of `id` (0-based), or `-1`. */
export function indexOfOccurrence(queue: string[], id: string, occurrence: number): number {
  if (occurrence < 0) return -1
  let seen = 0
  for (let i = 0; i < queue.length; i += 1) {
    if (queue[i] !== id) continue
    if (seen === occurrence) return i
    seen += 1
  }
  return -1
}

/**
 * Map `fromIndex` in `fromQueue` to the same id-occurrence in `toQueue`.
 * Used when queue and originalQueue share ids but may differ in order (shuffle).
 */
export function mapOccurrenceIndex(
  fromQueue: string[],
  fromIndex: number,
  toQueue: string[],
): number {
  if (fromIndex < 0 || fromIndex >= fromQueue.length) return -1
  const id = fromQueue[fromIndex]!
  const occurrence = occurrenceCountBefore(fromQueue, fromIndex, id)
  return indexOfOccurrence(toQueue, id, occurrence)
}

/** Upcoming queue ids to prefetch (does not include current). */
export function upcomingQueueIds(
  queue: string[],
  currentIndex: number,
  options: {
    count: number
    repeatMode: RepeatMode
    /** @deprecated Ignored — shuffle is applied to the queue order itself. */
    shuffle?: boolean
  },
): string[] {
  const { count, repeatMode } = options
  if (count <= 0 || queue.length === 0) return []
  if (currentIndex < 0 || currentIndex >= queue.length) return []
  if (repeatMode === 'one') return []

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

/** Play sourceIds[startIndex] immediately; fill the full list from 0 (prefix sync, rest chunked). */
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

  // Deliver prefix through the play head synchronously so Previous works immediately.
  const prefix = sourceIds.slice(0, startIndex + 1)
  if (prefix.length) options.onChunk(prefix)

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
  /** Unshuffled order for restoring when shuffle turns off. */
  originalQueue: string[]
  currentId: string | null
  /**
   * Index of the playing occurrence in `queue`. Required after hydrate.
   * Missing/legacy payloads use `-1` so hydrate can fall back to `currentId`.
   */
  currentIndex: number
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
    const queue = data.queue.filter((id): id is string => typeof id === 'string')
    const originalQueue = Array.isArray(data.originalQueue)
      ? data.originalQueue.filter((id): id is string => typeof id === 'string')
      : [...queue]
    return {
      queue,
      originalQueue,
      currentId: typeof data.currentId === 'string' ? data.currentId : null,
      currentIndex: typeof data.currentIndex === 'number' ? data.currentIndex : -1,
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

/** Drop queue ids not in knownIds; fix currentId/index/time if invalid. */
export function hydratePlayerState(
  persisted: PersistedPlayerState,
  knownIds: Set<string>,
): PersistedPlayerState | null {
  const queue: string[] = []
  let currentIndex = -1
  const wantIndex = persisted.currentIndex

  for (let i = 0; i < persisted.queue.length; i += 1) {
    const id = persisted.queue[i]!
    if (!knownIds.has(id)) continue
    if (i === wantIndex) currentIndex = queue.length
    queue.push(id)
  }
  if (queue.length === 0) return null

  const originalQueue = persisted.originalQueue.filter((id) => knownIds.has(id))
  const restoredOriginal = originalQueue.length > 0 ? originalQueue : [...queue]

  let currentId = persisted.currentId
  if (currentIndex >= 0) {
    currentId = queue[currentIndex]!
  } else if (currentId && queue.includes(currentId)) {
    // Legacy payloads without currentIndex: first matching id.
    currentIndex = queue.indexOf(currentId)
  } else {
    currentIndex = 0
    currentId = queue[0]!
  }

  return {
    queue,
    originalQueue: restoredOriginal,
    currentId,
    currentIndex,
    currentTime: Math.max(0, persisted.currentTime),
    repeatMode: persisted.repeatMode,
    shuffle: persisted.shuffle,
  }
}
