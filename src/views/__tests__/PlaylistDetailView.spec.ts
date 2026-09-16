import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'
import PlaylistDetailView from '../PlaylistDetailView.vue'

function makeTrack(id: string, title: string): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    displayTitle: title,
    displayArtist: 'Artist',
    displayAlbum: 'Album',
  }
}

async function mountPlaylistDetail(name: string) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = [makeTrack('t1', 'Song A'), makeTrack('t2', 'Song B'), makeTrack('t3', 'Other')]
  catalog.playlists = [{ title: 'My List', trackIds: ['t1', 't2'] }]
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
    routes: [{ path: '/playlists/:name', component: PlaylistDetailView }],
  })
  await router.push(`/playlists/${encodeURIComponent(name)}`)
  await router.isReady()

  const wrapper = mount(PlaylistDetailView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
  return { wrapper, playFrom, player }
}

describe('PlaylistDetailView', () => {
  it('play all starts from the first track with shuffle off', async () => {
    const { wrapper, playFrom, player } = await mountPlaylistDetail('My List')
    await flushPromises()

    player.shuffle = true
    const playAll = wrapper.findAll('button').find((b) => b.text().includes('Play all'))
    expect(playAll).toBeTruthy()
    await playAll!.trigger('click')

    expect(player.shuffle).toBe(false)
    expect(playFrom).toHaveBeenCalledWith(0, ['t1', 't2'])
  })

  it('shuffle all starts from the first track with shuffle on', async () => {
    const { wrapper, playFrom, player } = await mountPlaylistDetail('My List')
    await flushPromises()

    player.shuffle = false
    const shuffleAll = wrapper.findAll('button').find((b) => b.text().includes('Shuffle all'))
    expect(shuffleAll).toBeTruthy()
    await shuffleAll!.trigger('click')

    expect(player.shuffle).toBe(true)
    expect(playFrom).toHaveBeenCalledWith(0, ['t1', 't2'])
  })

  it('hides play-all controls when the playlist is missing', async () => {
    const { wrapper } = await mountPlaylistDetail('Missing')
    await flushPromises()

    expect(wrapper.text()).toContain('Playlist not found.')
    expect(wrapper.text()).not.toContain('Play all')
    expect(wrapper.text()).not.toContain('Shuffle all')
  })
})
