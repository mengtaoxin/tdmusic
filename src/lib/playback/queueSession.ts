import {
  mapOccurrenceIndex,
  nextIndex,
  prevIndex,
  repeatModeForManualAdvance,
  shuffleUpcoming,
  type RepeatMode,
} from './playerLogic';

export type QueueSession = {
  queue: string[];
  originalQueue: string[];
  currentId: string | null;
  currentIndex: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
};

export function emptyQueueSession(): QueueSession {
  return {
    queue: [],
    originalQueue: [],
    currentId: null,
    currentIndex: -1,
    shuffle: false,
    repeatMode: 'off',
  };
}

export function withShuffleFlag(session: QueueSession, shuffle: boolean): QueueSession {
  return { ...session, shuffle };
}

export function withRepeatMode(session: QueueSession, repeatMode: RepeatMode): QueueSession {
  return { ...session, repeatMode };
}

export type GoToResult = {
  kind: 'goTo';
  session: QueueSession;
  autoPlay: boolean;
};

export function goToIndex(
  session: QueueSession,
  index: number,
  autoPlay: boolean,
): GoToResult | null {
  if (index < 0 || index >= session.queue.length) return null;
  return {
    kind: 'goTo',
    session: {
      ...session,
      currentIndex: index,
      currentId: session.queue[index]!,
    },
    autoPlay,
  };
}

export type AdvanceResult = GoToResult | { kind: 'pause' };

export function advanceNext(session: QueueSession): AdvanceResult {
  const modeForAdvance = repeatModeForManualAdvance(session.repeatMode);
  const nextIdx = nextIndex(session.currentIndex, session.queue.length, {
    repeatMode: modeForAdvance,
    shuffle: session.shuffle,
  });
  if (nextIdx == null || nextIdx === session.currentIndex) {
    return { kind: 'pause' };
  }
  return goToIndex(session, nextIdx, true)!;
}

export type PrevResult = GoToResult | { kind: 'seekZero' };

export function advancePrev(session: QueueSession, currentTime: number): PrevResult {
  if (currentTime > 3) return { kind: 'seekZero' };
  const modeForAdvance = repeatModeForManualAdvance(session.repeatMode);
  const prevIdx = prevIndex(session.currentIndex, session.queue.length, {
    repeatMode: modeForAdvance,
  });
  if (prevIdx == null) return { kind: 'seekZero' };
  return goToIndex(session, prevIdx, true)!;
}

export function toggleShuffle(
  session: QueueSession,
  random: () => number = Math.random,
): QueueSession {
  const shuffle = !session.shuffle;
  if (shuffle) {
    let originalQueue = session.originalQueue;
    if (originalQueue.length === 0) {
      originalQueue = [...session.queue];
    }
    return {
      ...session,
      shuffle: true,
      originalQueue,
      queue: shuffleUpcoming(session.queue, session.currentIndex, random),
    };
  }
  if (session.originalQueue.length > 0) {
    const id = session.currentId;
    const playingIndex = session.currentIndex;
    const fromQueue = session.queue;
    const queue = [...session.originalQueue];
    let currentIndex = session.currentIndex;
    let currentId = session.currentId;
    if (id) {
      const restored = mapOccurrenceIndex(fromQueue, playingIndex, session.originalQueue);
      if (restored >= 0) {
        currentIndex = restored;
        currentId = id;
      } else {
        const fallback = session.originalQueue.indexOf(id);
        if (fallback >= 0) {
          currentIndex = fallback;
          currentId = id;
        }
      }
    }
    return { ...session, shuffle: false, queue, currentIndex, currentId };
  }
  return { ...session, shuffle: false };
}
