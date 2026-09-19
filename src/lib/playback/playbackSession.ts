import { reportFailure } from '@/lib/reportFailure'

/** English failure log when a play-time download fails. */
export function formatDownloadFailureLog(
  track: { id: string; path: string },
  error: unknown,
): string {
  const detail = error instanceof Error ? error.message : String(error)
  return `Failed to download track "${track.id}" from ${track.path}: ${detail}`
}

export type PlaybackMediaError = {
  code: number
  message: string
}

const MEDIA_ERROR_CODE: Record<number, string> = {
  1: 'MEDIA_ERR_ABORTED',
  2: 'MEDIA_ERR_NETWORK',
  3: 'MEDIA_ERR_DECODE',
  4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
}

/** English failure log when the bound audio element cannot play the current track. */
export function formatMediaPlaybackFailureLog(
  track: { id: string; path: string },
  error: PlaybackMediaError | null,
): string {
  if (!error) {
    return `Failed to play track "${track.id}" from ${track.path}: unknown media error`
  }
  const name = MEDIA_ERROR_CODE[error.code] ?? `MEDIA_ERR_${error.code}`
  const extra = error.message.trim()
  const detail = extra ? `${name}: ${extra}` : name
  return `Failed to play track "${track.id}" from ${track.path}: ${detail}`
}

/** Minimal audio surface used by the playback session (DOM or test double). */
export type PlaybackAudioElement = {
  src: string
  currentTime: number
  duration: number
  loop: boolean
  ended: boolean
  error: PlaybackMediaError | null
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
  /** Called when a load for `id` starts, before resolving the playable URL. */
  onLoadStart?: (id: string) => void
}

/**
 * Orchestrates load → resolve URL → enrich/prefetch → failure skip for the
 * current track. The React host only owns the `<audio>` element and effects.
 */
export function createPlaybackSession(
  getAudio: () => PlaybackAudioElement | null,
  player: PlaybackSessionPlayer,
  hooks: PlaybackSessionHooks,
) {
  let consecutiveLoadFailures = 0
  let loadGeneration = 0
  let loadedMetadataHandler: (() => void) | null = null

  function detachLoadedMetadata(audio: PlaybackAudioElement) {
    if (!loadedMetadataHandler) return
    audio.removeEventListener('loadedmetadata', loadedMetadataHandler)
    loadedMetadataHandler = null
  }

  function isCurrentLoad(generation: number, id: string) {
    return generation === loadGeneration && player.getCurrentId() === id
  }

  async function loadCurrent(): Promise<void> {
    const audio = getAudio()
    const id = player.getCurrentId()
    if (!audio || !id) return
    const track = player.getTrack(id)
    if (!track) return

    const generation = ++loadGeneration
    hooks.onLoadStart?.(id)
    detachLoadedMetadata(audio)
    // Stop the previously bound file immediately. UI already shows `id`; waiting
    // on cache/download would otherwise keep playing the old song (slow on old devices).
    audio.pause()

    try {
      const url = await hooks.resolvePlayableUrl(track.path, track.id)
      if (!isCurrentLoad(generation, id)) return
      consecutiveLoadFailures = 0
      hooks.onTrackResolved?.(id)
      audio.src = url
      audio.load()
      hooks.scheduleEnrichTrack(id)
      const seek = player.getSeekTo()
      const onLoaded = () => {
        if (!isCurrentLoad(generation, id)) return
        if (seek != null && Number.isFinite(seek)) {
          audio.currentTime = seek
        }
        player.clearSeekTo()
        if (player.getPendingPlay()) {
          void audio.play().catch((playError: unknown) => {
            reportFailure(playError)
            player.pause()
          })
        }
        hooks.schedulePrefetch()
        audio.removeEventListener('loadedmetadata', onLoaded)
        if (loadedMetadataHandler === onLoaded) loadedMetadataHandler = null
      }
      loadedMetadataHandler = onLoaded
      audio.addEventListener('loadedmetadata', onLoaded)
    } catch (error) {
      if (!isCurrentLoad(generation, id)) return
      const message = formatDownloadFailureLog(track, error)
      reportFailure(message)
      hooks.appendAppLog(message)
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
