import {
  createPlaybackSession,
  type PlaybackAudioElement,
  type PlaybackSessionHooks,
  type PlaybackSessionPlayer,
} from '@/lib/playback/playbackSession'
import type { RepeatMode } from '@/lib/playback/playerLogic'

export type PlaybackTransportDeps = {
  getAudio: () => PlaybackAudioElement | null
  getCurrentId: () => string | null
  getQueueLength: () => number
  getSeekTo: () => number | null
  getPendingPlay: () => boolean
  getRepeatMode: () => RepeatMode
  clearSeekTo: () => void
  pause: () => void
  skip: () => void
  onEnded: () => void
  getTrack: (id: string) => { id: string; path: string } | undefined
  setPlaying: (playing: boolean) => void
  clearPendingPlay: () => void
  flushPersist: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  syncMediaSession: () => void
  schedulePrefetch: () => void
  resolvePlayableUrl: (path: string, id: string) => Promise<string>
  appendAppLog: (message: string) => void
  scheduleEnrichTrack: (id: string) => void
  /** Override session factory (tests). Defaults to createPlaybackSession. */
  createSession?: (
    getAudio: () => PlaybackAudioElement | null,
    player: PlaybackSessionPlayer,
    hooks: PlaybackSessionHooks,
  ) => { loadCurrent: () => Promise<void> }
}

const MEDIA_SESSION_SYNC_MS = 1000

/**
 * Transport layer: binds queue/player signals to a single `<audio>` element.
 * Owns load session, binding generation, prefetch hooks, and media events.
 * Queue/shuffle/persist stay in the player store.
 */
export function createPlaybackTransport(deps: PlaybackTransportDeps) {
  /** Id whose playable URL is currently assigned to the audio element. */
  let boundTrackId: string | null = null
  let lastTimePersist = 0
  let lastMediaSessionSync = 0

  const playerAdapter: PlaybackSessionPlayer = {
    getCurrentId: deps.getCurrentId,
    getQueueLength: deps.getQueueLength,
    getSeekTo: deps.getSeekTo,
    getPendingPlay: deps.getPendingPlay,
    clearSeekTo: deps.clearSeekTo,
    pause: deps.pause,
    skip: deps.skip,
    getTrack: deps.getTrack,
  }

  const createSession = deps.createSession ?? createPlaybackSession
  const session = createSession(deps.getAudio, playerAdapter, {
    resolvePlayableUrl: deps.resolvePlayableUrl,
    appendAppLog: deps.appendAppLog,
    scheduleEnrichTrack: deps.scheduleEnrichTrack,
    schedulePrefetch: deps.schedulePrefetch,
    onLoadStart: () => {
      boundTrackId = null
    },
    onTrackResolved: (id) => {
      boundTrackId = id
    },
  })

  function isBoundToCurrent() {
    return boundTrackId != null && boundTrackId === deps.getCurrentId()
  }

  function onLoadStart(_id: string) {
    boundTrackId = null
  }

  function onPendingPlayChange(want: boolean) {
    const audio = deps.getAudio()
    if (!audio) return
    if (want) {
      // Resume only when the element already holds the current track. Otherwise
      // loadCurrent owns autoplay after resolving the new src.
      if (!isBoundToCurrent()) return
      void audio.play().catch(() => deps.pause())
    } else {
      audio.pause()
    }
  }

  function onSeekToChange(value: number | null) {
    const audio = deps.getAudio()
    if (audio && value != null && Number.isFinite(value) && audio.src) {
      audio.currentTime = value
      deps.clearSeekTo()
    }
  }

  function onRepeatModeChange(mode: RepeatMode) {
    const audio = deps.getAudio()
    if (audio) audio.loop = mode === 'one'
  }

  function onTimeUpdate() {
    const audio = deps.getAudio()
    if (!audio || !isBoundToCurrent()) return
    deps.setCurrentTime(audio.currentTime)
    deps.setDuration(audio.duration || 0)
    const now = Date.now()
    if (now - lastMediaSessionSync >= MEDIA_SESSION_SYNC_MS) {
      lastMediaSessionSync = now
      deps.syncMediaSession()
    }
    if (now - lastTimePersist > 2000) {
      lastTimePersist = now
      deps.flushPersist()
    }
  }

  function onPlay() {
    deps.setPlaying(true)
  }

  function onPause() {
    const audio = deps.getAudio()
    // Natural end fires pause before ended; let onEnded own that transition.
    if (audio?.ended) return
    // Track switch pauses the previous src before the new URL resolves.
    if (!isBoundToCurrent()) return
    // External interrupt (other app / OS) pauses without store.pause().
    deps.clearPendingPlay()
    deps.setPlaying(false)
    deps.flushPersist()
  }

  function onEnded() {
    if (!isBoundToCurrent()) return
    deps.onEnded()
    if (deps.getRepeatMode() === 'one') {
      const audio = deps.getAudio()
      if (!audio) return
      const seek = deps.getSeekTo()
      audio.currentTime = seek != null && Number.isFinite(seek) ? seek : 0
      deps.clearSeekTo()
      void audio.play().catch(() => deps.pause())
    }
  }

  function syncLoopFromRepeatMode() {
    const audio = deps.getAudio()
    if (audio) audio.loop = deps.getRepeatMode() === 'one'
  }

  return {
    loadCurrent: () => session.loadCurrent(),
    isBoundToCurrent,
    onLoadStart,
    onPendingPlayChange,
    onSeekToChange,
    onRepeatModeChange,
    onTimeUpdate,
    onPlay,
    onPause,
    onEnded,
    syncLoopFromRepeatMode,
    syncMediaSession: () => deps.syncMediaSession(),
    schedulePrefetch: () => deps.schedulePrefetch(),
  }
}
