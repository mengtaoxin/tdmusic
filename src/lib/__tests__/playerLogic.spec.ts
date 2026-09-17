import { describe, expect, it } from 'vitest'

import {
  appendToQueue,
  buildQueueFrom,
  clearUpcoming,
  hydratePlayerState,
  insertAfterCurrent,
  nextIndex,
  parsePlayerState,
  prevIndex,
  removeAtIndex,
  serializePlayerState,
  shuffleUpcoming,
  upcomingQueueIds,
} from '../playerLogic'

describe('nextIndex / prevIndex', () => {
  it('advances linearly and stops at end when repeat off', () => {
    expect(nextIndex(0, 3, { repeatMode: 'off', shuffle: false })).toBe(1)
    expect(nextIndex(2, 3, { repeatMode: 'off', shuffle: false })).toBeNull()
  })

  it('wraps with repeat all', () => {
    expect(nextIndex(2, 3, { repeatMode: 'all', shuffle: false })).toBe(0)
    expect(prevIndex(0, 3, { repeatMode: 'all' })).toBe(2)
  })

  it('stays on same track for repeat one', () => {
    expect(nextIndex(1, 3, { repeatMode: 'one', shuffle: false })).toBe(1)
  })

  it('advances linearly even when shuffle flag is set (order is pre-shuffled)', () => {
    expect(nextIndex(0, 3, { repeatMode: 'off', shuffle: true })).toBe(1)
    expect(nextIndex(2, 3, { repeatMode: 'off', shuffle: true })).toBeNull()
  })
})

describe('shuffleUpcoming', () => {
  it('keeps played prefix and current, shuffles only the rest', () => {
    // Fisher–Yates on ['c','d','e']: j=0, j=0 → ['d','e','c']
    const values = [0, 0]
    const rnd = () => values.shift() ?? 0
    expect(shuffleUpcoming(['a', 'b', 'c', 'd', 'e'], 1, rnd)).toEqual(['a', 'b', 'd', 'e', 'c'])
  })

  it('returns a copy when nothing follows current', () => {
    const queue = ['a', 'b']
    expect(shuffleUpcoming(queue, 1, () => 0)).toEqual(['a', 'b'])
    expect(shuffleUpcoming(queue, 1, () => 0)).not.toBe(queue)
  })
})

describe('upcomingQueueIds', () => {
  const queue = ['a', 'b', 'c', 'd', 'e']

  it('takes the next count ids linearly when shuffle off', () => {
    expect(upcomingQueueIds(queue, 1, { count: 3, repeatMode: 'off', shuffle: false })).toEqual([
      'c',
      'd',
      'e',
    ])
  })

  it('stops at end when repeat off and fewer than count remain', () => {
    expect(upcomingQueueIds(queue, 3, { count: 3, repeatMode: 'off', shuffle: false })).toEqual([
      'e',
    ])
  })

  it('wraps with repeat all and skips current', () => {
    expect(upcomingQueueIds(queue, 3, { count: 3, repeatMode: 'all', shuffle: false })).toEqual([
      'e',
      'a',
      'b',
    ])
  })

  it('returns empty for repeat one', () => {
    expect(upcomingQueueIds(queue, 1, { count: 3, repeatMode: 'one', shuffle: false })).toEqual([])
  })

  it('still advances linearly when shuffle is on (queue already reordered)', () => {
    expect(upcomingQueueIds(queue, 0, { count: 3, repeatMode: 'off', shuffle: true })).toEqual([
      'b',
      'c',
      'd',
    ])
  })

  it('returns empty for empty queue or invalid index', () => {
    expect(upcomingQueueIds([], 0, { count: 3, repeatMode: 'off', shuffle: false })).toEqual([])
    expect(upcomingQueueIds(queue, -1, { count: 3, repeatMode: 'off', shuffle: false })).toEqual([])
    expect(upcomingQueueIds(queue, 99, { count: 3, repeatMode: 'off', shuffle: false })).toEqual([])
  })
})

