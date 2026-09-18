import { useEffect, useRef } from 'react'

import { appendAppLog } from '@/lib/appLogStore'
import { syncMediaSession } from '@/lib/playback/mediaSession'
import { prefetchUpcoming } from '@/lib/playback/prefetchUpcoming'
import { createPlaybackTransport } from '@/lib/playback/playbackTransport'
import { resolvePlayableUrl } from '@/lib/playback/resolvePlayableUrl'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const PREFETCH_COUNT = 3

function createTransport(getAudio: () => HTMLAudioElement | null) {
  function resolveTrackForPrefetch(id: string) {
    const track = useCatalogStore.getState().snapshot.trackById.get(id)
    if (!track) return undefined
    return { id: track.id, path: track.path }
  }

  function schedulePrefetch() {
    const player = usePlayerStore.getState()
    void prefetchUpcoming(player.queue, player.currentIndex, {
      count: PREFETCH_COUNT,
      repeatMode: player.repeatMode,
      shuffle: player.shuffle,
      resolveTrack: resolveTrackForPrefetch,
      onTrackCached: (id) => useCatalogStore.getState().scheduleEnrichTrack(id),
    })
  }

  return createPlaybackTransport({
    getAudio,
    getCurrentId: () => usePlayerStore.getState().currentId,
    getQueueLength: () => usePlayerStore.getState().queue.length,
    getSeekTo: () => usePlayerStore.getState().seekTo,
    getPendingPlay: () => usePlayerStore.getState().pendingPlay,
    getRepeatMode: () => usePlayerStore.getState().repeatMode,
    clearSeekTo: () => {
      usePlayerStore.setState({ seekTo: null })
    },
    pause: () => usePlayerStore.getState().pause(),
    skip: () => usePlayerStore.getState().skip(),
    onEnded: () => usePlayerStore.getState().onEnded(),
    getTrack: (id) => {
      const track = useCatalogStore.getState().snapshot.trackById.get(id)
      if (!track) return undefined
      return { id: track.id, path: track.path }
    },
    setPlaying: (playing) => {
      usePlayerStore.setState({ playing })
    },
    clearPendingPlay: () => {
      usePlayerStore.setState({ pendingPlay: false })
    },
    flushPersist: () => usePlayerStore.getState().flushPersist(),
    setCurrentTime: (time) => {
      usePlayerStore.setState({ currentTime: time })
    },
    setDuration: (duration) => {
      usePlayerStore.setState({ duration })
    },
    syncMediaSession: () => {
      const player = usePlayerStore.getState()
      const track = player.currentId
        ? useCatalogStore.getState().snapshot.trackById.get(player.currentId)
        : undefined
      syncMediaSession(track, player)
    },
    schedulePrefetch,
    resolvePlayableUrl,
    appendAppLog: (message) => {
      void appendAppLog(message)
    },
    scheduleEnrichTrack: (id) => useCatalogStore.getState().scheduleEnrichTrack(id),
  })
}

export function AudioHost() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const transportRef = useRef<ReturnType<typeof createPlaybackTransport> | null>(null)
  if (transportRef.current == null) {
    transportRef.current = createTransport(() => audioRef.current)
  }
  const transport = transportRef.current

  const loadToken = usePlayerStore((s) => s.loadToken)
  const pendingPlay = usePlayerStore((s) => s.pendingPlay)
  const seekTo = usePlayerStore((s) => s.seekTo)
  const repeatMode = usePlayerStore((s) => s.repeatMode)
  const queue = usePlayerStore((s) => s.queue)
  const currentId = usePlayerStore((s) => s.currentId)
  const playing = usePlayerStore((s) => s.playing)
  const displayTitle = useCatalogStore((s) =>
    currentId ? (s.snapshot.trackById.get(currentId)?.displayTitle ?? null) : null,
  )
  const displayCover = useCatalogStore((s) =>
    currentId ? (s.snapshot.trackById.get(currentId)?.displayCover ?? null) : null,
  )

  useEffect(() => {
    void transport.loadCurrent()
  }, [loadToken, transport])

  useEffect(() => {
    transport.syncMediaSession()
  }, [currentId, playing, displayTitle, displayCover, transport])

  useEffect(() => {
    if (usePlayerStore.getState().currentId) transport.schedulePrefetch()
  }, [queue, transport])

  useEffect(() => {
    transport.onRepeatModeChange(repeatMode)
  }, [repeatMode, transport])

  useEffect(() => {
    transport.onPendingPlayChange(pendingPlay)
  }, [pendingPlay, transport])

  useEffect(() => {
    transport.onSeekToChange(seekTo)
  }, [seekTo, transport])

  useEffect(() => {
    function onVisibilityFlush() {
      usePlayerStore.getState().flushPersist()
    }

    transport.syncLoopFromRepeatMode()
    document.addEventListener('visibilitychange', onVisibilityFlush)
    window.addEventListener('pagehide', onVisibilityFlush)
    transport.syncMediaSession()

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityFlush)
      window.removeEventListener('pagehide', onVisibilityFlush)
    }
  }, [transport])

  return (
    <audio
      ref={audioRef}
      data-testid="global-audio"
      preload="metadata"
      hidden
      onTimeUpdate={transport.onTimeUpdate}
      onPlay={transport.onPlay}
      onPause={transport.onPause}
      onEnded={transport.onEnded}
    />
  )
}
