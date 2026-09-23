import { TdLog } from 'tdkit'

import { prefetchUpcoming } from '@/lib/playback/prefetchUpcoming'
import { createPlaybackRuntime } from '@/lib/playback/createPlaybackRuntime'
import { syncMediaSession } from '@/lib/playback/mediaSession'
import { resolvePlayableUrl } from '@/lib/playback/resolvePlayableUrl'
import { createVolumeGainController } from '@/lib/playback/volumeGain'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const PREFETCH_COUNT = 3

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

/** Bind Zustand / cache / log ports to a playback transport for one audio element. */
export function createAppPlaybackTransport(getAudio: () => HTMLAudioElement | null) {
  const volumeGain = createVolumeGainController({ getAudio })
  return createPlaybackRuntime(getAudio, {
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
      return { id: track.id, path: track.path, volumeRatio: track.volumeRatio ?? 100 }
    },
    setVolumeRatio: (percent) => volumeGain.setRatio(percent),
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
      void TdLog.error(message)
    },
    scheduleEnrichTrack: (id) => useCatalogStore.getState().scheduleEnrichTrack(id),
  })
}
