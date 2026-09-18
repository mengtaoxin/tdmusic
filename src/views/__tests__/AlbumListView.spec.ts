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
import AlbumListView from '../AlbumListView.vue'

function makeTrack(id: string, album: string, extras: Partial<DisplayTrack> = {}): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    displayTitle: id,
    displayArtist: 'Artist',
    displayAlbum: album,
    ...extras,
  }
}

type RoCallback = ResizeObserverCallback

function stubResizeObserver(heightPx: number, widthPx = 400) {
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
            contentRect: { height: heightPx, width: widthPx } as DOMRectReadOnly,
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

async function mountAlbumList(tracks?: DisplayTrack[]) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = tracks ?? [
    makeTrack('t1', 'Album One'),
    makeTrack('t2', 'Album One'),
    makeTrack('t3', 'Album Two'),
  ]
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
      { path: '/albums', component: AlbumListView },
      { path: '/albums/:album', component: { template: '<div />' } },
    ],
  })
  await router.push('/albums')
  await router.isReady()

  return mount(AlbumListView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AlbumListView', () => {
  it('lists albums as links and does not render track rows', async () => {
    stubResizeObserver(800)
    const wrapper = await mountAlbumList()
    await flushPromises()

    expect(wrapper.findAllComponents(TrackListItem)).toHaveLength(0)

    const albumOne = wrapper.find('a[href="/albums/Album%20One"]')
    const albumTwo = wrapper.find('a[href="/albums/Album%20Two"]')
    expect(albumOne.exists()).toBe(true)
    expect(albumTwo.exists()).toBe(true)
    expect(albumOne.text()).toContain('Album One')
    expect(albumTwo.text()).toContain('Album Two')
  })
})
