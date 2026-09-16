import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'

import AudioHost from '../AudioHost.vue'
import { listAppLogs, resetAppLogDbForTests } from '@/lib/appLogStore'
import * as prefetchUpcomingMod from '@/lib/prefetchUpcoming'
import * as resolvePlayableUrlMod from '@/lib/resolvePlayableUrl'
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

  it('clears pendingPlay on external pause so toggle play can resume audio', async () => {
    const pinia = createPinia()
    const wrapper = mount(AudioHost, {
      global: { plugins: [pinia] },
    })
    const player = usePlayerStore(pinia)
    const audio = wrapper.get('[data-testid="global-audio"]').element as HTMLAudioElement
    const playSpy = vi.spyOn(audio, 'play').mockResolvedValue(undefined)

    player.currentId = 'smile-in-the-wind'
    player.play()
    await nextTick()
    await flushPromises()
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
})