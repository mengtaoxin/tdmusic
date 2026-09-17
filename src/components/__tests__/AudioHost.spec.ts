import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'

import AudioHost from '../AudioHost.vue'
import { listAppLogs, resetAppLogDbForTests } from '@/lib/appLogStore'
import * as prefetchUpcomingMod from '@/lib/playback/prefetchUpcoming'
import * as resolvePlayableUrlMod from '@/lib/playback/resolvePlayableUrl'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

describe('AudioHost', () => {
  beforeEach(async () => {
    await resetAppLogDbForTests()
    vi.restoreAllMocks()
  })

  it('enables native loop when repeat mode is one so the track continues after ending', async () => {
    const pinia = createPinia()
    const wrapper = mount(AudioHost, {
      global: { plugins: [pinia] },
    })
    const player = usePlayerStore(pinia)
    const audio = wrapper.get('[data-testid="global-audio"]').element as HTMLAudioElement

    expect(audio.loop).toBe(false)

    player.repeatMode = 'one'
    await nextTick()
    await flushPromises()
    expect(audio.loop).toBe(true)

    player.repeatMode = 'all'
    await nextTick()
    await flushPromises()
    expect(audio.loop).toBe(false)

    player.repeatMode = 'off'
    await nextTick()
    await flushPromises()
    expect(audio.loop).toBe(false)

    wrapper.unmount()
  })

  it('does not play the previous track src when switching queue items after pause', async () => {
    const pinia = createPinia()
    const catalog = useCatalogStore(pinia)
    catalog.tracks = [
      {
        id: 't1',
        path: 'https://example.com/t1.mp3',
        displayTitle: 'One',
        displayArtist: 'A',
        displayAlbum: 'B',
      },
      {
        id: 't2',
        path: 'https://example.com/t2.mp3',
        displayTitle: 'Two',
        displayArtist: 'A',
        displayAlbum: 'B',
      },
    ]

    let resolveT2: ((url: string) => void) | null = null
    vi.spyOn(resolvePlayableUrlMod, 'resolvePlayableUrl').mockImplementation(async (_path, id) => {
      if (id === 't1') return 'blob:t1'
      return new Promise<string>((resolve) => {
        resolveT2 = resolve
      })
    })
    vi.spyOn(prefetchUpcomingMod, 'prefetchUpcoming').mockResolvedValue(undefined)

    const wrapper = mount(AudioHost, {
      global: { plugins: [pinia] },
    })
    const player = usePlayerStore(pinia)
    const audio = wrapper.get('[data-testid="global-audio"]').element as HTMLAudioElement
    const playSpy = vi.spyOn(audio, 'play').mockResolvedValue(undefined)
    vi.spyOn(audio, 'load').mockImplementation(() => undefined)

    // Load and pause on t1 (simulates long idle / OS interrupt).
    player.queue = ['t1', 't2']
    player.originalQueue = ['t1', 't2']
    player.currentId = 't1'
    player.currentIndex = 0
    player.pendingPlay = true
    player.playing = true
    player.loadToken += 1
    await nextTick()
    await flushPromises()
    await flushPromises()
    audio.dispatchEvent(new Event('loadedmetadata'))
    await nextTick()
    expect(audio.src).toContain('blob:t1')

    audio.dispatchEvent(new Event('pause'))
    await nextTick()
    playSpy.mockClear()

    // Click another queue item while paused; resolve for t2 is still pending.
    player.goToIndex(1, true)
    await nextTick()
    await flushPromises()

    // Must not resume the still-loaded previous track while the new one loads.
    expect(playSpy).not.toHaveBeenCalled()
    expect(audio.src).toContain('blob:t1')

    expect(resolveT2).not.toBeNull()
    resolveT2!('blob:t2')
    await flushPromises()
    await flushPromises()
    audio.dispatchEvent(new Event('loadedmetadata'))
    await nextTick()

    expect(audio.src).toContain('blob:t2')
    expect(playSpy).toHaveBeenCalled()
    expect(player.currentId).toBe('t2')

    wrapper.unmount()
  })

  it('clears pendingPlay on external pause so toggle play can resume audio', async () => {
    const pinia = createPinia()
    const catalog = useCatalogStore(pinia)
    catalog.tracks = [
      {
        id: 'smile-in-the-wind',
        path: 'https://example.com/smile.mp3',
        displayTitle: 'Smile',
        displayArtist: 'A',
        displayAlbum: 'B',
      },
    ]
    vi.spyOn(resolvePlayableUrlMod, 'resolvePlayableUrl').mockResolvedValue('blob:smile')
    vi.spyOn(prefetchUpcomingMod, 'prefetchUpcoming').mockResolvedValue(undefined)

    const wrapper = mount(AudioHost, {
      global: { plugins: [pinia] },
    })
    const player = usePlayerStore(pinia)
    const audio = wrapper.get('[data-testid="global-audio"]').element as HTMLAudioElement
    const playSpy = vi.spyOn(audio, 'play').mockResolvedValue(undefined)
    vi.spyOn(audio, 'load').mockImplementation(() => undefined)

    player.queue = ['smile-in-the-wind']
    player.currentId = 'smile-in-the-wind'
    player.currentIndex = 0
    player.pendingPlay = true
    player.playing = true
    player.loadToken += 1
    await nextTick()
    await flushPromises()
    await flushPromises()
    audio.dispatchEvent(new Event('loadedmetadata'))
    await nextTick()
    expect(player.pendingPlay).toBe(true)
    expect(playSpy).toHaveBeenCalled()
    playSpy.mockClear()

    // Other app / OS interrupts: element pauses and fires pause without store.pause().
    audio.dispatchEvent(new Event('pause'))
    await nextTick()
    await flushPromises()

    expect(player.playing).toBe(false)
    expect(player.pendingPlay).toBe(false)

    player.togglePlay()
    await nextTick()
    await flushPromises()
    expect(playSpy).toHaveBeenCalled()
    expect(player.playing).toBe(true)

    wrapper.unmount()
  })

  it('skips a track when download fails, logs the failure, and loads the next track', async () => {
    const pinia = createPinia()
    const catalog = useCatalogStore(pinia)
    const tracks: DisplayTrack[] = [
      {
        id: 'bad',
        path: 'https://example.com/bad.mp3',
        displayTitle: 'Bad',
        displayArtist: 'Artist',
        displayAlbum: 'Album',
      },
      {
        id: 'good',
        path: 'https://example.com/good.mp3',
        displayTitle: 'Good',
        displayArtist: 'Artist',
        displayAlbum: 'Album',
      },
    ]
    catalog.tracks = tracks

    const resolveSpy = vi
      .spyOn(resolvePlayableUrlMod, 'resolvePlayableUrl')
      .mockImplementation(async (_path, id) => {
        if (id === 'bad') throw new Error('downloadFailed:404')
        return 'blob:good'
      })
    vi.spyOn(prefetchUpcomingMod, 'prefetchUpcoming').mockResolvedValue(undefined)

    const wrapper = mount(AudioHost, {
      global: { plugins: [pinia] },
    })
    const player = usePlayerStore(pinia)
    const audio = wrapper.get('[data-testid="global-audio"]').element as HTMLAudioElement
    vi.spyOn(audio, 'play').mockResolvedValue(undefined)
    vi.spyOn(audio, 'load').mockImplementation(() => undefined)

    player.queue = ['bad', 'good']
    player.currentId = 'bad'
    player.currentIndex = 0
    player.pendingPlay = true
    player.playing = true
    player.loadToken += 1
    await nextTick()
    await flushPromises()
    await flushPromises()

    expect(resolveSpy).toHaveBeenCalled()
    expect(player.currentId).toBe('good')
    expect(player.pendingPlay).toBe(true)

    const logs = await listAppLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0]!.message).toContain('bad')
    expect(logs[0]!.message).toContain('https://example.com/bad.mp3')
    expect(logs[0]!.message).toMatch(/download|fail/i)

    wrapper.unmount()
  })

  it('registers Media Session metadata and action handlers for the current track', async () => {
    const setActionHandler =
      vi.fn<(action: MediaSessionAction, handler: MediaSessionActionHandler | null) => void>()
    const setPositionState = vi.fn<(state?: MediaPositionState) => void>()
    const mediaSession = {
      metadata: null as MediaMetadata | null,
      playbackState: 'none' as MediaSessionPlaybackState,
      setActionHandler,
      setPositionState,
    }
    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: mediaSession,
    })
    vi.stubGlobal(
      'MediaMetadata',
      class {
        title: string
        artist: string
        album: string
        artwork: MediaImage[]
        constructor(init: MediaMetadataInit) {
          this.title = init.title ?? ''
          this.artist = init.artist ?? ''
          this.album = init.album ?? ''
          this.artwork = init.artwork ?? []
        }
      },
    )

    const pinia = createPinia()
    const catalog = useCatalogStore(pinia)
    catalog.tracks = [
      {
        id: 't1',
        path: '/music/t1.mp3',
        displayTitle: 'Song One',
        displayArtist: 'Artist One',
        displayAlbum: 'Album One',
        displayCover: 'blob:cover',
      },
    ]

    vi.spyOn(resolvePlayableUrlMod, 'resolvePlayableUrl').mockResolvedValue('blob:audio')
    vi.spyOn(prefetchUpcomingMod, 'prefetchUpcoming').mockResolvedValue(undefined)

    const wrapper = mount(AudioHost, {
      global: { plugins: [pinia] },
    })
    const player = usePlayerStore(pinia)
    const audio = wrapper.get('[data-testid="global-audio"]').element as HTMLAudioElement
    vi.spyOn(audio, 'play').mockResolvedValue(undefined)
    vi.spyOn(audio, 'load').mockImplementation(() => undefined)

    player.queue = ['t1']
    player.currentId = 't1'
    player.currentIndex = 0
    player.pendingPlay = true
    player.playing = true
    player.duration = 120
    player.loadToken += 1
    await nextTick()
    await flushPromises()
    await flushPromises()

    expect(mediaSession.metadata).toBeTruthy()
    expect(mediaSession.metadata?.title).toBe('Song One')
    expect(mediaSession.metadata?.artist).toBe('Artist One')
    expect(mediaSession.metadata?.album).toBe('Album One')
    expect(setActionHandler).toHaveBeenCalledWith('play', expect.any(Function))
    expect(setActionHandler).toHaveBeenCalledWith('pause', expect.any(Function))
    expect(setActionHandler).toHaveBeenCalledWith('previoustrack', expect.any(Function))
    expect(setActionHandler).toHaveBeenCalledWith('nexttrack', expect.any(Function))
    expect(setActionHandler).toHaveBeenCalledWith('seekto', expect.any(Function))

    const playHandler = setActionHandler.mock.calls.find((c) => c[0] === 'play')?.[1] as () => void
    const nextHandler = setActionHandler.mock.calls.find(
      (c) => c[0] === 'nexttrack',
    )?.[1] as () => void
    player.pause()
    playHandler()
    expect(player.playing).toBe(true)

    player.queue = ['t1', 't2']
    catalog.tracks.push({
      id: 't2',
      path: '/t2.mp3',
      displayTitle: 'Two',
      displayArtist: 'A',
      displayAlbum: 'B',
    })
    nextHandler()
    expect(player.currentId).toBe('t2')

    expect(mediaSession.playbackState).toBe('playing')
    expect(setPositionState).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 120,
        playbackRate: 1,
      }),
    )

    wrapper.unmount()
  })

  it('updates Media Session position state on timeupdate', async () => {
    const setPositionState = vi.fn<(state?: MediaPositionState) => void>()
    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: {
        metadata: null,
        playbackState: 'none',
        setActionHandler:
          vi.fn<(action: MediaSessionAction, handler: MediaSessionActionHandler | null) => void>(),
        setPositionState,
      },
    })
    vi.stubGlobal(
      'MediaMetadata',
      class {
        constructor(init: MediaMetadataInit) {
          Object.assign(this, init)
        }
      },
    )

    const pinia = createPinia()
    const catalog = useCatalogStore(pinia)
    catalog.tracks = [
      {
        id: 't1',
        path: '/music/t1.mp3',
        displayTitle: 'Song One',
        displayArtist: 'Artist One',
        displayAlbum: 'Album One',
      },
    ]

    const wrapper = mount(AudioHost, {
      global: { plugins: [pinia] },
    })
    const player = usePlayerStore(pinia)
    const audio = wrapper.get('[data-testid="global-audio"]').element as HTMLAudioElement

    player.queue = ['t1']
    player.currentId = 't1'
    player.currentIndex = 0
    player.playing = true
    player.duration = 100
    player.currentTime = 0
    await nextTick()

    setPositionState.mockClear()
    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 42 })
    Object.defineProperty(audio, 'duration', { configurable: true, value: 100 })
    audio.dispatchEvent(new Event('timeupdate'))
    await nextTick()

    expect(setPositionState).toHaveBeenCalledWith({
      duration: 100,
      playbackRate: 1,
      position: 42,
    })

    wrapper.unmount()
  })

  it('schedules enrich for prefetched tracks via onTrackCached', async () => {
    const pinia = createPinia()
    const catalog = useCatalogStore(pinia)
    catalog.tracks = [
      {
        id: 't1',
        path: 'https://example.com/t1.mp3',
        displayTitle: 'One',
        displayArtist: 'A',
        displayAlbum: 'B',
      },
      {
        id: 't2',
        path: 'https://example.com/t2.mp3',
        displayTitle: 'Two',
        displayArtist: 'A',
        displayAlbum: 'B',
      },
    ]

    vi.spyOn(resolvePlayableUrlMod, 'resolvePlayableUrl').mockResolvedValue('blob:audio')
    const prefetchSpy = vi
      .spyOn(prefetchUpcomingMod, 'prefetchUpcoming')
      .mockResolvedValue(undefined)
    const enrichSpy = vi.spyOn(catalog, 'scheduleEnrichTrack').mockImplementation(() => {})

    const wrapper = mount(AudioHost, {
      global: { plugins: [pinia] },
    })
    const player = usePlayerStore(pinia)
    const audio = wrapper.get('[data-testid="global-audio"]').element as HTMLAudioElement
    vi.spyOn(audio, 'play').mockResolvedValue(undefined)
    vi.spyOn(audio, 'load').mockImplementation(() => undefined)

    player.queue = ['t1', 't2']
    player.currentId = 't1'
    player.currentIndex = 0
    player.pendingPlay = true
    player.loadToken += 1
    await nextTick()
    await flushPromises()
    await flushPromises()

    expect(prefetchSpy).toHaveBeenCalled()
    const lastCall = prefetchSpy.mock.calls[prefetchSpy.mock.calls.length - 1]
    const options = lastCall?.[2]
    expect(options?.onTrackCached).toEqual(expect.any(Function))
    options!.onTrackCached!('t2')
    expect(enrichSpy).toHaveBeenCalledWith('t2')

    wrapper.unmount()
  })
})
