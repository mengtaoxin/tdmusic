import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import TrackListItem from '@/components/TrackListItem.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import {
  reportCacheDownload,
  resetCacheDownloadStateForTests,
} from '@/lib/cache/cacheDownloadState'
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
  player.originalQueue = [...player.queue]
  player.currentId = tracks[0]!.id
  player.currentIndex = 0

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

  const wrapper = mount(NowPlayingView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
  return { wrapper, player, catalog }
}

describe('NowPlayingView', () => {
  beforeEach(() => {
    resetCacheDownloadStateForTests()
  })

  it('does not show a Now Playing page heading', async () => {
    const { wrapper } = await mountNowPlaying()
    await flushPromises()

    const headings = wrapper.findAll('h1')
    expect(headings.every((h) => h.text() !== 'Now Playing')).toBe(true)
  })

  it('links the current artist and album to their catalog pages', async () => {
    const { wrapper } = await mountNowPlaying()
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
    const { wrapper } = await mountNowPlaying(trackCount)
    await flushPromises()

    const rendered = wrapper.findAllComponents(TrackListItem).length

    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(trackCount)
  })

  it('blocks mobile long-press copy on the playback surface', async () => {
    const { wrapper } = await mountNowPlaying()
    await flushPromises()

    const root = wrapper.find('[data-testid="now-playing-page"]')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('no-touch-callout')
  })

  it('shows clear upcoming as a flat header action with an icon', async () => {
    const { wrapper } = await mountNowPlaying(4)
    await flushPromises()

    const clearBtn = wrapper.find('[data-testid="clear-upcoming"]')
    expect(clearBtn.exists()).toBe(true)
    expect(clearBtn.classes()).toContain('v-btn--variant-flat')
    expect(clearBtn.classes()).toContain('bg-secondary')
    expect(clearBtn.find('.v-icon').exists()).toBe(true)

    const queueHeading = wrapper.find('h2')
    expect(queueHeading.exists()).toBe(true)
    expect(queueHeading.text()).toContain('queue')
    // Same header row as the queue title (Logs-style clear action).
    expect(clearBtn.element.parentElement).toBe(queueHeading.element.parentElement)
  })

  it('keeps the queue heading on one line on a narrow header row', async () => {
    const { wrapper } = await mountNowPlaying(4)
    await flushPromises()

    const queueHeading = wrapper.find('h2')
    const headerRow = queueHeading.element.parentElement
    const clearBtn = wrapper.find('[data-testid="clear-upcoming"]')

    expect(queueHeading.text()).toBe('Now playing queue')
    expect(queueHeading.classes()).toContain('text-no-wrap')
    expect(queueHeading.classes()).toContain('flex-shrink-0')
    expect(headerRow).not.toBeNull()
    expect(headerRow!.classList.contains('flex-wrap')).toBe(true)
    expect(clearBtn.classes()).toContain('flex-shrink-0')
  })

  it('clears upcoming tracks from the queue', async () => {
    const { wrapper, player } = await mountNowPlaying(4)
    player.goToIndex(1, false)
    await flushPromises()

    const clearBtn = wrapper.find('[data-testid="clear-upcoming"]')
    expect(clearBtn.exists()).toBe(true)
    await clearBtn.trigger('click')
    expect(player.queue).toEqual(['t1', 't2'])
    expect(player.currentId).toBe('t2')
  })

  it('removes a queue track via the row menu', async () => {
    const { wrapper, player } = await mountNowPlaying(3)
    await flushPromises()

    const first = wrapper.findAllComponents(TrackListItem)[0]!
    const activator = first.find('[data-testid="track-actions"]')
    await activator.trigger('click')
    await flushPromises()

    const remove = document.body.querySelector('[data-testid="track-remove"]') as HTMLElement
    expect(remove).toBeTruthy()
    remove.click()
    await flushPromises()

    expect(player.queue).toEqual(['t2', 't3'])
    expect(player.currentId).toBe('t2')
  })

  it('plays the visible queue row even when an earlier queue id is missing from the catalog', async () => {
    const { wrapper, player, catalog } = await mountNowPlaying(3)
    // Queue still holds a ghost id (e.g. after catalog reload); UI only shows known tracks.
    player.queue = ['gone', 't2', 't3']
    player.originalQueue = [...player.queue]
    player.currentId = 't2'
    player.currentIndex = 1
    catalog.tracks = catalog.tracks.filter((track) => track.id !== 't1')
    await flushPromises()

    const rows = wrapper.findAllComponents(TrackListItem)
    // Visible rows are t2, t3 — click the second visible row (t3).
    expect(rows).toHaveLength(2)
    await rows[1]!.trigger('click')
    await flushPromises()

    expect(player.currentId).toBe('t3')
  })

  it('plays the clicked duplicate queue occurrence, not the first match', async () => {
    const { wrapper, player } = await mountNowPlaying(2)
    player.queue = ['t1', 't2', 't1']
    player.originalQueue = [...player.queue]
    player.currentId = 't2'
    player.currentIndex = 1
    await flushPromises()

    const goToIndex = vi.spyOn(player, 'goToIndex')
    const rows = wrapper.findAllComponents(TrackListItem)
    expect(rows).toHaveLength(3)
    // Third row is the second occurrence of t1.
    await rows[2]!.trigger('click')
    await flushPromises()

    expect(goToIndex).toHaveBeenCalledWith(2, true)
  })

  it('highlights only the playing duplicate occurrence', async () => {
    const { wrapper, player } = await mountNowPlaying(2)
    player.queue = ['t1', 't2', 't1']
    player.originalQueue = [...player.queue]
    player.goToIndex(2, false)
    await flushPromises()

    const rows = wrapper.findAllComponents(TrackListItem)
    expect(rows).toHaveLength(3)
    expect(rows[0]!.props('active')).toBe(false)
    expect(rows[1]!.props('active')).toBe(false)
    expect(rows[2]!.props('active')).toBe(true)
  })

  it('animates the hero cover while the current track is downloading', async () => {
    const { wrapper } = await mountNowPlaying()
    await flushPromises()

    reportCacheDownload('/music/t1.mp3', 't1', { phase: 'download', loaded: 0, total: null })
    await nextTick()

    const hero = wrapper.find('.cover-wrap')
    expect(hero.find('[data-testid="cover-downloading"]').exists()).toBe(true)

    reportCacheDownload('/music/t1.mp3', 't1', { phase: 'done', loaded: 1, total: 1 })
    await nextTick()

    expect(hero.find('[data-testid="cover-downloading"]').exists()).toBe(false)
  })
})
