import { describe, expect, it } from 'vitest';

import { addToQueue, clearUpcomingTracks, playNext, removeAt } from '../queueMutations';
import { emptyQueueSession, type QueueSession } from '../queueSession';

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

describe('queue mutations', () => {
  it('playNext inserts after the current occurrence in both queues', () => {
    const result = playNext(
      session({
        queue: ['a', 'b', 'a', 'c'],
        originalQueue: ['a', 'b', 'a', 'c'],
        currentIndex: 2,
        currentId: 'a',
      }),
      'x',
    );
    expect(result).toEqual({
      kind: 'session',
      session: expect.objectContaining({
        queue: ['a', 'b', 'a', 'x', 'c'],
        originalQueue: ['a', 'b', 'a', 'x', 'c'],
        currentIndex: 2,
      }),
    });
  });

  it('playNext on an empty queue requests playFrom', () => {
    expect(playNext(emptyQueueSession(), 'solo')).toEqual({
      kind: 'playFrom',
      sourceIds: ['solo'],
    });
  });

  it('addToQueue appends to both queues', () => {
    const result = addToQueue(session({ queue: ['a', 'b'], originalQueue: ['a', 'b'] }), 'z');
    expect(result).toEqual({
      kind: 'session',
      session: expect.objectContaining({
        queue: ['a', 'b', 'z'],
        originalQueue: ['a', 'b', 'z'],
      }),
    });
  });

  it('removeAt drops a non-current track and shifts currentIndex when needed', () => {
    const drop = removeAt(session({ currentIndex: 0, currentId: 'a' }), 1);
    expect(drop).toEqual({
      kind: 'session',
      session: expect.objectContaining({
        queue: ['a', 'c', 'd'],
        originalQueue: ['a', 'c', 'd'],
        currentIndex: 0,
        currentId: 'a',
      }),
    });

    const beforePlaying = removeAt(
      session({
        queue: ['a', 'b', 'a'],
        originalQueue: ['a', 'b', 'a'],
        currentIndex: 2,
        currentId: 'a',
      }),
      0,
    );
    expect(beforePlaying).toEqual({
      kind: 'session',
      session: expect.objectContaining({
        queue: ['b', 'a'],
        currentIndex: 1,
        currentId: 'a',
      }),
    });
  });

  it('removeAt on current advances then drops the old track', () => {
    const result = removeAt(session({ currentIndex: 0, currentId: 'a' }), 0);
    expect(result).toEqual({
      kind: 'goTo',
      session: expect.objectContaining({
        queue: ['b', 'c', 'd'],
        originalQueue: ['b', 'c', 'd'],
      }),
      index: 0,
    });
  });

  it('removeAt on the only track clears the session', () => {
    expect(
      removeAt(
        session({
          queue: ['a'],
          originalQueue: ['a'],
          currentId: 'a',
          currentIndex: 0,
        }),
        0,
      ),
    ).toEqual({ kind: 'clear' });
  });

  it('clearUpcomingTracks keeps the prefix through the playing occurrence', () => {
    const next = clearUpcomingTracks(session({ currentIndex: 1, currentId: 'b' }));
    expect(next).toEqual(
      expect.objectContaining({
        queue: ['a', 'b'],
        originalQueue: ['a', 'b'],
        currentId: 'b',
        currentIndex: 1,
      }),
    );
  });
});
