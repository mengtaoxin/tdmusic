import {
  appendToQueue as appendId,
  clearUpcoming,
  insertAfterCurrent,
  mapOccurrenceIndex,
  nextIndex,
  removeAtIndex,
  repeatModeForManualAdvance,
} from './playerLogic';
import type { QueueSession } from './queueSession';

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
