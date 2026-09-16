import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'
import NowPlayingView from '../NowPlayingView.vue'

function makeTrack(): DisplayTrack {
  return {
    id: 't1',
    path: '/music/t1.mp3',
    displayTitle: 'Song One',
    displayArtist: 'Artist One',
    displayAlbum: 'Album One',
  }
}

async function mountNowPlaying() {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  const track = makeTrack()
  catalog.tracks = [track]
  catalog.loading = false

  const player = usePlayerStore(pinia)
  player.queue = [track.id]
  player.currentId = track.id

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
})
