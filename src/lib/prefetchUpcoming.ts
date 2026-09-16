import { ensureTrackCached } from './musicCache'
import { isPlayablePath } from './paths'
import { upcomingQueueIds, type RepeatMode } from './playerLogic'

export type PrefetchTrackRef = { id: string; path: string }

/** Prefetch upcoming queue tracks into IndexedDB (best-effort). */
export async function prefetchUpcoming(
  queue: string[],
  currentIndex: number,
  options: {
    count?: number
    repeatMode: RepeatMode
    shuffle: boolean
    random?: () => number
    resolveTrack: (id: string) => PrefetchTrackRef | undefined
    /** Called after a track is successfully cached (e.g. to re-enrich covers). */
    onTrackCached?: (id: string) => void
  },
): Promise<void> {
  const ids = upcomingQueueIds(queue, currentIndex, {
    count: options.count ?? 3,
    repeatMode: options.repeatMode,
    shuffle: options.shuffle,
    random: options.random,
  })

  await Promise.all(
    ids.map(async (id) => {
      const track = options.resolveTrack(id)
      if (!track || !isPlayablePath(track.path)) return
      try {
        await ensureTrackCached(track.path, track.id)
        options.onTrackCached?.(id)
      } catch {
        // best-effort prefetch
      }
    }),
  )
}
