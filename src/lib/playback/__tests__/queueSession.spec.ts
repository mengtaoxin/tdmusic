import { describe, expect, it } from 'vitest';

import {
  advanceNext,
  advancePrev,
  emptyQueueSession,
  goToIndex,
  toggleShuffle,
  type QueueSession,
} from '../queueSession';

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

describe('goToIndex / advance', () => {
  it('goToIndex moves current and requests a load cue', () => {
    const result = goToIndex(session(), 2, true);
    expect(result).toEqual({
      kind: 'goTo',
      session: expect.objectContaining({ currentId: 'c', currentIndex: 2 }),
      autoPlay: true,
    });
  });

  it('advanceNext wraps with repeat all and pauses at end when off', () => {
    const wrap = advanceNext(session({ currentIndex: 3, currentId: 'd', repeatMode: 'all' }));
    expect(wrap).toMatchObject({ kind: 'goTo', session: { currentId: 'a', currentIndex: 0 } });

    const stop = advanceNext(session({ currentIndex: 3, currentId: 'd', repeatMode: 'off' }));
    expect(stop).toEqual({ kind: 'pause' });
  });

  it('advanceNext leaves the current track when repeat is one', () => {
    const result = advanceNext(session({ repeatMode: 'one', currentIndex: 1, currentId: 'b' }));
    expect(result).toMatchObject({ kind: 'goTo', session: { currentId: 'c', currentIndex: 2 } });
  });

  it('advancePrev seeks to zero when far enough into the track', () => {
    expect(advancePrev(session({ currentIndex: 1, currentId: 'b' }), 4)).toEqual({
      kind: 'seekZero',
    });
  });

  it('advancePrev goes to the previous index near the start', () => {
    const result = advancePrev(session({ currentIndex: 1, currentId: 'b' }), 1);
    expect(result).toMatchObject({ kind: 'goTo', session: { currentId: 'a', currentIndex: 0 } });
  });
});

describe('toggleShuffle', () => {
  it('shuffles only the upcoming tail and restores original order', () => {
    const values = [0, 0];
    const rnd = () => values.shift() ?? 0;
    const on = toggleShuffle(session({ currentIndex: 1, currentId: 'b' }), rnd);
    expect(on.shuffle).toBe(true);
    expect(on.currentId).toBe('b');
    expect(on.queue).toEqual(['a', 'b', 'd', 'c']);

    const off = toggleShuffle(on);
    expect(off.shuffle).toBe(false);
    expect(off.queue).toEqual(['a', 'b', 'c', 'd']);
    expect(off.currentIndex).toBe(1);
    expect(off.currentId).toBe('b');
  });

  it('restores the same duplicate occurrence when turning shuffle off', () => {
    const start = session({
      queue: ['a', 'b', 'a', 'c'],
      originalQueue: ['a', 'b', 'a', 'c'],
      currentId: 'a',
      currentIndex: 0,
    });
    const values = [0, 0];
    const on = toggleShuffle(start, () => values.shift() ?? 0);
    expect(on.queue).toEqual(['a', 'a', 'c', 'b']);
    const playingSecond = { ...on, currentIndex: 1, currentId: 'a' };
    const off = toggleShuffle(playingSecond);
    expect(off.currentIndex).toBe(2);
    expect(off.currentId).toBe('a');
    expect(off.queue).toEqual(['a', 'b', 'a', 'c']);
  });
});
