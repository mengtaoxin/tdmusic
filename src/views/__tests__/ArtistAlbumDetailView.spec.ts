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
import ArtistAlbumDetailView from '../ArtistAlbumDetailView.vue'

function makeTrack(id: string, artist: string, album: string, title: string): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    displayTitle: title,
    displayArtist: artist,
    displayAlbum: album,
  }
}

async function mountArtistAlbum(artist: string, album: string) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = [
    makeTrack('t1', 'Artist One', 'Album A', 'Song A'),
    makeTrack('t2', 'Artist One', 'Album A', 'Song B'),
    makeTrack('t3', 'Artist One', 'Album B', 'Other'),
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
    routes: [{ path: '/artists/:name/albums/:album', component: ArtistAlbumDetailView }],
  })
  await router.push(`/artists/${encodeURIComponent(artist)}/albums/${encodeURIComponent(album)}`)
  await router.isReady()

  return mount(ArtistAlbumDetailView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
}

describe('ArtistAlbumDetailView', () => {
  it('lists tracks for the artist album', async () => {
    const wrapper = await mountArtistAlbum('Artist One', 'Album A')
    await flushPromises()

    const items = wrapper.findAllComponents(TrackListItem)
    expect(items).toHaveLength(2)
    expect(items[0]!.props('track').id).toBe('t1')
    expect(items[1]!.props('track').id).toBe('t2')
  })

  it('shows not-found when the artist is missing', async () => {
    const wrapper = await mountArtistAlbum('Missing', 'Album A')
    await flushPromises()

    expect(wrapper.text()).toContain('Artist not found.')
    expect(wrapper.findAllComponents(TrackListItem)).toHaveLength(0)
  })

  it('shows not-found when the album is missing', async () => {
    const wrapper = await mountArtistAlbum('Artist One', 'Missing')
    await flushPromises()

    expect(wrapper.text()).toContain('Album not found.')
    expect(wrapper.findAllComponents(TrackListItem)).toHaveLength(0)
  })
})