describe('queue edits', () => {
  it('insertAfterCurrent inserts id immediately after current', () => {
    expect(insertAfterCurrent(['a', 'b', 'c'], 1, 'x')).toEqual(['a', 'b', 'x', 'c'])
  })

  it('insertAfterCurrent appends when current is last or index invalid', () => {
    expect(insertAfterCurrent(['a', 'b'], 1, 'x')).toEqual(['a', 'b', 'x'])
    expect(insertAfterCurrent(['a'], -1, 'x')).toEqual(['a', 'x'])
  })

  it('appendToQueue appends id at the end', () => {
    expect(appendToQueue(['a', 'b'], 'c')).toEqual(['a', 'b', 'c'])
    expect(appendToQueue([], 'a')).toEqual(['a'])
  })

  it('removeAtIndex drops the index and reports whether it was current', () => {
    expect(removeAtIndex(['a', 'b', 'c'], 1, 1)).toEqual({
      queue: ['a', 'c'],
      removedCurrent: true,
    })
    expect(removeAtIndex(['a', 'b', 'c'], 2, 0)).toEqual({
      queue: ['a', 'b'],
      removedCurrent: false,
    })
  })

  it('clearUpcoming keeps prefix through current', () => {
    expect(clearUpcoming(['a', 'b', 'c', 'd'], 1)).toEqual(['a', 'b'])
    expect(clearUpcoming(['a', 'b'], 1)).toEqual(['a', 'b'])
  })
})

describe('buildQueueFrom', () => {
  it('plays startIndex immediately, sync-emits prefix, then chunks the rest', async () => {
    const ids = Array.from({ length: 5 }, (_, i) => `t${i}`)
    const heads: string[] = []
    const chunks: string[][] = []
    const tasks: Array<() => void> = []

    buildQueueFrom(ids, 1, {
      chunkSize: 2,
      schedule: (cb) => tasks.push(cb),
      onHead: (id) => heads.push(id),
      onChunk: (c) => chunks.push(c),
    })

    expect(heads).toEqual(['t1'])
    // Prefix through startIndex is delivered synchronously.
    expect(chunks).toEqual([['t0', 't1']])

    while (tasks.length) {
      const next = tasks.shift()!
      next()
    }

    expect(chunks).toEqual([['t0', 't1'], ['t2', 't3'], ['t4']])
  })
})

describe('persist helpers', () => {
  it('round-trips player state with version field', () => {
    const state = {
      queue: ['a', 'b'],
      originalQueue: ['a', 'b'],
      currentId: 'b',
      currentIndex: 1,
      currentTime: 12.5,
      repeatMode: 'all' as const,
      shuffle: true,
    }
    const raw = serializePlayerState(state)
    expect(JSON.parse(raw).v).toBe(1)
    expect(parsePlayerState(raw)).toEqual(state)
  })

  it('accepts legacy payloads without v or originalQueue', () => {
    expect(
      parsePlayerState(
        JSON.stringify({
          queue: ['a'],
          currentId: 'a',
          currentTime: 1,
          repeatMode: 'off',
          shuffle: false,
        }),
      ),
    ).toEqual({
      queue: ['a'],
      originalQueue: ['a'],
      currentId: 'a',
      currentIndex: -1,
      currentTime: 1,
      repeatMode: 'off',
      shuffle: false,
    })
  })

  it('rejects unknown version', () => {
    expect(
      parsePlayerState(
        JSON.stringify({
          v: 99,
          queue: ['a'],
          currentId: 'a',
          currentTime: 0,
          repeatMode: 'off',
          shuffle: false,
        }),
      ),
    ).toBeNull()
  })

  it('hydrates by filtering unknown ids', () => {
    const hydrated = hydratePlayerState(
      {
        queue: ['a', 'gone', 'b'],
        originalQueue: ['a', 'gone', 'b'],
        currentId: 'gone',
        currentTime: 3,
        repeatMode: 'off',
        shuffle: false,
      },
      new Set(['a', 'b']),
    )
    expect(hydrated).toEqual({
      queue: ['a', 'b'],
      originalQueue: ['a', 'b'],
      currentId: 'a',
      currentIndex: 0,
      currentTime: 3,
      repeatMode: 'off',
      shuffle: false,
    })
  })

  it('hydrates currentIndex for duplicate ids and remaps when filtering', () => {
    const hydrated = hydratePlayerState(
      {
        queue: ['a', 'gone', 'a', 'b'],
        originalQueue: ['a', 'gone', 'a', 'b'],
        currentId: 'a',
        currentIndex: 2,
        currentTime: 1,
        repeatMode: 'off',
        shuffle: false,
      },
      new Set(['a', 'b']),
    )
    expect(hydrated).toEqual({
      queue: ['a', 'a', 'b'],
      originalQueue: ['a', 'a', 'b'],
      currentId: 'a',
      currentIndex: 1,
      currentTime: 1,
      repeatMode: 'off',
      shuffle: false,
    })
  })
})
