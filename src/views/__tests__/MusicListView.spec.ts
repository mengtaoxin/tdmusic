import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'

import TrackListItem from '@/components/TrackListItem.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import MusicListView from '../MusicListView.vue'

function makeTrack(index: number): DisplayTrack {
  return {
    id: `track-${index}`,
    path: `/music/track-${index}.mp3`,
    displayTitle: `Track ${index}`,
    displayArtist: 'Artist',
    displayAlbum: 'Album',
  }
}

type RoCallback = ResizeObserverCallback

function stubResizeObserver(heightPx: number) {
  const observers: RoCallback[] = []
  class FakeResizeObserver {
    private readonly cb: RoCallback
    constructor(cb: RoCallback) {
      this.cb = cb
      observers.push(cb)
    }
    observe(target: Element) {
      this.cb(
        [
          {
            target,
            contentRect: { height: heightPx } as DOMRectReadOnly,
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          } as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      )
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  return observers
}

function mountMusicList(trackCount: number) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = Array.from({ length: trackCount }, (_, i) => makeTrack(i))
  catalog.loading = false

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })

  return mount(MusicListView, {
    global: { plugins: [pinia, vuetify, i18n] },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('MusicListView', () => {
  it('only mounts a viewport-sized subset of tracks for large catalogs', async () => {
    stubResizeObserver(400)
    const trackCount = 200
    const wrapper = mountMusicList(trackCount)
    await flushPromises()

    const rendered = wrapper.findAllComponents(TrackListItem).length

    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(trackCount)
  })

  it('uses a viewport-bounded page shell with a flex list host', async () => {
    stubResizeObserver(800)
    const wrapper = mountMusicList(200)
    await flushPromises()

    expect(wrapper.find('.music-list-page').exists()).toBe(true)
    expect(wrapper.find('.list-host').exists()).toBe(true)
  })

  it('hides list overflow when the catalog fits the host', async () => {
    stubResizeObserver(800)
    const wrapper = mountMusicList(3)
    await flushPromises()

    expect(wrapper.find('.track-list').classes()).toContain('track-list--flush')
  })

  it('keeps list overflow when the catalog exceeds the host', async () => {
    stubResizeObserver(400)
    const wrapper = mountMusicList(200)
    await flushPromises()

    expect(wrapper.find('.track-list').classes()).not.toContain('track-list--flush')
  })
})
