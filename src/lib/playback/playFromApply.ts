import { shuffleFromCurrent } from './playerLogic';
import type { QueueSession } from './queueSession';

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
