import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getPlayCountStats } from '../playHistory'
import { MIN_COUNTED_PLAY_DURATION_MS } from '../playHistoryStats'
import { resetPlayHistoryDbForTests, savePlayRecord } from '../playHistoryStore'

const DAY_MS = 24 * 60 * 60 * 1000

describe('getPlayCountStats', () => {
  beforeEach(async () => {
    await resetPlayHistoryDbForTests()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns counted plays for the selected window sorted high to low', async () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    await savePlayRecord({
      trackId: 'a',
      startedAt: now - DAY_MS,
      endedAt: now - DAY_MS + MIN_COUNTED_PLAY_DURATION_MS + 1,
    })
    await savePlayRecord({
      trackId: 'a',
      startedAt: now - DAY_MS + 10_000,
      endedAt: now - DAY_MS + 10_000 + MIN_COUNTED_PLAY_DURATION_MS + 1,
    })
    await savePlayRecord({
      trackId: 'b',
      startedAt: now - DAY_MS,
      endedAt: now - DAY_MS + MIN_COUNTED_PLAY_DURATION_MS + 1,
    })
    await savePlayRecord({
      trackId: 'short',
      startedAt: now - DAY_MS,
      endedAt: now - DAY_MS + 30_000,
    })

    expect(await getPlayCountStats(7)).toEqual([
      { trackId: 'a', playCount: 2 },
      { trackId: 'b', playCount: 1 },
    ])
  })
})
