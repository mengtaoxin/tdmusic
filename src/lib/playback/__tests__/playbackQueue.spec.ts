import { describe, expect, it } from 'vitest'

import {
  addToQueue,
  advanceNext,
  advancePrev,
  applyPlayFromChunk,
  applyPlayFromDone,
  applyPlayFromHead,
  applyPlayFromReset,
  clearUpcomingTracks,
  emptyQueueSession,
  goToIndex,
  playNext,
  removeAt,
  toggleShuffle,
  withShuffleFlag,
  type QueueSession,
} from '../playbackQueue'

function session(partial: Partial<QueueSession> = {}): QueueSession {
  return {
    ...emptyQueueSession(),
    queue: ['a', 'b', 'c', 'd'],
    originalQueue: ['a', 'b', 'c', 'd'],
    currentId: 'a',
    currentIndex: 0,
    ...partial,
  }
}

describe('goToIndex / advance', () => {
  it('goToIndex moves current and requests a load cue', () => {
    const result = goToIndex(session(), 2, true)
    expect(result).toEqual({
      kind: 'goTo',
      session: expect.objectContaining({ currentId: 'c', currentIndex: 2 }),
      autoPlay: true,
    })
  })

  it('advanceNext wraps with repeat all and pauses at end when off', () => {
    const wrap = advanceNext(session({ currentIndex: 3, currentId: 'd', repeatMode: 'all' }))
    expect(wrap).toMatchObject({ kind: 'goTo', session: { currentId: 'a', currentIndex: 0 } })

    const stop = advanceNext(session({ currentIndex: 3, currentId: 'd', repeatMode: 'off' }))
    expect(stop).toEqual({ kind: 'pause' })
  })

  it('advanceNext leaves the current track when repeat is one', () => {
    const result = advanceNext(session({ repeatMode: 'one', currentIndex: 1, currentId: 'b' }))
    expect(result).toMatchObject({ kind: 'goTo', session: { currentId: 'c', currentIndex: 2 } })
  })

  it('advancePrev seeks to zero when far enough into the track', () => {
    expect(advancePrev(session({ currentIndex: 1, currentId: 'b' }), 4)).toEqual({
      kind: 'seekZero',
    })
  })

  it('advancePrev goes to the previous index near the start', () => {
    const result = advancePrev(session({ currentIndex: 1, currentId: 'b' }), 1)
    expect(result).toMatchObject({ kind: 'goTo', session: { currentId: 'a', currentIndex: 0 } })
  })
})

