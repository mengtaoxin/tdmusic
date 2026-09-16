import { describe, it, expect } from 'vitest'
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

describe('MusicListView', () => {
  it('only mounts a viewport-sized subset of tracks for large catalogs', async () => {
    const trackCount = 200
    const wrapper = mountMusicList(trackCount)
    await flushPromises()

    const rendered = wrapper.findAllComponents(TrackListItem).length

    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(trackCount)
  })
})
