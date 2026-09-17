import { beforeEach, describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'

import TrackListItem from '@/components/TrackListItem.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import { SEARCH_HISTORY_KEY } from '@/lib/searchHistory'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import SearchView from '../SearchView.vue'

function makeTrack(id: string, title: string, artist: string, album: string): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    displayTitle: title,
    displayArtist: artist,
    displayAlbum: album,
  }
}

function mountSearch() {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  catalog.tracks = [
    makeTrack('t1', 'Hello', 'Alpha Band', 'Other'),
    makeTrack('t2', 'Alpha Song', 'Other', 'Other'),
    makeTrack('t3', 'Song', 'Other', 'Alpha Album'),
  ]
  catalog.loading = false

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })

  return mount(SearchView, {
    global: { plugins: [pinia, vuetify, i18n] },
  })
}

describe('SearchView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows recent search chips when the query is empty', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['old query']))
    const wrapper = mountSearch()
    await flushPromises()

    expect(wrapper.text()).toContain('Recent searches')
    expect(wrapper.text()).toContain('old query')
    expect(wrapper.findAllComponents(TrackListItem)).toHaveLength(0)
  })

  it('lists matching tracks, artists, and albums for a query', async () => {
    const wrapper = mountSearch()
    await wrapper.find('input').setValue('alpha')
    await flushPromises()

    expect(wrapper.text()).toContain('Tracks')
    expect(wrapper.text()).toContain('Artists')
    expect(wrapper.text()).toContain('Albums')
    expect(wrapper.findAllComponents(TrackListItem)).toHaveLength(3)
    expect(wrapper.text()).toContain('Alpha Band')
    expect(wrapper.text()).toContain('Alpha Album')
  })

  it('commits the query to history on Enter', async () => {
    const wrapper = mountSearch()
    const input = wrapper.find('input')
    await input.setValue('jazz')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)!)).toEqual(['jazz'])
  })

  it('applies a history chip as the search query', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['alpha']))
    const wrapper = mountSearch()
    await flushPromises()

    const chip = wrapper.findAll('.v-chip').find((el) => el.text().includes('alpha'))
    expect(chip).toBeTruthy()
    await chip!.trigger('click')
    await flushPromises()

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('alpha')
    expect(wrapper.findAllComponents(TrackListItem)).toHaveLength(3)
  })
})
