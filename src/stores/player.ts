import { create } from 'zustand';

import { getItem, removeItem, setItem } from '@/lib/clientStorage';
import {
  applyPlayFromChunk,
  applyPlayFromDone,
  applyPlayFromHead,
  applyPlayFromReset,
} from '@/lib/playback/playFromApply';
import { createPlayerSessionApply, readQueueSession } from '@/lib/playback/playerSessionApply';
import {
  hydratePlayerState,
  parsePlayerState,
  PLAYER_STORAGE_KEY,
} from '@/lib/playback/playerStateCodec';
import { createPlayFromSession } from '@/lib/playback/playFromSession';
import type { RepeatMode } from '@/lib/playback/playerLogic';
import { createPlayerPersist } from '@/lib/playback/playerPersist';
import {
  addToQueue as enqueueAdd,
  clearQueue,
  clearUpcomingTracks,
  playNext as enqueuePlayNext,
  removeAt as sessionRemoveAt,
} from '@/lib/playback/queueMutations';
import {
  advanceNext,
  advancePrev,
  emptyQueueSession,
  goToIndex as sessionGoToIndex,
  toggleShuffle as sessionToggleShuffle,
  withRepeatMode,
  withShuffleFlag,
  type QueueSession,
} from '@/lib/playback/queueSession';
import { clickTrack, moveToNext } from '@/lib/playback/trackClick';

