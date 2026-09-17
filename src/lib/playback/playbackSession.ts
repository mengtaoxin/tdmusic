/** English failure log when a play-time download fails. */
export function formatDownloadFailureLog(
  track: { id: string; path: string },
  error: unknown,
): string {
  const detail = error instanceof Error ? error.message : String(error)
  return `Failed to download track "${track.id}" from ${track.path}: ${detail}`
}

/** Minimal audio surface used by the playback session (DOM or test double). */
export type PlaybackAudioElement = {
  src: string
  currentTime: number
  loop: boolean
  ended: boolean
  load: () => void
  play: () => Promise<void>
  pause: () => void
  addEventListener: HTMLAudioElement['addEventListener']
  removeEventListener: HTMLAudioElement['removeEventListener']
}

export type PlaybackSessionPlayer = {
  getCurrentId: () => string | null
  getQueueLength: () => number
  getSeekTo: () => number | null
  getPendingPlay: () => boolean
  clearSeekTo: () => void
  pause: () => void
  skip: () => void
  getTrack: (id: string) => { id: string; path: string } | undefined
}

export type PlaybackSessionHooks = {
  resolvePlayableUrl: (path: string, id: string) => Promise<string>
  appendAppLog: (message: string) => void
  scheduleEnrichTrack: (id: string) => void
  schedulePrefetch: () => void
  /** Called when a playable URL is ready for `id`, before assigning audio.src. */
  onTrackResolved?: (id: string) => void
}

/**
 * Orchestrates load → resolve URL → enrich/prefetch → failure skip for the
 * current track. The Vue host only owns the `<audio>` element and watchers.
 */
export function createPlaybackSession(
  getAudio: () => PlaybackAudioElement | null,
  player: PlaybackSessionPlayer,
  hooks: PlaybackSessionHooks,
) {
  let consecutiveLoadFailures = 0

  async function loadCurrent(): Promise<void> {
    const audio = getAudio()
    const id = player.getCurrentId()
    if (!audio || !id) return
    const track = player.getTrack(id)
    if (!track) return

    try {
      const url = await hooks.resolvePlayableUrl(track.path, track.id)
      if (player.getCurrentId() !== id) return
      consecutiveLoadFailures = 0
      hooks.onTrackResolved?.(id)
      audio.src = url
      audio.load()
      hooks.scheduleEnrichTrack(id)
      hooks.schedulePrefetch()
      const seek = player.getSeekTo()
      const onLoaded = () => {
        if (seek != null && Number.isFinite(seek)) {
          audio.currentTime = seek
        }
        player.clearSeekTo()
        if (player.getPendingPlay()) {
          void audio.play().catch(() => {
            player.pause()
          })
        }
        audio.removeEventListener('loadedmetadata', onLoaded)
      }
      audio.addEventListener('loadedmetadata', onLoaded)
    } catch (error) {
      if (player.getCurrentId() !== id) return
      hooks.appendAppLog(formatDownloadFailureLog(track, error))
      consecutiveLoadFailures += 1
      const limit = Math.max(player.getQueueLength(), 1)
      if (consecutiveLoadFailures >= limit) {
        consecutiveLoadFailures = 0
        player.pause()
        return
      }
      player.skip()
    }
  }

  return { loadCurrent }
}
