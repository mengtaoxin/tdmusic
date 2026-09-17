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
})
