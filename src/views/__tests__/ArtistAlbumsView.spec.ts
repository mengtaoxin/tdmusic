import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import CoverImg from '@/components/CoverImg.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import ArtistAlbumsView from '../ArtistAlbumsView.vue'

function makeTrack(
  id: string,
  artist: string,
  album: string,
  extras: Partial<DisplayTrack> = {},
): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    displayTitle: id,
    displayArtist: artist,
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

async function mountArtistAlbums(name: string, tracks?: DisplayTrack[]) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = tracks ?? [
    makeTrack('t1', 'Artist One', 'Album A'),
    makeTrack('t2', 'Artist One', 'Album B'),
    makeTrack('t3', 'Artist Two', 'Album A'),
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
      { path: '/artists/:name/albums', component: ArtistAlbumsView },
      { path: '/artists/:name', component: { template: '<div />' } },
      { path: '/artists/:name/albums/:album', component: { template: '<div />' } },
    ],
  })
  await router.push(`/artists/${encodeURIComponent(name)}/albums`)
  await router.isReady()

  return mount(ArtistAlbumsView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ArtistAlbumsView', () => {
  it('links to all music and each album for the artist', async () => {
    stubResizeObserver(800)
    const wrapper = await mountArtistAlbums('Artist One')
    await flushPromises()

    expect(wrapper.find('a[href="/artists/Artist%20One"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('All music by this artist')
    expect(wrapper.find('a[href="/artists/Artist%20One/albums/Album%20A"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/artists/Artist%20One/albums/Album%20B"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/artists/Artist%20One/albums/Album%20A"]').text()).toContain(
      'Album A',
    )
  })

  it('lists albums as a cover gallery like the global album list', async () => {
    stubResizeObserver(800)
    const wrapper = await mountArtistAlbums('Artist One', [
      makeTrack('t1', 'Artist One', 'Album A'),
      makeTrack('t2', 'Artist One', 'Album A', { displayCover: 'https://example.com/a.jpg' }),
      makeTrack('t3', 'Artist One', 'Album B'),
    ])
    await flushPromises()

    expect(wrapper.find('.album-gallery').exists()).toBe(true)
    expect(wrapper.findAll('.album-tile')).toHaveLength(2)

    const covers = wrapper.findAllComponents(CoverImg)
    expect(covers).toHaveLength(1)
    expect(covers[0]!.props('src')).toBe('https://example.com/a.jpg')

    const albumB = wrapper.find('a[href="/artists/Artist%20One/albums/Album%20B"]')
    expect(albumB.findComponent(CoverImg).exists()).toBe(false)
    expect(albumB.find('.album-tile__fallback').exists()).toBe(true)
  })

  it('shows not-found when the artist is missing', async () => {
    stubResizeObserver(800)
    const wrapper = await mountArtistAlbums('Missing')
    await flushPromises()

    expect(wrapper.text()).toContain('Artist not found.')
    expect(wrapper.find('a[href="/artists/Missing"]').exists()).toBe(false)
  })
})
