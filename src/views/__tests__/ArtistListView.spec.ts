import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import TrackListItem from '@/components/TrackListItem.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import ArtistListView from '../ArtistListView.vue'

function makeTrack(id: string, artist: string): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    displayTitle: id,
    displayArtist: artist,
    displayAlbum: 'Album',
  }
}

type RoCallback = ResizeObserverCallback

function stubResizeObserver(heightPx: number) {
  class FakeResizeObserver {
    private readonly cb: RoCallback
    constructor(cb: RoCallback) {
      this.cb = cb
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
}

async function mountArtistList(tracks?: DisplayTrack[]) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = tracks ?? [makeTrack('t1', 'Artist One'), makeTrack('t2', 'Artist Two')]
  catalog.loading = false

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/artists', component: ArtistListView },
      { path: '/artists/:name/albums', component: { template: '<div />' } },
    ],
  })
  await router.push('/artists')
  await router.isReady()

  return mount(ArtistListView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ArtistListView', () => {
  it('lists artists as links and does not render track rows', async () => {
    stubResizeObserver(800)
    const wrapper = await mountArtistList()
    await flushPromises()

    expect(wrapper.findAllComponents(TrackListItem)).toHaveLength(0)
    expect(wrapper.find('a[href="/artists/Artist%20One/albums"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/artists/Artist%20Two/albums"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Artist One')
    expect(wrapper.text()).toContain('Artist Two')
  })

  it('only mounts a viewport-sized subset of artists for large catalogs', async () => {
    stubResizeObserver(400)
    const artistCount = 200
    const tracks = Array.from({ length: artistCount }, (_, i) => makeTrack(`t${i}`, `Artist ${i}`))
    const wrapper = await mountArtistList(tracks)
    await flushPromises()

    const rendered = wrapper.findAll('.v-list-item').length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(artistCount)
  })

  it('uses a viewport-bounded page shell with a flex list host', async () => {
    stubResizeObserver(800)
    const wrapper = await mountArtistList()
    await flushPromises()

    expect(wrapper.find('.artist-list-page').exists()).toBe(true)
    expect(wrapper.find('.list-host').exists()).toBe(true)
  })
})
