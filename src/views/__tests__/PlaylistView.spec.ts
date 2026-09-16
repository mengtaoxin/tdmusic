import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import { useCatalogStore } from '@/stores/catalog'
import PlaylistView from '../PlaylistView.vue'

async function mountPlaylistView(playlists: { title: string; trackIds: string[] }[]) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = [
    {
      id: 't1',
      path: '/music/t1.mp3',
      displayTitle: 'Track 1',
      displayArtist: 'Artist',
      displayAlbum: 'Album',
    },
  ]
  catalog.playlists = playlists
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
      { path: '/playlists', component: PlaylistView },
      { path: '/playlists/:name', component: { template: '<div />' } },
      { path: '/config-guides', component: { template: '<div />' } },
    ],
  })
  await router.push('/playlists')
  await router.isReady()

  return mount(PlaylistView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
}

describe('PlaylistView', () => {
  it('shows a clear empty state when there are no playlists', async () => {
    const wrapper = await mountPlaylistView([])
    await flushPromises()

    expect(wrapper.text()).not.toContain('From configs.json playlists')
    expect(wrapper.text()).toContain('No playlists yet.')
    expect(wrapper.find('a[href="/config-guides"]').exists()).toBe(true)
  })

  it('lists playlists without the configs.json subtitle', async () => {
    const wrapper = await mountPlaylistView([{ title: 'My Playlist1', trackIds: ['t1'] }])
    await flushPromises()

    expect(wrapper.text()).not.toContain('From configs.json playlists')
    expect(wrapper.find('a[href="/playlists/My%20Playlist1"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('My Playlist1')
  })
})
