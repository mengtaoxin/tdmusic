import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import TrackListItem from '@/components/TrackListItem.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'
import NowPlayingView from '../NowPlayingView.vue'

function makeTrack(index = 1): DisplayTrack {
  return {
    id: `t${index}`,
    path: `/music/t${index}.mp3`,
    displayTitle: index === 1 ? 'Song One' : `Song ${index}`,
    displayArtist: 'Artist One',
    displayAlbum: 'Album One',
  }
}

async function mountNowPlaying(trackCount = 1) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  const tracks = Array.from({ length: trackCount }, (_, i) => makeTrack(i + 1))
  catalog.tracks = tracks
  catalog.loading = false

  const player = usePlayerStore(pinia)
  player.queue = tracks.map((track) => track.id)
  player.currentId = tracks[0]!.id

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/now-playing', component: NowPlayingView },
      { path: '/artists/:name/albums', component: { template: '<div />' } },
      { path: '/artists/:name/albums/:album', component: { template: '<div />' } },
    ],
  })
  await router.push('/now-playing')
  await router.isReady()

  return mount(NowPlayingView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
}

describe('NowPlayingView', () => {
  it('links the current artist and album to their catalog pages', async () => {
    const wrapper = await mountNowPlaying()
    await flushPromises()

    const artistLink = wrapper.find('a[href="/artists/Artist%20One/albums"]')
    const albumLink = wrapper.find('a[href="/artists/Artist%20One/albums/Album%20One"]')

    expect(artistLink.exists()).toBe(true)
    expect(artistLink.text()).toBe('Artist One')
    expect(albumLink.exists()).toBe(true)
    expect(albumLink.text()).toBe('Album One')
  })

  it('only mounts a viewport-sized subset of queue tracks for large queues', async () => {
    const trackCount = 200
    const wrapper = await mountNowPlaying(trackCount)
    await flushPromises()

    const rendered = wrapper.findAllComponents(TrackListItem).length

    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(trackCount)
  })
})
