<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import { appendAppLog } from '@/lib/appLogStore'
import { syncMediaSession } from '@/lib/playback/mediaSession'
import { prefetchUpcoming } from '@/lib/playback/prefetchUpcoming'
import { resolvePlayableUrl } from '@/lib/playback/resolvePlayableUrl'
import { createPlaybackTransport } from '@/lib/playback/playbackTransport'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const audioRef = ref<HTMLAudioElement | null>(null)
const catalog = useCatalogStore()
const player = usePlayerStore()

const PREFETCH_COUNT = 3

function resolveTrackForPrefetch(id: string) {
  const track = catalog.trackById.get(id)
  if (!track) return undefined
  return { id: track.id, path: track.path }
}

function schedulePrefetch() {
  void prefetchUpcoming(player.queue, player.currentIndex, {
    count: PREFETCH_COUNT,
    repeatMode: player.repeatMode,
    shuffle: player.shuffle,
    resolveTrack: resolveTrackForPrefetch,
    onTrackCached: (id) => catalog.scheduleEnrichTrack(id),
  })
}

const transport = createPlaybackTransport({
  getAudio: () => audioRef.value,
  getCurrentId: () => player.currentId,
  getQueueLength: () => player.queue.length,
  getSeekTo: () => player.seekTo,
  getPendingPlay: () => player.pendingPlay,
  getRepeatMode: () => player.repeatMode,
  clearSeekTo: () => {
    player.seekTo = null
  },
  pause: () => player.pause(),
  skip: () => player.skip(),
  onEnded: () => player.onEnded(),
  getTrack: (id) => {
    const track = catalog.trackById.get(id)
    if (!track) return undefined
    return { id: track.id, path: track.path }
  },
  setPlaying: (playing) => {
    player.playing = playing
  },
  clearPendingPlay: () => {
    player.pendingPlay = false
  },
  flushPersist: () => player.flushPersist(),
  setCurrentTime: (time) => {
    player.currentTime = time
  },
  setDuration: (duration) => {
    player.duration = duration
  },
  syncMediaSession: () => {
    const track = player.currentId ? catalog.trackById.get(player.currentId) : undefined
    syncMediaSession(track, player)
  },
  schedulePrefetch,
  resolvePlayableUrl,
  appendAppLog: (message) => {
    void appendAppLog(message)
  },
  scheduleEnrichTrack: (id) => catalog.scheduleEnrichTrack(id),
})

watch(
  () => player.loadToken,
  () => {
    void transport.loadCurrent()
  },
)

watch(
  () =>
    [
      player.currentId,
      player.playing,
      player.currentId ? catalog.trackById.get(player.currentId)?.displayTitle : null,
      player.currentId ? catalog.trackById.get(player.currentId)?.displayCover : null,
    ] as const,
  () => {
    transport.syncMediaSession()
  },
)

watch(
  () => player.queue,
  () => {
    if (player.currentId) transport.schedulePrefetch()
  },
  { deep: true },
)

watch(
  () => player.repeatMode,
  (mode) => {
    transport.onRepeatModeChange(mode)
  },
)

watch(
  () => player.pendingPlay,
  (want) => {
    transport.onPendingPlayChange(want)
  },
)

watch(
  () => player.seekTo,
  (value) => {
    transport.onSeekToChange(value)
  },
)

function onVisibilityFlush() {
  player.flushPersist()
}

onMounted(() => {
  transport.syncLoopFromRepeatMode()
  document.addEventListener('visibilitychange', onVisibilityFlush)
  window.addEventListener('pagehide', onVisibilityFlush)
  transport.syncMediaSession()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityFlush)
  window.removeEventListener('pagehide', onVisibilityFlush)
})
</script>

<template>
  <audio
    ref="audioRef"
    data-testid="global-audio"
    preload="metadata"
    @timeupdate="transport.onTimeUpdate"
    @play="transport.onPlay"
    @pause="transport.onPause"
    @ended="transport.onEnded"
  />
</template>