describe('toggleShuffle', () => {
  it('shuffles only the upcoming tail and restores original order', () => {
    const values = [0, 0]
    const rnd = () => values.shift() ?? 0
    const on = toggleShuffle(session({ currentIndex: 1, currentId: 'b' }), rnd)
    expect(on.shuffle).toBe(true)
    expect(on.currentId).toBe('b')
    expect(on.queue).toEqual(['a', 'b', 'd', 'c'])

    const off = toggleShuffle(on)
    expect(off.shuffle).toBe(false)
    expect(off.queue).toEqual(['a', 'b', 'c', 'd'])
    expect(off.currentIndex).toBe(1)
    expect(off.currentId).toBe('b')
  })

  it('restores the same duplicate occurrence when turning shuffle off', () => {
    const start = session({
      queue: ['a', 'b', 'a', 'c'],
      originalQueue: ['a', 'b', 'a', 'c'],
      currentId: 'a',
      currentIndex: 0,
    })
    const values = [0, 0]
    const on = toggleShuffle(start, () => values.shift() ?? 0)
    expect(on.queue).toEqual(['a', 'a', 'c', 'b'])
    const playingSecond = { ...on, currentIndex: 1, currentId: 'a' }
    const off = toggleShuffle(playingSecond)
    expect(off.currentIndex).toBe(2)
    expect(off.currentId).toBe('a')
    expect(off.queue).toEqual(['a', 'b', 'a', 'c'])
  })
})

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
    )
    expect(result).toEqual({
      kind: 'session',
      session: expect.objectContaining({
        queue: ['a', 'b', 'a', 'x', 'c'],
        originalQueue: ['a', 'b', 'a', 'x', 'c'],
        currentIndex: 2,
      }),
    })
  })

  it('playNext on an empty queue requests playFrom', () => {
    expect(playNext(emptyQueueSession(), 'solo')).toEqual({
      kind: 'playFrom',
      sourceIds: ['solo'],
    })
  })

  it('addToQueue appends to both queues', () => {
    const result = addToQueue(session({ queue: ['a', 'b'], originalQueue: ['a', 'b'] }), 'z')
    expect(result).toEqual({
      kind: 'session',
      session: expect.objectContaining({
        queue: ['a', 'b', 'z'],
        originalQueue: ['a', 'b', 'z'],
      }),
    })
  })

  it('removeAt drops a non-current track and shifts currentIndex when needed', () => {
    const drop = removeAt(session({ currentIndex: 0, currentId: 'a' }), 1)
    expect(drop).toEqual({
      kind: 'session',
      session: expect.objectContaining({
        queue: ['a', 'c', 'd'],
        originalQueue: ['a', 'c', 'd'],
        currentIndex: 0,
        currentId: 'a',
      }),
    })

    const beforePlaying = removeAt(
      session({
        queue: ['a', 'b', 'a'],
        originalQueue: ['a', 'b', 'a'],
        currentIndex: 2,
        currentId: 'a',
      }),
      0,
    )
    expect(beforePlaying).toEqual({
      kind: 'session',
      session: expect.objectContaining({
        queue: ['b', 'a'],
        currentIndex: 1,
        currentId: 'a',
      }),
    })
  })

  it('removeAt on current advances then drops the old track', () => {
    const result = removeAt(session({ currentIndex: 0, currentId: 'a' }), 0)
    expect(result).toEqual({
      kind: 'goTo',
      session: expect.objectContaining({
        queue: ['b', 'c', 'd'],
        originalQueue: ['b', 'c', 'd'],
      }),
      index: 0,
    })
  })

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
    ).toEqual({ kind: 'clear' })
  })

  it('clearUpcomingTracks keeps the prefix through the playing occurrence', () => {
    const next = clearUpcomingTracks(session({ currentIndex: 1, currentId: 'b' }))
    expect(next).toEqual(
      expect.objectContaining({
        queue: ['a', 'b'],
        originalQueue: ['a', 'b'],
        currentId: 'b',
        currentIndex: 1,
      }),
    )
  })
})

describe('playFrom fill', () => {
  it('reset then head then chunks rebuild original order', () => {
    const reset = applyPlayFromReset(session({ shuffle: true }))
    expect(reset.queue).toEqual([])
    expect(reset.originalQueue).toEqual([])
    expect(reset.shuffle).toBe(true)

    const headed = applyPlayFromHead(reset, 'c', 2)
    expect(headed).toEqual(
      expect.objectContaining({ currentId: 'c', currentIndex: 2, shuffle: true }),
    )

    const prefix = applyPlayFromChunk(headed, ['a', 'b', 'c'])
    const full = applyPlayFromChunk(prefix, ['d'])
    expect(full.originalQueue).toEqual(['a', 'b', 'c', 'd'])
    expect(full.queue).toEqual(['a', 'b', 'c', 'd'])
  })

  it('applyPlayFromDone shuffles from current when shuffle is on', () => {
    const filled = session({
      queue: ['a', 'b', 'c', 'd'],
      originalQueue: ['a', 'b', 'c', 'd'],
      currentId: 'c',
      currentIndex: 2,
      shuffle: true,
    })
    const values = [0, 0]
    const done = applyPlayFromDone(filled, () => values.shift() ?? 0)
    expect(done.currentId).toBe('c')
    expect(done.currentIndex).toBe(0)
    expect(done.queue).toEqual(['c', 'b', 'd', 'a'])
    expect(done.originalQueue).toEqual(['a', 'b', 'c', 'd'])
  })

  it('withShuffleFlag sets the flag without reordering', () => {
    const next = withShuffleFlag(session(), true)
    expect(next.shuffle).toBe(true)
    expect(next.queue).toEqual(['a', 'b', 'c', 'd'])
  })
})
