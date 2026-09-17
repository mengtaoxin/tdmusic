import { describe, expect, it, vi } from 'vitest'

import {
  createPlaybackSession,
  formatDownloadFailureLog,
  type PlaybackAudioElement,
} from '@/lib/playbackSession'

type TestAudio = PlaybackAudioElement & { emit: (type: string) => void }

function makeAudio(): TestAudio {
  const listeners = new Map<string, Set<() => void>>()
  return {
    src: '',
    currentTime: 0,
    loop: false,
    ended: false,
    load: vi.fn<() => void>(),
    play: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    pause: vi.fn<() => void>(),
    addEventListener: (type: string, handler: EventListener) => {
      const set = listeners.get(type) ?? new Set()
      set.add(handler as () => void)
      listeners.set(type, set)
    },
    removeEventListener: (type: string, handler: EventListener) => {
      listeners.get(type)?.delete(handler as () => void)
    },
    emit(type: string) {
      for (const handler of listeners.get(type) ?? []) handler()
    },
  }
}

describe('playbackSession', () => {
  it('formatDownloadFailureLog includes track id, path, and error detail', () => {
    const message = formatDownloadFailureLog(
      { id: 'bad', path: 'https://example.com/bad.mp3' },
      new Error('downloadFailed:404'),
    )
    expect(message).toContain('bad')
    expect(message).toContain('https://example.com/bad.mp3')
    expect(message).toMatch(/downloadFailed:404/)
  })

  it('loadCurrent resolves URL, sets audio src, enriches, and prefetches', async () => {
    const audio = makeAudio()
    const resolvePlayableUrl = vi
      .fn<(path: string, id: string) => Promise<string>>()
      .mockResolvedValue('blob:good')
    const scheduleEnrichTrack = vi.fn<(id: string) => void>()
    const schedulePrefetch = vi.fn<() => void>()
    const appendAppLog = vi.fn<(message: string) => void>()
    const onTrackResolved = vi.fn<(id: string) => void>()
    const skip = vi.fn<() => void>()
    const pause = vi.fn<() => void>()
    let seekTo: number | null = 12
    const pendingPlay = true

    const session = createPlaybackSession(
      () => audio,
      {
        getCurrentId: () => 't1',
        getQueueLength: () => 1,
        getSeekTo: () => seekTo,
        getPendingPlay: () => pendingPlay,
        clearSeekTo: () => {
          seekTo = null
        },
        pause,
        skip,
        getTrack: (id) =>
          id === 't1' ? { id: 't1', path: 'https://example.com/t1.mp3' } : undefined,
      },
      { resolvePlayableUrl, appendAppLog, scheduleEnrichTrack, schedulePrefetch, onTrackResolved },
    )

    await session.loadCurrent()
    expect(resolvePlayableUrl).toHaveBeenCalledWith('https://example.com/t1.mp3', 't1')
    expect(onTrackResolved).toHaveBeenCalledWith('t1')
    expect(audio.src).toBe('blob:good')
    expect(audio.load).toHaveBeenCalledOnce()
    expect(scheduleEnrichTrack).toHaveBeenCalledWith('t1')
    expect(schedulePrefetch).toHaveBeenCalledOnce()
    expect(skip).not.toHaveBeenCalled()
    expect(appendAppLog).not.toHaveBeenCalled()

    audio.emit('loadedmetadata')
    expect(audio.currentTime).toBe(12)
    expect(seekTo).toBeNull()
    expect(audio.play).toHaveBeenCalledOnce()
  })

  it('loadCurrent skips on download failure and pauses after a full queue of failures', async () => {
    const audio = makeAudio()
    const resolvePlayableUrl = vi
      .fn<(path: string, id: string) => Promise<string>>()
      .mockRejectedValue(new Error('boom'))
    const appendAppLog = vi.fn<(message: string) => void>()
    const skip = vi.fn<() => void>()
    const pause = vi.fn<() => void>()
    let currentId: string | null = 'a'

    const session = createPlaybackSession(
      () => audio,
      {
        getCurrentId: () => currentId,
        getQueueLength: () => 2,
        getSeekTo: () => null,
        getPendingPlay: () => true,
        clearSeekTo: () => {},
        pause,
        skip: () => {
          skip()
          currentId = 'b'
        },
        getTrack: (id) => ({ id, path: `https://example.com/${id}.mp3` }),
      },
      {
        resolvePlayableUrl,
        appendAppLog,
        scheduleEnrichTrack: vi.fn<(id: string) => void>(),
        schedulePrefetch: vi.fn<() => void>(),
      },
    )

    await session.loadCurrent()
    expect(appendAppLog).toHaveBeenCalledOnce()
    expect(skip).toHaveBeenCalledOnce()
    expect(pause).not.toHaveBeenCalled()

    await session.loadCurrent()
    expect(appendAppLog).toHaveBeenCalledTimes(2)
    expect(skip).toHaveBeenCalledOnce()
    expect(pause).toHaveBeenCalledOnce()
  })
})
