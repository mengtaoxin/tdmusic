import { describe, it, expect, vi } from 'vitest'
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
import ArtistTracksView from '../ArtistTracksView.vue'

function makeTrack(id: string, artist: string, title: string): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    displayTitle: title,
    displayArtist: artist,
    displayAlbum: 'Album',
  }
}

async function mountArtistTracks(name: string) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = [
    makeTrack('t1', 'Artist One', 'Song A'),
    makeTrack('t2', 'Artist One', 'Song B'),
    makeTrack('t3', 'Artist Two', 'Other'),
  ]
  catalog.loading = false

  const player = usePlayerStore(pinia)
  const playFrom = vi.spyOn(player, 'playFrom')

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/artists/:name', component: ArtistTracksView }],
  })
  await router.push(`/artists/${encodeURIComponent(name)}`)
  await router.isReady()

  const wrapper = mount(ArtistTracksView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
  return { wrapper, playFrom }
}

describe('ArtistTracksView', () => {
  it('lists tracks for the artist and plays from the selected index', async () => {
    const { wrapper, playFrom } = await mountArtistTracks('Artist One')
    await flushPromises()

    const items = wrapper.findAllComponents(TrackListItem)
    expect(items).toHaveLength(2)
    expect(items[0]!.props('track').id).toBe('t1')
    expect(items[1]!.props('track').id).toBe('t2')
    expect(wrapper.text()).toContain('All music by this artist')

    items[1]!.vm.$emit('select')
    expect(playFrom).toHaveBeenCalledWith(1, ['t1', 't2'])
  })

  it('shows not-found when the artist is missing', async () => {
    const { wrapper } = await mountArtistTracks('Missing')
    await flushPromises()

    expect(wrapper.text()).toContain('Artist not found.')
    expect(wrapper.findAllComponents(TrackListItem)).toHaveLength(0)
  })
})
