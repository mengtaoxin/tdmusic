import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getItem, removeItem, setItem } from '@/lib/clientStorage'
import {
  appendToQueue,
  buildQueueFrom,
  clearUpcoming,
  hydratePlayerState,
  insertAfterCurrent,
  nextIndex,
  parsePlayerState,
  PLAYER_STORAGE_KEY,
  prevIndex,
  removeAtIndex,
  serializePlayerState,
  shuffleUpcoming,
  type RepeatMode,
} from '@/lib/playerLogic'

export const usePlayerStore = defineStore('player', () => {
  const queue = ref<string[]>([])
  /** Linear order from playFrom; used to restore when shuffle turns off. */
  const originalQueue = ref<string[]>([])
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
      originalQueue: originalQueue.value,
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
      originalQueue.value = []
      currentId.value = null
      currentTime.value = 0
      return false
    }
    queue.value = next.queue
    originalQueue.value = next.originalQueue
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
    originalQueue.value = []
    currentTime.value = 0
    seekTo.value = 0

    const job = buildQueueFrom(sourceIds, startIndex, {
      onHead: (headId) => {
        currentId.value = headId
        pendingPlay.value = true
        playing.value = true
        loadToken.value += 1
        schedulePersist()
      },
      onChunk: (chunk) => {
        originalQueue.value = originalQueue.value.concat(chunk)
        // Mirror original while filling; shuffle applies onDone when enabled.
        queue.value = [...originalQueue.value]
        schedulePersist()
      },
      onDone: () => {
        cancelFill = null
        if (shuffle.value) {
          queue.value = shuffleUpcoming(originalQueue.value, currentIndex.value)
        }
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

  /** Manual next / failure skip: advance past current; repeat-one still leaves the track. */
  function next() {
    const index = currentIndex.value
    const modeForAdvance = repeatMode.value === 'one' ? 'off' : repeatMode.value
    const nextIdx = nextIndex(index, queue.value.length, {
      repeatMode: modeForAdvance,
      shuffle: shuffle.value,
    })
    if (nextIdx == null || nextIdx === index) {
      pause()
      return
    }
    goToIndex(nextIdx, true)
  }

  /** Advance past the current track (e.g. download failure). Same as next. */
  function skip() {
    next()
  }

  function prev() {
    if (currentTime.value > 3) {
      seek(0)
      return
    }
    const index = currentIndex.value
    const modeForAdvance = repeatMode.value === 'one' ? 'off' : repeatMode.value
    const prevIdx = prevIndex(index, queue.value.length, {
      repeatMode: modeForAdvance,
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
    if (shuffle.value) {
      if (originalQueue.value.length === 0) {
        originalQueue.value = [...queue.value]
      }
      queue.value = shuffleUpcoming(queue.value, currentIndex.value)
    } else if (originalQueue.value.length > 0) {
      queue.value = [...originalQueue.value]
    }
    flushPersist()
  }

  function playNext(id: string) {
    if (!id) return
    if (queue.value.length === 0 || !currentId.value) {
      playFrom(0, [id])
      return
    }
    const idx = currentIndex.value
    queue.value = insertAfterCurrent(queue.value, idx, id)
    const origIdx = originalQueue.value.indexOf(currentId.value)
    originalQueue.value = insertAfterCurrent(
      originalQueue.value,
      origIdx >= 0 ? origIdx : originalQueue.value.length - 1,
      id,
    )
    flushPersist()
  }

  function addToQueue(id: string) {
    if (!id) return
    if (queue.value.length === 0 || !currentId.value) {
      playFrom(0, [id])
      return
    }
    queue.value = appendToQueue(queue.value, id)
    originalQueue.value = appendToQueue(originalQueue.value, id)
    flushPersist()
  }

  function removeAt(index: number) {
    if (index < 0 || index >= queue.value.length) return
    const removingCurrent = index === currentIndex.value
    const removedId = queue.value[index]!

    if (removingCurrent) {
      if (queue.value.length === 1) {
        cancelFill?.()
        cancelFill = null
        queue.value = []
        originalQueue.value = []
        currentId.value = null
        currentTime.value = 0
        seekTo.value = 0
        pause()
        flushPersist()
        return
      }
      const modeForAdvance = repeatMode.value === 'one' ? 'off' : repeatMode.value
      const nextIdx = nextIndex(index, queue.value.length, {
        repeatMode: modeForAdvance,
        shuffle: shuffle.value,
      })
      // Prefer the track after current; if none, the previous one.
      const targetIdx =
        nextIdx != null && nextIdx !== index ? nextIdx : index > 0 ? index - 1 : null
      if (targetIdx == null) {
        pause()
        return
      }
      const targetId = queue.value[targetIdx]!
      const nextQueue = removeAtIndex(queue.value, index, index).queue
      queue.value = nextQueue
      const origPos = originalQueue.value.indexOf(removedId)
      if (origPos >= 0) {
        originalQueue.value = removeAtIndex(originalQueue.value, origPos, origPos).queue
      }
      const newIdx = queue.value.indexOf(targetId)
      goToIndex(newIdx >= 0 ? newIdx : 0, true)
      return
    }

    const { queue: nextQueue } = removeAtIndex(queue.value, index, currentIndex.value)
    queue.value = nextQueue
    const origPos = originalQueue.value.indexOf(removedId)
    if (origPos >= 0) {
      originalQueue.value = removeAtIndex(originalQueue.value, origPos, origPos).queue
    }
    flushPersist()
  }

  function clearUpcomingTracks() {
    const idx = currentIndex.value
    if (idx < 0) return
    const kept = clearUpcoming(queue.value, idx)
    const current = currentId.value
    queue.value = kept
    if (current) {
      const origIdx = originalQueue.value.indexOf(current)
      if (origIdx >= 0) {
        originalQueue.value = clearUpcoming(originalQueue.value, origIdx)
      } else {
        originalQueue.value = [...kept]
      }
    } else {
      originalQueue.value = [...kept]
    }
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
    originalQueue,
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
    skip,
    prev,
    toggleRepeat,
    toggleShuffle,
    playNext,
    addToQueue,
    removeAt,
    clearUpcoming: clearUpcomingTracks,
    onEnded,
    hydrate,
    flushPersist,
    goToIndex,
  }
})
