<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import { appendAppLog } from '@/lib/appLogStore'
import { syncMediaSession } from '@/lib/playback/mediaSession'
import { createPlaybackSession } from '@/lib/playback/playbackSession'
import { prefetchUpcoming } from '@/lib/playback/prefetchUpcoming'
import { resolvePlayableUrl } from '@/lib/playback/resolvePlayableUrl'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const audioRef = ref<HTMLAudioElement | null>(null)
const catalog = useCatalogStore()
const player = usePlayerStore()

let lastTimePersist = 0
let lastMediaSessionSync = 0
const PREFETCH_COUNT = 3
const MEDIA_SESSION_SYNC_MS = 1000

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

const session = createPlaybackSession(
  () => audioRef.value,
  {
    getCurrentId: () => player.currentId,
    getQueueLength: () => player.queue.length,
    getSeekTo: () => player.seekTo,
    getPendingPlay: () => player.pendingPlay,
    clearSeekTo: () => {
      player.seekTo = null
    },
    pause: () => player.pause(),
    skip: () => player.skip(),
    getTrack: (id) => {
      const track = catalog.trackById.get(id)
      if (!track) return undefined
      return { id: track.id, path: track.path }
    },
  },
  {
    resolvePlayableUrl,
    appendAppLog: (message) => {
      void appendAppLog(message)
    },
    scheduleEnrichTrack: (id) => catalog.scheduleEnrichTrack(id),
    schedulePrefetch,
    onLoadStart: () => {
      boundTrackId = null
    },
    onTrackResolved: (id) => {
      boundTrackId = id
    },
  },
)

/** Id whose playable URL is currently assigned to the audio element. */
let boundTrackId: string | null = null

function isBoundToCurrent() {
  return boundTrackId != null && boundTrackId === player.currentId
}

function updateMediaSession() {
  const track = player.currentId ? catalog.trackById.get(player.currentId) : undefined
  syncMediaSession(track, player)
}

watch(
  () => player.loadToken,
  () => {
    void session.loadCurrent()
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
    updateMediaSession()
  },
)

watch(
  () => player.queue,
  () => {
    if (player.currentId) schedulePrefetch()
  },
  { deep: true },
)

watch(
  () => player.repeatMode,
  (mode) => {
    const audio = audioRef.value
    if (audio) audio.loop = mode === 'one'
  },
)

watch(
  () => player.pendingPlay,
  (want) => {
    const audio = audioRef.value
    if (!audio) return
    if (want) {
      // Resume only when the element already holds the current track. Otherwise
      // loadCurrent owns autoplay after resolving the new src (avoids playing the
      // previous song after idle pause + queue click).
      if (!isBoundToCurrent()) return
      void audio.play().catch(() => player.pause())
    } else {
      audio.pause()
    }
  },
)

watch(
  () => player.seekTo,
  (value) => {
    const audio = audioRef.value
    if (audio && value != null && Number.isFinite(value) && audio.src) {
      audio.currentTime = value
      player.seekTo = null
    }
  },
)

function onTimeUpdate() {
  const audio = audioRef.value
  if (!audio || !isBoundToCurrent()) return
  player.currentTime = audio.currentTime
  player.duration = audio.duration || 0
  const now = Date.now()
  if (now - lastMediaSessionSync >= MEDIA_SESSION_SYNC_MS) {
    lastMediaSessionSync = now
    updateMediaSession()
  }
  if (now - lastTimePersist > 2000) {
    lastTimePersist = now
    player.flushPersist()
  }
}

function onPlay() {
  player.playing = true
}

function onPause() {
  const audio = audioRef.value
  // Natural end fires pause before ended; let onEnded own that transition.
  if (audio?.ended) return
  // Track switch pauses the previous src before the new URL resolves. Ignore that
  // (and any events from an unbound element) so pendingPlay still autoplays the new track.
  if (!isBoundToCurrent()) return
  // External interrupt (other app / OS) pauses the element without store.pause();
  // clear pendingPlay so a later play() re-triggers the pendingPlay watcher.
  player.pendingPlay = false
  player.playing = false
  player.flushPersist()
}

function onEnded() {
  // The previous file can end while a later queue item is still downloading.
  if (!isBoundToCurrent()) return
  player.onEnded()
  // Repeat-one also sets audio.loop; this path covers seek+play if ended still fires
  // (e.g. loop was off) when pendingPlay was already true so its watch does not re-run.
  if (player.repeatMode === 'one') {
    const audio = audioRef.value
    if (!audio) return
    const seek = player.seekTo
    audio.currentTime = seek != null && Number.isFinite(seek) ? seek : 0
    player.seekTo = null
    void audio.play().catch(() => player.pause())
  }
}

function onVisibilityFlush() {
  player.flushPersist()
}

onMounted(() => {
  const audio = audioRef.value
  if (audio) audio.loop = player.repeatMode === 'one'
  document.addEventListener('visibilitychange', onVisibilityFlush)
  window.addEventListener('pagehide', onVisibilityFlush)
  updateMediaSession()
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
    @timeupdate="onTimeUpdate"
    @play="onPlay"
    @pause="onPause"
    @ended="onEnded"
  />
</template>
