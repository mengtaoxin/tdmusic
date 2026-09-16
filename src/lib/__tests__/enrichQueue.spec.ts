import { beforeEach, describe, expect, it } from 'vitest'

import { clearEnrichQueue, enqueueEnrich, getEnrichQueueStatsForTests } from '../enrichQueue'

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('enrichQueue', () => {
  beforeEach(() => {
    clearEnrichQueue()
  })

  it('runs at most two tasks concurrently', async () => {
    const started: number[] = []
    const finished: number[] = []
    const releases = new Map<number, () => void>()

    const makeTask = (id: number) => () =>
      new Promise<void>((resolve) => {
        started.push(id)
        releases.set(id, () => {
          finished.push(id)
          resolve()
        })
      })

    const p1 = enqueueEnrich(makeTask(1))
    const p2 = enqueueEnrich(makeTask(2))
    const p3 = enqueueEnrich(makeTask(3))

    await flush()
    expect(started).toEqual([1, 2])
    expect(getEnrichQueueStatsForTests()).toEqual({ active: 2, pending: 1 })

    releases.get(1)!()
    await flush()
    expect(started).toEqual([1, 2, 3])
    expect(finished).toEqual([1])

    releases.get(2)!()
    releases.get(3)!()
    await Promise.all([p1, p2, p3])
    await flush()
    expect(finished.sort()).toEqual([1, 2, 3])
    expect(getEnrichQueueStatsForTests()).toEqual({ active: 0, pending: 0 })
  })

  it('clearEnrichQueue drops pending work', async () => {
    const releases = new Map<number, () => void>()
    const makeTask = (id: number) => () =>
      new Promise<void>((resolve) => {
        releases.set(id, resolve)
      })

    const p1 = enqueueEnrich(makeTask(1))
    const p2 = enqueueEnrich(makeTask(2))
    const p3 = enqueueEnrich(makeTask(3))
    await flush()

    expect(getEnrichQueueStatsForTests()).toEqual({ active: 2, pending: 1 })
    clearEnrichQueue()
    expect(getEnrichQueueStatsForTests()).toEqual({ active: 2, pending: 0 })

    await p3

    releases.get(1)!()
    releases.get(2)!()
    await Promise.all([p1, p2])
    await flush()
    expect(getEnrichQueueStatsForTests()).toEqual({ active: 0, pending: 0 })
  })
})
