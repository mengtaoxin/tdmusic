<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import { resolvePlayableUrl } from '@/lib/resolvePlayableUrl'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

const audioRef = ref<HTMLAudioElement | null>(null)
const catalog = useCatalogStore()
const player = usePlayerStore()

let lastTimePersist = 0

async function loadCurrent() {
  const audio = audioRef.value
  const id = player.currentId
  if (!audio || !id) return
  const track = catalog.trackById.get(id)
  if (!track) return

  try {
    const url = await resolvePlayableUrl(track.path, track.id)
    if (player.currentId !== id) return
    audio.src = url
    audio.load()
    catalog.scheduleEnrichTrack(id)
    const seek = player.seekTo
    const onLoaded = () => {
      if (seek != null && Number.isFinite(seek)) {
        audio.currentTime = seek
      }
      player.seekTo = null
      if (player.pendingPlay) {
        void audio.play().catch(() => {
          player.pause()
        })
      }
      audio.removeEventListener('loadedmetadata', onLoaded)
    }
    audio.addEventListener('loadedmetadata', onLoaded)
  } catch {
    player.pause()
  }
}

watch(
  () => player.loadToken,
  () => {
    void loadCurrent()
  },
)

watch(
  () => player.pendingPlay,
  (want) => {
    const audio = audioRef.value
    if (!audio) return
    if (want) {
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
  if (!audio) return
  player.currentTime = audio.currentTime
  player.duration = audio.duration || 0
  const now = Date.now()
  if (now - lastTimePersist > 2000) {
    lastTimePersist = now
    player.flushPersist()
  }
}

function onPlay() {
  player.playing = true
}

function onPause() {
  player.playing = false
  player.flushPersist()
}

function onEnded() {
  player.onEnded()
}

function onVisibilityFlush() {
  player.flushPersist()
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityFlush)
  window.addEventListener('pagehide', onVisibilityFlush)
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
