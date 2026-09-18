import { beforeEach, describe, expect, it } from 'vitest'

import {
  getDownloadLimiterStatsForTests,
  resetDownloadLimiterForTests,
  withAudioDownloadSlot,
} from '../downloadLimiter'

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('downloadLimiter', () => {
  beforeEach(() => {
    resetDownloadLimiterForTests()
  })

  it('runs at most three tasks concurrently', async () => {
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

    const p1 = withAudioDownloadSlot(makeTask(1))
    const p2 = withAudioDownloadSlot(makeTask(2))
    const p3 = withAudioDownloadSlot(makeTask(3))
    const p4 = withAudioDownloadSlot(makeTask(4))

    await flush()
    expect(started).toEqual([1, 2, 3])
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 3, pending: 1 })

    releases.get(1)!()
    await flush()
    expect(started).toEqual([1, 2, 3, 4])
    expect(finished).toEqual([1])

    releases.get(2)!()
    releases.get(3)!()
    releases.get(4)!()
    await Promise.all([p1, p2, p3, p4])
    await flush()
    expect(finished.sort()).toEqual([1, 2, 3, 4])
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 0, pending: 0 })
  })

  it('starts a waiting high-priority task before a waiting normal one', async () => {
    const started: number[] = []
    const releases = new Map<number, () => void>()

    const makeTask = (id: number) => () =>
      new Promise<void>((resolve) => {
        started.push(id)
        releases.set(id, resolve)
      })

    const p1 = withAudioDownloadSlot(makeTask(1))
    const p2 = withAudioDownloadSlot(makeTask(2))
    const p3 = withAudioDownloadSlot(makeTask(3))
    const pNormal = withAudioDownloadSlot(makeTask(4), 'normal')
    const pHigh = withAudioDownloadSlot(makeTask(5), 'high')

    await flush()
    expect(started).toEqual([1, 2, 3])
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 3, pending: 2 })

    releases.get(1)!()
    await flush()
    expect(started).toEqual([1, 2, 3, 5])

    releases.get(2)!()
    await flush()
    expect(started).toEqual([1, 2, 3, 5, 4])

    releases.get(3)!()
    releases.get(5)!()
    releases.get(4)!()
    await Promise.all([p1, p2, p3, pNormal, pHigh])
  })

  it('starts a late high-priority waiter before several waiting normals', async () => {
    const started: number[] = []
    const releases = new Map<number, () => void>()

    const makeTask = (id: number) => () =>
      new Promise<void>((resolve) => {
        started.push(id)
        releases.set(id, resolve)
      })

    const actives = [1, 2, 3].map((id) => withAudioDownloadSlot(makeTask(id)))
    const normals = [4, 5, 6].map((id) => withAudioDownloadSlot(makeTask(id), 'normal'))
    await flush()
    expect(started).toEqual([1, 2, 3])

    const pHigh = withAudioDownloadSlot(makeTask(99), 'high')
    await flush()
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 3, pending: 4 })

    releases.get(1)!()
    await flush()
    expect(started).toEqual([1, 2, 3, 99])

    for (const id of [2, 3, 99]) {
      releases.get(id)!()
      await flush()
    }
    expect(started).toEqual([1, 2, 3, 99, 4, 5, 6])
    for (const id of [4, 5, 6]) releases.get(id)!()
    await Promise.all([...actives, ...normals, pHigh])
  })

  it('keeps FIFO order among same-priority waiters', async () => {
    const started: number[] = []
    const releases = new Map<number, () => void>()

    const makeTask = (id: number) => () =>
      new Promise<void>((resolve) => {
        started.push(id)
        releases.set(id, resolve)
      })

    const actives = [1, 2, 3].map((id) => withAudioDownloadSlot(makeTask(id), 'high'))
    const highs = [4, 5].map((id) => withAudioDownloadSlot(makeTask(id), 'high'))
    await flush()
    expect(started).toEqual([1, 2, 3])

    releases.get(1)!()
    await flush()
    expect(started).toEqual([1, 2, 3, 4])

    releases.get(2)!()
    await flush()
    expect(started).toEqual([1, 2, 3, 4, 5])

    for (const id of [3, 4, 5]) releases.get(id)!()
    await Promise.all([...actives, ...highs])
  })
})
