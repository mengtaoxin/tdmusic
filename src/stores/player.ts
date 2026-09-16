import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getItem, removeItem, setItem } from '@/lib/clientStorage'
import {
  buildQueueFrom,
  hydratePlayerState,
  nextIndex,
  parsePlayerState,
  PLAYER_STORAGE_KEY,
  prevIndex,
  serializePlayerState,
  type RepeatMode,
} from '@/lib/playerLogic'

export const usePlayerStore = defineStore('player', () => {
  const queue = ref<string[]>([])
  const currentId = ref<string | null>(null)
  const currentTime = ref(0)
  const duration = ref(0)
  const playing = ref(false)
  const repeatMode = ref<RepeatMode>('off')
  const shuffle = ref(false)
  /** Signal for App audio element: bump to load/seek current track. */
  const loadToken = ref(0)
  const seekTo = ref<number | null>(null)
  const pendingPlay = ref(false)

  let cancelFill: (() => void) | null = null
  let persistTimer: ReturnType<typeof setTimeout> | null = null

  const currentIndex = computed(() => {
    if (!currentId.value) return -1
    return queue.value.indexOf(currentId.value)
  })

  function persistNow() {
    const payload = serializePlayerState({
      queue: queue.value,
      currentId: currentId.value,
      currentTime: currentTime.value,
      repeatMode: repeatMode.value,
      shuffle: shuffle.value,
    })
    setItem(PLAYER_STORAGE_KEY, payload)
  }

  function schedulePersist() {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      persistTimer = null
      persistNow()
    }, 400)
  }

  function persistTimeThrottled() {
    schedulePersist()
  }

  function flushPersist() {
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
    }
    persistNow()
  }

  function hydrate(knownIds: Set<string>) {
    const persisted = parsePlayerState(getItem(PLAYER_STORAGE_KEY))
    if (!persisted) return false
    const next = hydratePlayerState(persisted, knownIds)
    if (!next) {
      removeItem(PLAYER_STORAGE_KEY)
      queue.value = []
      currentId.value = null
      currentTime.value = 0
      return false
    }
    queue.value = next.queue
    currentId.value = next.currentId
    currentTime.value = next.currentTime
    repeatMode.value = next.repeatMode
    shuffle.value = next.shuffle
    playing.value = false
    pendingPlay.value = false
    seekTo.value = next.currentTime
    loadToken.value += 1
    return true
  }

  function playFrom(startIndex: number, sourceIds: string[]) {
    cancelFill?.()
    cancelFill = null

    if (startIndex < 0 || startIndex >= sourceIds.length) return

    queue.value = []
    currentTime.value = 0
    seekTo.value = 0

    const job = buildQueueFrom(sourceIds, startIndex, {
      onHead: (headId) => {
        queue.value = [headId]
        currentId.value = headId
        pendingPlay.value = true
        playing.value = true
        loadToken.value += 1
        schedulePersist()
      },
      onChunk: (chunk) => {
        queue.value = queue.value.concat(chunk)
        schedulePersist()
      },
      onDone: () => {
        cancelFill = null
        flushPersist()
      },
    })
    cancelFill = job.cancel
  }

  function play() {
    if (!currentId.value) return
    pendingPlay.value = true
    playing.value = true
  }

  function pause() {
    pendingPlay.value = false
    playing.value = false
    flushPersist()
  }

  function togglePlay() {
    if (playing.value) pause()
    else play()
  }

  function setCurrentTime(time: number) {
    currentTime.value = time
    persistTimeThrottled()
  }

  function seek(time: number) {
    currentTime.value = time
    seekTo.value = time
    flushPersist()
  }

  function goToIndex(index: number, autoPlay: boolean) {
    if (index < 0 || index >= queue.value.length) return
    currentId.value = queue.value[index]!
    currentTime.value = 0
    seekTo.value = 0
    pendingPlay.value = autoPlay
    playing.value = autoPlay
    loadToken.value += 1
    flushPersist()
  }

  function next() {
    const index = currentIndex.value
    const nextIdx = nextIndex(index, queue.value.length, {
      repeatMode: repeatMode.value,
      shuffle: shuffle.value,
    })
    if (nextIdx == null) {
      pause()
      return
    }
    goToIndex(nextIdx, true)
  }

  function prev() {
    if (currentTime.value > 3) {
      seek(0)
      return
    }
    const index = currentIndex.value
    const prevIdx = prevIndex(index, queue.value.length, {
      repeatMode: repeatMode.value,
    })
    if (prevIdx == null) {
      seek(0)
      return
    }
    goToIndex(prevIdx, true)
  }

  function toggleRepeat() {
    const order: RepeatMode[] = ['off', 'all', 'one']
    const i = order.indexOf(repeatMode.value)
    repeatMode.value = order[(i + 1) % order.length]!
    flushPersist()
  }

  function toggleShuffle() {
    shuffle.value = !shuffle.value
    flushPersist()
  }

  function onEnded() {
    if (repeatMode.value === 'one') {
      seek(0)
      play()
      return
    }
    next()
  }

  return {
    queue,
    currentId,
    currentTime,
    duration,
    playing,
    repeatMode,
    shuffle,
    loadToken,
    seekTo,
    pendingPlay,
    currentIndex,
    playFrom,
    play,
    pause,
    togglePlay,
    setCurrentTime,
    seek,
    next,
    prev,
    toggleRepeat,
    toggleShuffle,
    onEnded,
    hydrate,
    flushPersist,
    goToIndex,
  }
})