type PlayerState = QueueSession & {
  currentTime: number;
  duration: number;
  playing: boolean;
  loadToken: number;
  seekTo: number | null;
  pendingPlay: boolean;
  playFrom: (startIndex: number, sourceIds: string[], options?: { shuffle?: boolean }) => void;
  playTrackFromList: (sourceIds: string[], index: number) => boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  seek: (time: number) => void;
  next: () => void;
  skip: () => void;
  prev: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  playNext: (id: string) => void;
  moveToPlayNext: (index: number) => void;
  addToQueue: (id: string) => void;
  removeAt: (index: number) => void;
  clearUpcoming: () => void;
  clearNowPlaying: () => void;
  onEnded: () => void;
  hydrate: (knownIds: Set<string>) => boolean;
  flushPersist: () => void;
  goToIndex: (index: number, autoPlay: boolean) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => {
  const playFromSession = createPlayFromSession();
  const persist = createPlayerPersist({
    setItem,
    getPayload: () => {
      const s = get();
      return {
        queue: s.queue,
        originalQueue: s.originalQueue,
        currentId: s.currentId,
        currentIndex: s.currentIndex,
        currentTime: s.currentTime,
        repeatMode: s.repeatMode,
        shuffle: s.shuffle,
      };
    },
  });
  const { schedulePersist, flushPersist } = persist;
  const sessionApply = createPlayerSessionApply({
    getSession: () => readQueueSession(get()),
    getLoadToken: () => get().loadToken,
    set,
    flushPersist,
    schedulePersist,
  });

  function goToIndex(index: number, autoPlay: boolean) {
    const result = sessionGoToIndex(sessionApply.readSession(), index, autoPlay);
    if (!result) return;
    sessionApply.applyCueAndFlush(result.session, {
      autoPlay: result.autoPlay,
      bumpLoad: true,
      seekTo: 0,
    });
  }

  function pause() {
    set({ pendingPlay: false, playing: false });
    flushPersist();
  }

  function play() {
    if (!get().currentId) return;
    set({ pendingPlay: true, playing: true });
  }

  function next() {
    const result = advanceNext(sessionApply.readSession());
    if (result.kind === 'pause') {
      pause();
      return;
    }
    sessionApply.applyCueAndFlush(result.session, {
      autoPlay: result.autoPlay,
      bumpLoad: true,
      seekTo: 0,
    });
  }

  function clearPlaybackFields() {
    set({ currentTime: 0, seekTo: 0 });
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
      const persisted = parsePlayerState(getItem(PLAYER_STORAGE_KEY));
      if (!persisted) return false;
      const hydrated = hydratePlayerState(persisted, knownIds);
      if (!hydrated) {
        removeItem(PLAYER_STORAGE_KEY);
        set(clearQueue(sessionApply.readSession()));
        clearPlaybackFields();
        return false;
      }
      set({
        queue: hydrated.queue,
        originalQueue: hydrated.originalQueue,
        currentId: hydrated.currentId,
        currentIndex: hydrated.currentIndex,
        currentTime: hydrated.currentTime,
        repeatMode: hydrated.repeatMode,
        shuffle: hydrated.shuffle,
        playing: false,
        pendingPlay: false,
        seekTo: hydrated.currentTime,
        loadToken: get().loadToken + 1,
      });
      return true;
    },

    playFrom(startIndex: number, sourceIds: string[], options?: { shuffle?: boolean }) {
      if (options?.shuffle != null) {
        set(withShuffleFlag(sessionApply.readSession(), options.shuffle));
      }
      playFromSession.start(startIndex, sourceIds, {
        onReset: () => {
          const reset = applyPlayFromReset(sessionApply.readSession());
          set({ ...reset, currentTime: 0, seekTo: 0 });
        },
        onHead: (headId, index) => {
          sessionApply.applyCue(applyPlayFromHead(sessionApply.readSession(), headId, index), {
            autoPlay: true,
            bumpLoad: true,
          });
          schedulePersist();
        },
        onChunk: (chunk) => {
          sessionApply.applySession(
            applyPlayFromChunk(sessionApply.readSession(), chunk),
            'schedule',
          );
        },
        onDone: () => {
          sessionApply.applySession(applyPlayFromDone(sessionApply.readSession()), 'flush');
        },
      });
    },

    playTrackFromList(sourceIds: string[], index: number) {
      const player = get();
      const result = clickTrack(
        sessionApply.readSession(),
        sourceIds,
        index,
        player.playing || player.pendingPlay,
      );
      const id = sourceIds[index];
      switch (result.kind) {
        case 'noop':
          return false;
        case 'playFrom':
          player.playFrom(index, sourceIds);
          return false;
        case 'resume':
          play();
          return false;
        case 'playIndex':
          goToIndex(result.index, true);
          return false;
        case 'insertAndPlay':
          if (!id) return false;
          player.playNext(id);
          goToIndex(result.index, true);
          return false;
        case 'queueNext':
          if (!id) return false;
          player.playNext(id);
          return true;
        case 'moveNext':
          player.moveToPlayNext(result.index);
          return true;
        case 'alreadyNext':
          return true;
        default: {
          const unreachable: never = result;
          return unreachable;
        }
      }
    },

    play,
    pause,

    togglePlay() {
      if (get().playing) pause();
      else play();
    },

    setCurrentTime(time: number) {
      set({ currentTime: time });
      schedulePersist();
    },

    seek(time: number) {
      set({ currentTime: time, seekTo: time });
      flushPersist();
    },

    goToIndex,
    next,
    skip() {
      next();
    },

    prev() {
      const result = advancePrev(sessionApply.readSession(), get().currentTime);
      if (result.kind === 'seekZero') {
        get().seek(0);
        return;
      }
      sessionApply.applyCueAndFlush(result.session, {
        autoPlay: result.autoPlay,
        bumpLoad: true,
        seekTo: 0,
      });
    },

    toggleRepeat() {
      const order: RepeatMode[] = ['off', 'all', 'one'];
      const i = order.indexOf(get().repeatMode);
      sessionApply.applySession(
        withRepeatMode(sessionApply.readSession(), order[(i + 1) % order.length]!),
      );
    },

    toggleShuffle() {
      sessionApply.applySession(sessionToggleShuffle(sessionApply.readSession()));
    },

    playNext(id: string) {
      const result = enqueuePlayNext(sessionApply.readSession(), id);
      if (result.kind === 'playFrom') {
        get().playFrom(0, result.sourceIds);
        return;
      }
      sessionApply.applySession(result.session);
    },

    moveToPlayNext(index: number) {
      const moved = moveToNext(sessionApply.readSession(), index);
      if (!moved) return;
      sessionApply.applySession(moved);
    },

    addToQueue(id: string) {
      const result = enqueueAdd(sessionApply.readSession(), id);
      if (result.kind === 'playFrom') {
        get().playFrom(0, result.sourceIds);
        return;
      }
      sessionApply.applySession(result.session);
    },

    removeAt(index: number) {
      const result = sessionRemoveAt(sessionApply.readSession(), index);
      if (result.kind === 'noop') return;
      if (result.kind === 'pause') {
        pause();
        return;
      }
      if (result.kind === 'clear') {
        playFromSession.cancel();
        set({ ...clearQueue(sessionApply.readSession()), seekTo: 0 });
        clearPlaybackFields();
        pause();
        flushPersist();
        return;
      }
      if (result.kind === 'goTo') {
        set(result.session);
        goToIndex(result.index, true);
        return;
      }
      sessionApply.applySession(result.session);
    },

    clearUpcoming() {
      const nextSession = clearUpcomingTracks(sessionApply.readSession());
      if (!nextSession) return;
      sessionApply.applySession(nextSession);
    },

    clearNowPlaying() {
      playFromSession.cancel();
      set({ ...clearQueue(sessionApply.readSession()), seekTo: 0 });
      clearPlaybackFields();
      pause();
      flushPersist();
    },

    onEnded() {
      if (get().repeatMode === 'one') {
        get().seek(0);
        play();
        return;
      }
      next();
    },
  };
});
