import { describe, expect, it, vi } from 'vitest'

import { createPlaybackSession, type PlaybackAudioElement } from '@/lib/playback/playbackSession'
import { createPlaybackTransport } from '@/lib/playback/playbackTransport'

type TestAudio = PlaybackAudioElement & { emit: (type: string) => void }

function noop() {
  return vi.fn<() => void>()
}

function makeAudio(): TestAudio {
  const listeners = new Map<string, Set<() => void>>()
  return {
    src: '',
    currentTime: 0,
    duration: 0,
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

describe('playbackTransport', () => {
  it('pendingPlay resumes only when the audio element is bound to the current track', async () => {
    const audio = makeAudio()
    const currentId: string | null = 't1'
    const pause = noop()

    const transport = createPlaybackTransport({
      getAudio: () => audio,
      getCurrentId: () => currentId,
      getQueueLength: () => 1,
      getSeekTo: () => null,
      getPendingPlay: () => true,
      getRepeatMode: () => 'off',
      clearSeekTo: noop(),
      pause,
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
      resolvePlayableUrl: async () => 'blob:t1',
      appendAppLog: vi.fn<(message: string) => void>(),
      scheduleEnrichTrack: vi.fn<(id: string) => void>(),
    })

    transport.onPendingPlayChange(true)
    expect(audio.play).not.toHaveBeenCalled()

    await transport.loadCurrent()
    audio.emit('loadedmetadata')
    expect(transport.isBoundToCurrent()).toBe(true)

    vi.mocked(audio.play).mockClear()
    transport.onPendingPlayChange(true)
    expect(audio.play).toHaveBeenCalled()
  })

  it('ignores pause and ended events while unbound during a track switch', () => {
    const audio = makeAudio()
    const clearPendingPlay = noop()
    const setPlaying = vi.fn<(playing: boolean) => void>()
    const onEnded = noop()
    const flushPersist = noop()

    const transport = createPlaybackTransport({
      getAudio: () => audio,
      getCurrentId: () => 't2',
      getQueueLength: () => 2,
      getSeekTo: () => null,
      getPendingPlay: () => true,
      getRepeatMode: () => 'off',
      clearSeekTo: noop(),
      pause: noop(),
      skip: noop(),
      onEnded,
      getTrack: () => undefined,
      setPlaying,
      clearPendingPlay,
      flushPersist,
      setCurrentTime: vi.fn<(time: number) => void>(),
      setDuration: vi.fn<(duration: number) => void>(),
      syncMediaSession: noop(),
      schedulePrefetch: noop(),
      resolvePlayableUrl: async () => 'blob:x',
      appendAppLog: vi.fn<(message: string) => void>(),
      scheduleEnrichTrack: vi.fn<(id: string) => void>(),
      createSession: () => ({ loadCurrent: async () => undefined }),
    })

    transport.onLoadStart('t2')
    expect(transport.isBoundToCurrent()).toBe(false)

    transport.onPause()
    expect(clearPendingPlay).not.toHaveBeenCalled()
    expect(setPlaying).not.toHaveBeenCalled()
    expect(flushPersist).not.toHaveBeenCalled()

    transport.onEnded()
    expect(onEnded).not.toHaveBeenCalled()
  })

  it('uses createPlaybackSession by default', async () => {
    const audio = makeAudio()

    const transport = createPlaybackTransport({
      getAudio: () => audio,
      getCurrentId: () => 't1',
      getQueueLength: () => 1,
      getSeekTo: () => null,
      getPendingPlay: () => false,
      getRepeatMode: () => 'off',
      clearSeekTo: noop(),
      pause: noop(),
      skip: noop(),
      onEnded: noop(),
      getTrack: () => ({ id: 't1', path: '/t1.mp3' }),
      setPlaying: vi.fn<(playing: boolean) => void>(),
      clearPendingPlay: noop(),
      flushPersist: noop(),
      setCurrentTime: vi.fn<(time: number) => void>(),
      setDuration: vi.fn<(duration: number) => void>(),
      syncMediaSession: noop(),
      schedulePrefetch: noop(),
      resolvePlayableUrl: async () => 'blob:ok',
      appendAppLog: vi.fn<(message: string) => void>(),
      scheduleEnrichTrack: vi.fn<(id: string) => void>(),
      createSession: (getAudio, player, hooks) => createPlaybackSession(getAudio, player, hooks),
    })

    await transport.loadCurrent()
    expect(transport.isBoundToCurrent()).toBe(true)
  })
})
