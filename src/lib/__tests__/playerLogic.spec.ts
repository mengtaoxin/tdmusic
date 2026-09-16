import { describe, expect, it, vi } from 'vitest'

import {
  buildQueueFrom,
  hydratePlayerState,
  nextIndex,
  parsePlayerState,
  prevIndex,
  serializePlayerState,
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

  it('picks another index when shuffle', () => {
    const rnd = vi.fn<() => number>().mockReturnValue(0.9)
    expect(nextIndex(0, 3, { repeatMode: 'off', shuffle: true, random: rnd })).toBe(2)
  })
})

describe('buildQueueFrom', () => {
  it('emits head sync then chunks async', async () => {
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
    expect(chunks).toEqual([])

    while (tasks.length) {
      const next = tasks.shift()!
      next()
    }

    expect(chunks).toEqual([['t2', 't3'], ['t4']])
  })
})

describe('persist helpers', () => {
  it('round-trips player state with version field', () => {
    const state = {
      queue: ['a', 'b'],
      currentId: 'b',
      currentTime: 12.5,
      repeatMode: 'all' as const,
      shuffle: true,
    }
    const raw = serializePlayerState(state)
    expect(JSON.parse(raw).v).toBe(1)
    expect(parsePlayerState(raw)).toEqual(state)
  })

  it('accepts legacy payloads without v', () => {
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
      currentId: 'a',
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
        currentId: 'gone',
        currentTime: 3,
        repeatMode: 'off',
        shuffle: false,
      },
      new Set(['a', 'b']),
    )
    expect(hydrated).toEqual({
      queue: ['a', 'b'],
      currentId: 'a',
      currentTime: 3,
      repeatMode: 'off',
      shuffle: false,
    })
  })
})
