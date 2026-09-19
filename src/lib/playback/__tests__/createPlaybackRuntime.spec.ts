import { describe, expect, it, vi } from 'vitest'

import { createPlaybackRuntime } from '../createPlaybackRuntime'
import type { PlaybackAudioElement } from '../playbackSession'

function noop() {
  return vi.fn<() => void>()
}

function makeAudio(): PlaybackAudioElement {
  return {
    src: '',
    currentTime: 0,
    duration: 0,
    loop: false,
    ended: false,
    error: null,
    load: vi.fn<() => void>(),
    play: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    pause: vi.fn<() => void>(),
    addEventListener: vi.fn<PlaybackAudioElement['addEventListener']>(),
    removeEventListener: vi.fn<PlaybackAudioElement['removeEventListener']>(),
  }
}

describe('createPlaybackRuntime', () => {
  it('loads the current track through bound ports', async () => {
    const audio = makeAudio()
    const resolvePlayableUrl = vi.fn<(path: string, id: string) => Promise<string>>(async () => {
      return 'blob:t1'
    })
    const runtime = createPlaybackRuntime(() => audio, {
      getCurrentId: () => 't1',
      getQueueLength: () => 1,
      getSeekTo: () => null,
      getPendingPlay: () => false,
      getRepeatMode: () => 'off',
      clearSeekTo: noop(),
      pause: noop(),
      skip: noop(),
      onEnded: noop(),
      getTrack: (id) => (id === 't1' ? { id: 't1', path: '/t1.mp3' } : undefined),
      setPlaying: vi.fn<(playing: boolean) => void>(),
      clearPendingPlay: noop(),
      flushPersist: noop(),
      setCurrentTime: vi.fn<(time: number) => void>(),
      setDuration: vi.fn<(duration: number) => void>(),
      syncMediaSession: noop(),
      schedulePrefetch: noop(),
      resolvePlayableUrl,
      appendAppLog: vi.fn<(message: string) => void>(),
      scheduleEnrichTrack: vi.fn<(id: string) => void>(),
    })

    await runtime.loadCurrent()
    expect(resolvePlayableUrl).toHaveBeenCalledWith('/t1.mp3', 't1')
    expect(audio.src).toBe('blob:t1')
  })
})
