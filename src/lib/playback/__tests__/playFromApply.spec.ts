import { describe, expect, it } from 'vitest';

import {
  applyPlayFromChunk,
  applyPlayFromDone,
  applyPlayFromHead,
  applyPlayFromReset,
} from '../playFromApply';
import { emptyQueueSession, withShuffleFlag, type QueueSession } from '../queueSession';

function session(partial: Partial<QueueSession> = {}): QueueSession {
  return {
    ...emptyQueueSession(),
    queue: ['a', 'b', 'c', 'd'],
    originalQueue: ['a', 'b', 'c', 'd'],
    currentId: 'a',
    currentIndex: 0,
    ...partial,
  };
}

describe('playFrom fill', () => {
  it('reset then head then chunks rebuild original order', () => {
    const reset = applyPlayFromReset(session({ shuffle: true }));
    expect(reset.queue).toEqual([]);
    expect(reset.originalQueue).toEqual([]);
    expect(reset.shuffle).toBe(true);

    const headed = applyPlayFromHead(reset, 'c', 2);
    expect(headed).toEqual(
      expect.objectContaining({ currentId: 'c', currentIndex: 2, shuffle: true }),
    );

    const prefix = applyPlayFromChunk(headed, ['a', 'b', 'c']);
    const full = applyPlayFromChunk(prefix, ['d']);
    expect(full.originalQueue).toEqual(['a', 'b', 'c', 'd']);
    expect(full.queue).toEqual(['a', 'b', 'c', 'd']);
  });

  it('applyPlayFromDone shuffles from current when shuffle is on', () => {
    const filled = session({
      queue: ['a', 'b', 'c', 'd'],
      originalQueue: ['a', 'b', 'c', 'd'],
      currentId: 'c',
      currentIndex: 2,
      shuffle: true,
    });
    const values = [0, 0];
    const done = applyPlayFromDone(filled, () => values.shift() ?? 0);
    expect(done.currentId).toBe('c');
    expect(done.currentIndex).toBe(0);
    expect(done.queue).toEqual(['c', 'b', 'd', 'a']);
    expect(done.originalQueue).toEqual(['a', 'b', 'c', 'd']);
  });

  it('withShuffleFlag sets the flag without reordering', () => {
    const next = withShuffleFlag(session(), true);
    expect(next.shuffle).toBe(true);
    expect(next.queue).toEqual(['a', 'b', 'c', 'd']);
  });
});
