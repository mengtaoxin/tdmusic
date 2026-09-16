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
import AlbumListView from '../AlbumListView.vue'

function makeTrack(id: string, album: string): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    displayTitle: id,
    displayArtist: 'Artist',
    displayAlbum: album,
  }
}

async function mountAlbumList() {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = [
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

describe('AlbumListView', () => {
  it('lists albums as links and does not render track rows', async () => {
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
