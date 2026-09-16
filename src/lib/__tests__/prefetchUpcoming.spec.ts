import { describe, expect, it, vi } from 'vitest'

import * as musicCache from '../musicCache'
import { prefetchUpcoming } from '../prefetchUpcoming'

describe('prefetchUpcoming', () => {
  it('calls ensureTrackCached for selected upcoming playable tracks', async () => {
    const ensure = vi.spyOn(musicCache, 'ensureTrackCached').mockResolvedValue(undefined)
    const resolveTrack = (id: string) => {
      const paths: Record<string, string> = {
        b: 'https://example.com/b.mp3',
        c: '/c.mp3',
        d: 'https://example.com/d.mp3',
      }
      const path = paths[id]
      return path ? { id, path } : undefined
    }

    await prefetchUpcoming(['a', 'b', 'c', 'd'], 0, {
      count: 3,
      repeatMode: 'off',
      shuffle: false,
      resolveTrack,
    })

    expect(ensure).toHaveBeenCalledTimes(3)
    expect(ensure).toHaveBeenCalledWith('https://example.com/b.mp3', 'b')
    expect(ensure).toHaveBeenCalledWith('/c.mp3', 'c')
    expect(ensure).toHaveBeenCalledWith('https://example.com/d.mp3', 'd')
  })

  it('skips missing tracks and non-playable paths', async () => {
    const ensure = vi.spyOn(musicCache, 'ensureTrackCached').mockResolvedValue(undefined)
    const resolveTrack = (id: string) => {
      if (id === 'b') return { id, path: 'relative.mp3' }
      if (id === 'c') return undefined
      if (id === 'd') return { id, path: 'https://example.com/d.mp3' }
      return undefined
    }

    await prefetchUpcoming(['a', 'b', 'c', 'd'], 0, {
      count: 3,
      repeatMode: 'off',
      shuffle: false,
      resolveTrack,
    })

    expect(ensure).toHaveBeenCalledTimes(1)
    expect(ensure).toHaveBeenCalledWith('https://example.com/d.mp3', 'd')
  })

  it('swallows ensureTrackCached failures', async () => {
    vi.spyOn(musicCache, 'ensureTrackCached').mockRejectedValue(new Error('network'))
    await expect(
      prefetchUpcoming(['a', 'b'], 0, {
        count: 3,
        repeatMode: 'off',
        shuffle: false,
        resolveTrack: (id) =>
          id === 'b' ? { id, path: 'https://example.com/b.mp3' } : undefined,
      }),
    ).resolves.toBeUndefined()
  })

  it('does nothing for repeat one', async () => {
    const ensure = vi.spyOn(musicCache, 'ensureTrackCached').mockResolvedValue(undefined)
    await prefetchUpcoming(['a', 'b', 'c'], 0, {
      count: 3,
      repeatMode: 'one',
      shuffle: false,
      resolveTrack: (id) => ({ id, path: `https://example.com/${id}.mp3` }),
    })
    expect(ensure).not.toHaveBeenCalled()
  })
})
