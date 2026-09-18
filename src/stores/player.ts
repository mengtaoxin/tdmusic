import { create } from 'zustand'

import { getItem, removeItem, setItem } from '@/lib/clientStorage'
import {
  appendToQueue,
  clearUpcoming,
  hydratePlayerState,
  insertAfterCurrent,
  mapOccurrenceIndex,
  nextIndex,
  parsePlayerState,
  PLAYER_STORAGE_KEY,
  prevIndex,
  removeAtIndex,
  repeatModeForManualAdvance,
  shuffleFromCurrent,
  shuffleUpcoming,
  type RepeatMode,
} from '@/lib/playback/playerLogic'
import { createPlayFromSession } from '@/lib/playback/playFromSession'
import { createPlayerPersist } from '@/lib/playback/playerPersist'

type PlayerState = {
  queue: string[]
  originalQueue: string[]
  currentId: string | null
  currentIndex: number
  currentTime: number
  duration: number
  playing: boolean
  repeatMode: RepeatMode
  shuffle: boolean
  loadToken: number
  seekTo: number | null
  pendingPlay: boolean
  playFrom: (startIndex: number, sourceIds: string[]) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  setCurrentTime: (time: number) => void
  seek: (time: number) => void
  next: () => void
  skip: () => void
  prev: () => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  playNext: (id: string) => void
  addToQueue: (id: string) => void
  removeAt: (index: number) => void
  clearUpcoming: () => void
  clearNowPlaying: () => void
  onEnded: () => void
  hydrate: (knownIds: Set<string>) => boolean
  flushPersist: () => void
  goToIndex: (index: number, autoPlay: boolean) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const playFromSession = createPlayFromSession()
  const persist = createPlayerPersist({
    setItem,
    getPayload: () => {
      const s = get()
      return {
        queue: s.queue,
        originalQueue: s.originalQueue,
        currentId: s.currentId,
        currentIndex: s.currentIndex,
        currentTime: s.currentTime,
        repeatMode: s.repeatMode,
        shuffle: s.shuffle,
      }
    },
  })
  const { schedulePersist, flushPersist } = persist

  function clearPlayback() {
    set({ currentId: null, currentIndex: -1, currentTime: 0 })
  }

  function goToIndex(index: number, autoPlay: boolean) {
    const { queue } = get()
    if (index < 0 || index >= queue.length) return
    set({
      currentIndex: index,
      currentId: queue[index]!,
      currentTime: 0,
      seekTo: 0,
      pendingPlay: autoPlay,
      playing: autoPlay,
      loadToken: get().loadToken + 1,
    })
    flushPersist()
  }

  function pause() {
    set({ pendingPlay: false, playing: false })
    flushPersist()
  }

  function play() {
    if (!get().currentId) return
    set({ pendingPlay: true, playing: true })
  }

  function next() {
    const { currentIndex, queue, repeatMode, shuffle } = get()
    const modeForAdvance = repeatModeForManualAdvance(repeatMode)
    const nextIdx = nextIndex(currentIndex, queue.length, {
      repeatMode: modeForAdvance,
      shuffle,
    })
    if (nextIdx == null || nextIdx === currentIndex) {
      pause()
      return
    }
    goToIndex(nextIdx, true)
  }

  return {
    queue: [],
    originalQueue: [],
    currentId: null,
    currentIndex: -1,
    currentTime: 0,
    duration: 0,
    playing: false,
    repeatMode: 'off',
    shuffle: false,
    loadToken: 0,
    seekTo: null,
    pendingPlay: false,

    flushPersist,

    hydrate(knownIds: Set<string>) {
      const persisted = parsePlayerState(getItem(PLAYER_STORAGE_KEY))
      if (!persisted) return false
      const next = hydratePlayerState(persisted, knownIds)
      if (!next) {
        removeItem(PLAYER_STORAGE_KEY)
        set({ queue: [], originalQueue: [] })
        clearPlayback()
        return false
      }
      set({
        queue: next.queue,
        originalQueue: next.originalQueue,
        currentId: next.currentId,
        currentIndex: next.currentIndex,
        currentTime: next.currentTime,
        repeatMode: next.repeatMode,
        shuffle: next.shuffle,
        playing: false,
        pendingPlay: false,
        seekTo: next.currentTime,
        loadToken: get().loadToken + 1,
      })
      return true
    },

    playFrom(startIndex: number, sourceIds: string[]) {
      playFromSession.start(startIndex, sourceIds, {
        onReset: () => {
          set({
            queue: [],
            originalQueue: [],
            currentTime: 0,
            seekTo: 0,
          })
        },
        onHead: (headId, index) => {
          set({
            currentId: headId,
            currentIndex: index,
            pendingPlay: true,
            playing: true,
            loadToken: get().loadToken + 1,
          })
          schedulePersist()
        },
        onChunk: (chunk) => {
          const originalQueue = get().originalQueue.concat(chunk)
          set({
            originalQueue,
            queue: [...originalQueue],
          })
          schedulePersist()
        },
        onDone: () => {
          if (get().shuffle) {
            const shuffled = shuffleFromCurrent(get().originalQueue, get().currentIndex)
            set({ queue: shuffled, currentIndex: 0 })
          }
          flushPersist()
        },
      })
    },

    play,
    pause,

    togglePlay() {
      if (get().playing) pause()
      else play()
    },

    setCurrentTime(time: number) {
      set({ currentTime: time })
      schedulePersist()
    },

    seek(time: number) {
      set({ currentTime: time, seekTo: time })
      flushPersist()
    },

    goToIndex,
    next,
    skip() {
      next()
    },

    prev() {
      if (get().currentTime > 3) {
        get().seek(0)
        return
      }
      const { currentIndex, queue, repeatMode } = get()
      const modeForAdvance = repeatModeForManualAdvance(repeatMode)
      const prevIdx = prevIndex(currentIndex, queue.length, {
        repeatMode: modeForAdvance,
      })
      if (prevIdx == null) {
        get().seek(0)
        return
      }
      goToIndex(prevIdx, true)
    },

    toggleRepeat() {
      const order: RepeatMode[] = ['off', 'all', 'one']
      const i = order.indexOf(get().repeatMode)
      set({ repeatMode: order[(i + 1) % order.length]! })
      flushPersist()
    },

    toggleShuffle() {
      const s = get()
      const shuffle = !s.shuffle
      if (shuffle) {
        let originalQueue = s.originalQueue
        if (originalQueue.length === 0) {
          originalQueue = [...s.queue]
        }
        set({
          shuffle: true,
          originalQueue,
          queue: shuffleUpcoming(s.queue, s.currentIndex),
        })
      } else if (s.originalQueue.length > 0) {
        const id = s.currentId
        const playingIndex = s.currentIndex
        const fromQueue = s.queue
        const queue = [...s.originalQueue]
        let currentIndex = s.currentIndex
        let currentId = s.currentId
        if (id) {
          const restored = mapOccurrenceIndex(fromQueue, playingIndex, s.originalQueue)
          if (restored >= 0) {
            currentIndex = restored
            currentId = id
          } else {
            const fallback = s.originalQueue.indexOf(id)
            if (fallback >= 0) {
              currentIndex = fallback
              currentId = id
            }
          }
        }
        set({ shuffle: false, queue, currentIndex, currentId })
      } else {
        set({ shuffle: false })
      }
      flushPersist()
    },

    playNext(id: string) {
      if (!id) return
      const s = get()
      if (s.queue.length === 0 || !s.currentId) {
        get().playFrom(0, [id])
        return
      }
      const idx = s.currentIndex
      const origIdx = mapOccurrenceIndex(s.queue, idx, s.originalQueue)
      set({
        queue: insertAfterCurrent(s.queue, idx, id),
        originalQueue: insertAfterCurrent(
          s.originalQueue,
          origIdx >= 0 ? origIdx : s.originalQueue.length - 1,
          id,
        ),
      })
      flushPersist()
    },

    addToQueue(id: string) {
      if (!id) return
      const s = get()
      if (s.queue.length === 0 || !s.currentId) {
        get().playFrom(0, [id])
        return
      }
      set({
        queue: appendToQueue(s.queue, id),
        originalQueue: appendToQueue(s.originalQueue, id),
      })
      flushPersist()
    },

    removeAt(index: number) {
      const s = get()
      if (index < 0 || index >= s.queue.length) return
      const playingIndex = s.currentIndex
      const removingCurrent = index === playingIndex
      const origPos = mapOccurrenceIndex(s.queue, index, s.originalQueue)

      if (removingCurrent) {
        if (s.queue.length === 1) {
          playFromSession.cancel()
          set({ queue: [], originalQueue: [], seekTo: 0 })
          clearPlayback()
          pause()
          flushPersist()
          return
        }
        const modeForAdvance = repeatModeForManualAdvance(s.repeatMode)
        const nextIdx = nextIndex(index, s.queue.length, {
          repeatMode: modeForAdvance,
          shuffle: s.shuffle,
        })
        const targetIdx =
          nextIdx != null && nextIdx !== index ? nextIdx : index > 0 ? index - 1 : null
        if (targetIdx == null) {
          pause()
          return
        }
        const nextQueue = removeAtIndex(s.queue, index, index).queue
        let originalQueue = s.originalQueue
        if (origPos >= 0) {
          originalQueue = removeAtIndex(s.originalQueue, origPos, origPos).queue
        }
        set({ queue: nextQueue, originalQueue })
        const newIdx = targetIdx > index ? targetIdx - 1 : targetIdx
        goToIndex(newIdx, true)
        return
      }

      const { queue: nextQueue } = removeAtIndex(s.queue, index, playingIndex)
      const patch: Partial<PlayerState> = { queue: nextQueue }
      if (index < playingIndex) {
        patch.currentIndex = playingIndex - 1
      }
      if (origPos >= 0) {
        patch.originalQueue = removeAtIndex(s.originalQueue, origPos, origPos).queue
      }
      set(patch)
      flushPersist()
    },

    clearUpcoming() {
      const s = get()
      const idx = s.currentIndex
      if (idx < 0) return
      const origIdx = mapOccurrenceIndex(s.queue, idx, s.originalQueue)
      const kept = clearUpcoming(s.queue, idx)
      if (origIdx >= 0) {
        set({
          queue: kept,
          originalQueue: clearUpcoming(s.originalQueue, origIdx),
        })
      } else {
        set({ queue: kept, originalQueue: [...kept] })
      }
      flushPersist()
    },

    clearNowPlaying() {
      playFromSession.cancel()
      set({ queue: [], originalQueue: [], seekTo: 0 })
      clearPlayback()
      pause()
      flushPersist()
    },

    onEnded() {
      if (get().repeatMode === 'one') {
        get().seek(0)
        play()
        return
      }
      next()
    },
  }
})
