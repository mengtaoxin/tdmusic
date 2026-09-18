import { create } from 'zustand'

import { getItem, removeItem, setItem } from '@/lib/clientStorage'
import {
  addToQueue as enqueueAdd,
  advanceNext,
  advancePrev,
  applyPlayFromChunk,
  applyPlayFromDone,
  applyPlayFromHead,
  applyPlayFromReset,
  clearQueue,
  clearUpcomingTracks,
  emptyQueueSession,
  goToIndex as sessionGoToIndex,
  playNext as enqueuePlayNext,
  removeAt as sessionRemoveAt,
  toggleShuffle as sessionToggleShuffle,
  withRepeatMode,
  withShuffleFlag,
  type QueueSession,
} from '@/lib/playback/playbackQueue'
import {
  hydratePlayerState,
  parsePlayerState,
  PLAYER_STORAGE_KEY,
} from '@/lib/playback/playerStateCodec'
import { createPlayFromSession } from '@/lib/playback/playFromSession'
import type { RepeatMode } from '@/lib/playback/playerLogic'
import { createPlayerPersist } from '@/lib/playback/playerPersist'

type PlayerState = QueueSession & {
  currentTime: number
  duration: number
  playing: boolean
  loadToken: number
  seekTo: number | null
  pendingPlay: boolean
  playFrom: (startIndex: number, sourceIds: string[], options?: { shuffle?: boolean }) => void
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

function readQueueSession(s: PlayerState): QueueSession {
  return {
    queue: s.queue,
    originalQueue: s.originalQueue,
    currentId: s.currentId,
    currentIndex: s.currentIndex,
    shuffle: s.shuffle,
    repeatMode: s.repeatMode,
  }
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

  function applyCue(
    session: QueueSession,
    options: { autoPlay: boolean; bumpLoad: boolean; currentTime?: number; seekTo?: number | null },
  ) {
    set({
      ...session,
      currentTime: options.currentTime ?? 0,
      seekTo: options.seekTo ?? 0,
      pendingPlay: options.autoPlay,
      playing: options.autoPlay,
      ...(options.bumpLoad ? { loadToken: get().loadToken + 1 } : {}),
    })
  }

  function goToIndex(index: number, autoPlay: boolean) {
    const result = sessionGoToIndex(readQueueSession(get()), index, autoPlay)
    if (!result) return
    applyCue(result.session, { autoPlay: result.autoPlay, bumpLoad: true, seekTo: 0 })
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
    const result = advanceNext(readQueueSession(get()))
    if (result.kind === 'pause') {
      pause()
      return
    }
    applyCue(result.session, { autoPlay: result.autoPlay, bumpLoad: true, seekTo: 0 })
    flushPersist()
  }

  function clearPlaybackFields() {
    set({ currentTime: 0, seekTo: 0 })
  }

  return {
    ...emptyQueueSession(),
    currentTime: 0,
    duration: 0,
    playing: false,
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
        set(clearQueue(readQueueSession(get())))
        clearPlaybackFields()
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

    playFrom(startIndex: number, sourceIds: string[], options?: { shuffle?: boolean }) {
      if (options?.shuffle != null) {
        set(withShuffleFlag(readQueueSession(get()), options.shuffle))
      }
      playFromSession.start(startIndex, sourceIds, {
        onReset: () => {
          const reset = applyPlayFromReset(readQueueSession(get()))
          set({ ...reset, currentTime: 0, seekTo: 0 })
        },
        onHead: (headId, index) => {
          set({
            ...applyPlayFromHead(readQueueSession(get()), headId, index),
            pendingPlay: true,
            playing: true,
            loadToken: get().loadToken + 1,
          })
          schedulePersist()
        },
        onChunk: (chunk) => {
          set(applyPlayFromChunk(readQueueSession(get()), chunk))
          schedulePersist()
        },
        onDone: () => {
          set(applyPlayFromDone(readQueueSession(get())))
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
      const result = advancePrev(readQueueSession(get()), get().currentTime)
      if (result.kind === 'seekZero') {
        get().seek(0)
        return
      }
      applyCue(result.session, { autoPlay: result.autoPlay, bumpLoad: true, seekTo: 0 })
      flushPersist()
    },

    toggleRepeat() {
      const order: RepeatMode[] = ['off', 'all', 'one']
      const i = order.indexOf(get().repeatMode)
      set(withRepeatMode(readQueueSession(get()), order[(i + 1) % order.length]!))
      flushPersist()
    },

    toggleShuffle() {
      set(sessionToggleShuffle(readQueueSession(get())))
      flushPersist()
    },

    playNext(id: string) {
      const result = enqueuePlayNext(readQueueSession(get()), id)
      if (result.kind === 'playFrom') {
        get().playFrom(0, result.sourceIds)
        return
      }
      set(result.session)
      flushPersist()
    },

    addToQueue(id: string) {
      const result = enqueueAdd(readQueueSession(get()), id)
      if (result.kind === 'playFrom') {
        get().playFrom(0, result.sourceIds)
        return
      }
      set(result.session)
      flushPersist()
    },

    removeAt(index: number) {
      const result = sessionRemoveAt(readQueueSession(get()), index)
      if (result.kind === 'noop') return
      if (result.kind === 'pause') {
        pause()
        return
      }
      if (result.kind === 'clear') {
        playFromSession.cancel()
        set({ ...clearQueue(readQueueSession(get())), seekTo: 0 })
        clearPlaybackFields()
        pause()
        flushPersist()
        return
      }
      if (result.kind === 'goTo') {
        set(result.session)
        goToIndex(result.index, true)
        return
      }
      set(result.session)
      flushPersist()
    },

    clearUpcoming() {
      const nextSession = clearUpcomingTracks(readQueueSession(get()))
      if (!nextSession) return
      set(nextSession)
      flushPersist()
    },

    clearNowPlaying() {
      playFromSession.cancel()
      set({ ...clearQueue(readQueueSession(get())), seekTo: 0 })
      clearPlaybackFields()
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
