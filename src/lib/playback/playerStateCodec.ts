import type { RepeatMode } from './playerLogic'

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
