import { describe, expect, it } from 'vitest';

import { emptyQueueSession, type QueueSession } from '../queueSession';
import { clickTrack, moveToNext } from '../trackClick';

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

describe('clickTrack / moveToNext', () => {
  it('clickTrack starts the source list when nothing is queued', () => {
    expect(clickTrack(emptyQueueSession(), ['a', 'b'], 1, false)).toEqual({ kind: 'playFrom' });
    expect(
      clickTrack(
        session({ queue: [], originalQueue: [], currentId: null, currentIndex: -1 }),
        ['a'],
        0,
        true,
      ),
    ).toEqual({
      kind: 'playFrom',
    });
  });

  it('clickTrack ignores a missing row', () => {
    expect(clickTrack(session(), ['a', 'b'], 5, true)).toEqual({ kind: 'noop' });
    expect(clickTrack(session(), ['a', ''], 1, true)).toEqual({ kind: 'noop' });
  });

  it('clickTrack queues a different track next while playback is active', () => {
    const queued = session({
      queue: ['a', 'b', 'c'],
      originalQueue: ['a', 'b', 'c'],
      currentId: 'a',
      currentIndex: 0,
    });
    expect(clickTrack(queued, ['a', 'b', 'z'], 2, true)).toEqual({ kind: 'queueNext' });
  });

  it('clickTrack moves the nearest queued copy instead of inserting another', () => {
    const queued = session({
      queue: ['b', 'a', 'c', 'd', 'b'],
      originalQueue: ['b', 'a', 'c', 'd', 'b'],
      currentId: 'a',
      currentIndex: 1,
    });
    expect(clickTrack(queued, ['b', 'x'], 0, true)).toEqual({ kind: 'moveNext', index: 0 });
  });

  it('clickTrack moves a closer upcoming copy ahead of an earlier duplicate', () => {
    const queued = session({
      queue: ['b', 'x', 'y', 'a', 'c', 'b'],
      originalQueue: ['b', 'x', 'y', 'a', 'c', 'b'],
      currentId: 'a',
      currentIndex: 3,
    });
    expect(clickTrack(queued, ['b'], 0, true)).toEqual({ kind: 'moveNext', index: 5 });
  });

  it('clickTrack prefers the upcoming copy when two are equally close', () => {
    const queued = session({
      queue: ['b', 'x', 'a', 'y', 'b'],
      originalQueue: ['b', 'x', 'a', 'y', 'b'],
      currentId: 'a',
      currentIndex: 2,
    });
    expect(clickTrack(queued, ['b'], 0, true)).toEqual({ kind: 'moveNext', index: 4 });
  });

  it('clickTrack leaves a farther duplicate alone when one copy is already next', () => {
    const queued = session({
      queue: ['a', 'b', 'c', 'b'],
      originalQueue: ['a', 'b', 'c', 'b'],
      currentId: 'a',
      currentIndex: 0,
    });
    expect(clickTrack(queued, ['b'], 0, true)).toEqual({ kind: 'alreadyNext' });
  });

  it('moveToNext relocates that occurrence to sit after the current track', () => {
    const closerEarlier = moveToNext(
      session({
        queue: ['b', 'a', 'c', 'd', 'b'],
        originalQueue: ['b', 'a', 'c', 'd', 'b'],
        currentId: 'a',
        currentIndex: 1,
      }),
      0,
    );
    expect(closerEarlier).toEqual(
      expect.objectContaining({
        queue: ['a', 'b', 'c', 'd', 'b'],
        originalQueue: ['a', 'b', 'c', 'd', 'b'],
        currentId: 'a',
        currentIndex: 0,
      }),
    );

    const tiedUpcoming = moveToNext(
      session({
        queue: ['b', 'x', 'a', 'y', 'b'],
        originalQueue: ['b', 'x', 'a', 'y', 'b'],
        currentId: 'a',
        currentIndex: 2,
      }),
      4,
    );
    expect(tiedUpcoming).toEqual(
      expect.objectContaining({
        queue: ['b', 'x', 'a', 'b', 'y'],
        originalQueue: ['b', 'x', 'a', 'b', 'y'],
        currentId: 'a',
        currentIndex: 2,
      }),
    );
  });

  it('moveToNext moves the same occurrence in a shuffled original queue', () => {
    const moved = moveToNext(
      session({
        queue: ['c', 'a', 'd', 'b'],
        originalQueue: ['a', 'b', 'c', 'd'],
        currentId: 'a',
        currentIndex: 1,
      }),
      3,
    );
    expect(moved).toEqual(
      expect.objectContaining({
        queue: ['c', 'a', 'b', 'd'],
        originalQueue: ['a', 'b', 'c', 'd'],
        currentId: 'a',
        currentIndex: 1,
      }),
    );
  });

  it('clickTrack does not queue another copy when that track is already next', () => {
    const queued = session({
      queue: ['a', 'b', 'c'],
      originalQueue: ['a', 'b', 'c'],
      currentId: 'a',
      currentIndex: 0,
    });
    expect(clickTrack(queued, ['a', 'b', 'c'], 1, true)).toEqual({ kind: 'alreadyNext' });
  });

  it('clickTrack leaves the current track alone while it is playing', () => {
    const queued = session({ currentId: 'a', currentIndex: 0 });
    expect(clickTrack(queued, ['a', 'b', 'c', 'd'], 0, true)).toEqual({ kind: 'noop' });
  });

  it('clickTrack inserts a paused click and plays that new index', () => {
    const paused = session({
      queue: ['a', 'b', 'c'],
      originalQueue: ['a', 'b', 'c'],
      currentId: 'a',
      currentIndex: 0,
    });
    expect(clickTrack(paused, ['a', 'b', 'c'], 2, false)).toEqual({
      kind: 'insertAndPlay',
      index: 1,
    });
  });

  it('clickTrack plays an already-queued next track when playback is paused', () => {
    const paused = session({
      queue: ['a', 'b', 'c'],
      originalQueue: ['a', 'b', 'c'],
      currentId: 'a',
      currentIndex: 0,
    });
    expect(clickTrack(paused, ['a', 'b', 'c'], 1, false)).toEqual({ kind: 'playIndex', index: 1 });
  });

  it('clickTrack resumes the paused current track', () => {
    const paused = session({ currentId: 'a', currentIndex: 0 });
    expect(clickTrack(paused, ['a', 'b', 'c', 'd'], 0, false)).toEqual({ kind: 'resume' });
  });
});
