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
  player.originalQueue = [...player.queue]
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

  const wrapper = mount(NowPlayingView, {
    global: { plugins: [pinia, router, vuetify, i18n] },
  })
  return { wrapper, player }
}

describe('NowPlayingView', () => {
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

  it('shows clear upcoming as a tonal section action with an icon', async () => {
    const { wrapper } = await mountNowPlaying(4)
    await flushPromises()

    const clearBtn = wrapper.find('[data-testid="clear-upcoming"]')
    expect(clearBtn.exists()).toBe(true)
    expect(clearBtn.classes()).toContain('v-btn--variant-tonal')
    expect(clearBtn.classes()).toContain('text-secondary')
    expect(clearBtn.find('.v-icon').exists()).toBe(true)

    const queueHeading = wrapper.find('h2')
    expect(queueHeading.exists()).toBe(true)
    expect(queueHeading.text()).toContain('queue')
    // Dedicated action row under the heading (not a shared header flex sibling).
    expect(clearBtn.element.parentElement).not.toBe(queueHeading.element.parentElement)
    expect(clearBtn.element.parentElement?.previousElementSibling).toBe(queueHeading.element)
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
})
