import {
  appendToQueue as appendId,
  clearUpcoming,
  insertAfterCurrent,
  mapOccurrenceIndex,
  nextIndex,
  prevIndex,
  removeAtIndex,
  repeatModeForManualAdvance,
  shuffleFromCurrent,
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

export type EnqueueResult =
  | { kind: 'playFrom'; sourceIds: string[] }
  | { kind: 'session'; session: QueueSession };

export function playNext(session: QueueSession, id: string): EnqueueResult {
  if (!id) return { kind: 'session', session };
  if (session.queue.length === 0 || !session.currentId) {
    return { kind: 'playFrom', sourceIds: [id] };
  }
  const idx = session.currentIndex;
  const origIdx = mapOccurrenceIndex(session.queue, idx, session.originalQueue);
  return {
    kind: 'session',
    session: {
      ...session,
      queue: insertAfterCurrent(session.queue, idx, id),
      originalQueue: insertAfterCurrent(
        session.originalQueue,
        origIdx >= 0 ? origIdx : session.originalQueue.length - 1,
        id,
      ),
    },
  };
}

export function addToQueue(session: QueueSession, id: string): EnqueueResult {
  if (!id) return { kind: 'session', session };
  if (session.queue.length === 0 || !session.currentId) {
    return { kind: 'playFrom', sourceIds: [id] };
  }
  return {
    kind: 'session',
    session: {
      ...session,
      queue: appendId(session.queue, id),
      originalQueue: appendId(session.originalQueue, id),
    },
  };
}

export type RemoveAtResult =
  | { kind: 'clear' }
  | { kind: 'goTo'; session: QueueSession; index: number }
  | { kind: 'session'; session: QueueSession }
  | { kind: 'pause' }
  | { kind: 'noop' };

export function removeAt(session: QueueSession, index: number): RemoveAtResult {
  if (index < 0 || index >= session.queue.length) return { kind: 'noop' };
  const playingIndex = session.currentIndex;
  const removingCurrent = index === playingIndex;
  const origPos = mapOccurrenceIndex(session.queue, index, session.originalQueue);

  if (removingCurrent) {
    if (session.queue.length === 1) return { kind: 'clear' };
    const modeForAdvance = repeatModeForManualAdvance(session.repeatMode);
    const nextIdx = nextIndex(index, session.queue.length, {
      repeatMode: modeForAdvance,
      shuffle: session.shuffle,
    });
    const targetIdx = nextIdx != null && nextIdx !== index ? nextIdx : index > 0 ? index - 1 : null;
    if (targetIdx == null) return { kind: 'pause' };

    const nextQueue = removeAtIndex(session.queue, index, index).queue;
    let originalQueue = session.originalQueue;
    if (origPos >= 0) {
      originalQueue = removeAtIndex(session.originalQueue, origPos, origPos).queue;
    }
    return {
      kind: 'goTo',
      session: { ...session, queue: nextQueue, originalQueue },
      index: targetIdx > index ? targetIdx - 1 : targetIdx,
    };
  }

  const { queue: nextQueue } = removeAtIndex(session.queue, index, playingIndex);
  let currentIndex = playingIndex;
  let currentId = session.currentId;
  if (index < playingIndex) {
    currentIndex = playingIndex - 1;
    currentId = nextQueue[currentIndex] ?? session.currentId;
  }
  let originalQueue = session.originalQueue;
  if (origPos >= 0) {
    originalQueue = removeAtIndex(session.originalQueue, origPos, origPos).queue;
  }
  return {
    kind: 'session',
    session: { ...session, queue: nextQueue, originalQueue, currentIndex, currentId },
  };
}

export function clearUpcomingTracks(session: QueueSession): QueueSession | null {
  const idx = session.currentIndex;
  if (idx < 0) return null;
  const origIdx = mapOccurrenceIndex(session.queue, idx, session.originalQueue);
  const kept = clearUpcoming(session.queue, idx);
  if (origIdx >= 0) {
    return {
      ...session,
      queue: kept,
      originalQueue: clearUpcoming(session.originalQueue, origIdx),
    };
  }
  return { ...session, queue: kept, originalQueue: [...kept] };
}

export function clearQueue(session: QueueSession): QueueSession {
  return {
    ...session,
    queue: [],
    originalQueue: [],
    currentId: null,
    currentIndex: -1,
  };
}

export function applyPlayFromReset(session: QueueSession): QueueSession {
  return { ...session, queue: [], originalQueue: [] };
}

export function applyPlayFromHead(
  session: QueueSession,
  headId: string,
  index: number,
): QueueSession {
  return { ...session, currentId: headId, currentIndex: index };
}

export function applyPlayFromChunk(session: QueueSession, chunk: string[]): QueueSession {
  const originalQueue = session.originalQueue.concat(chunk);
  return { ...session, originalQueue, queue: [...originalQueue] };
}

export function applyPlayFromDone(
  session: QueueSession,
  random: () => number = Math.random,
): QueueSession {
  if (!session.shuffle) return session;
  const shuffled = shuffleFromCurrent(session.originalQueue, session.currentIndex, random);
  return { ...session, queue: shuffled, currentIndex: 0, currentId: shuffled[0] ?? null };
}
