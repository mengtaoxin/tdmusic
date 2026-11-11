import { insertAfterCurrent, mapOccurrenceIndex } from './playerLogic';
import type { QueueSession } from './queueSession';

export type TrackClickResult =
  | { kind: 'noop' }
  | { kind: 'playFrom' }
  | { kind: 'resume' }
  | { kind: 'playIndex'; index: number }
  | { kind: 'insertAndPlay'; index: number }
  | { kind: 'queueNext' }
  | { kind: 'moveNext'; index: number }
  | { kind: 'alreadyNext' };

/** Row click: queue next while audio is active; start the clicked track when paused. */
export function clickTrack(
  session: QueueSession,
  sourceIds: readonly string[],
  index: number,
  playbackActive: boolean,
): TrackClickResult {
  const id = sourceIds[index];
  if (!id) return { kind: 'noop' };
  if (session.queue.length === 0 || !session.currentId) return { kind: 'playFrom' };
  if (id === session.currentId) {
    return playbackActive ? { kind: 'noop' } : { kind: 'resume' };
  }
  const upcomingIndex = session.currentIndex + 1;
  if (session.queue[upcomingIndex] === id) {
    return playbackActive ? { kind: 'alreadyNext' } : { kind: 'playIndex', index: upcomingIndex };
  }
  if (playbackActive) {
    const existing = closestQueuedIndex(session.queue, session.currentIndex, id);
    if (existing >= 0) return { kind: 'moveNext', index: existing };
    return { kind: 'queueNext' };
  }
  return { kind: 'insertAndPlay', index: upcomingIndex };
}

/** Nearest other copy of `id`. On a tie, the upcoming occurrence wins. */
function closestQueuedIndex(queue: readonly string[], currentIndex: number, id: string): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < queue.length; index += 1) {
    if (index === currentIndex || queue[index] !== id) continue;
    const distance = Math.abs(index - currentIndex);
    const upcomingTie = distance === bestDistance && index > currentIndex;
    if (distance < bestDistance || upcomingTie) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

function relocateAfter(
  queue: readonly string[],
  fromIndex: number,
  anchorIndex: number,
): { queue: string[]; anchorIndex: number } | null {
  if (fromIndex < 0 || fromIndex >= queue.length || fromIndex === anchorIndex) return null;
  const id = queue[fromIndex];
  if (id == null) return null;
  const without = queue.slice(0, fromIndex).concat(queue.slice(fromIndex + 1));
  const anchor = fromIndex < anchorIndex ? anchorIndex - 1 : anchorIndex;
  return { queue: insertAfterCurrent(without, anchor, id), anchorIndex: anchor };
}

/** Move one queued occurrence to sit immediately after the current track. */
export function moveToNext(session: QueueSession, fromIndex: number): QueueSession | null {
  const moved = relocateAfter(session.queue, fromIndex, session.currentIndex);
  if (!moved) return null;

  let originalQueue = session.originalQueue;
  const origFrom = mapOccurrenceIndex(session.queue, fromIndex, session.originalQueue);
  if (origFrom >= 0) {
    const origCurrent = mapOccurrenceIndex(
      session.queue,
      session.currentIndex,
      session.originalQueue,
    );
    const anchor = origCurrent >= 0 ? origCurrent : originalQueue.length - 1;
    const movedOriginal = relocateAfter(originalQueue, origFrom, anchor);
    if (movedOriginal) originalQueue = movedOriginal.queue;
  }

  return {
    ...session,
    queue: moved.queue,
    originalQueue,
    currentIndex: moved.anchorIndex,
    currentId: moved.queue[moved.anchorIndex] ?? session.currentId,
  };
}
