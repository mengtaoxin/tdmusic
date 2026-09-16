import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VApp } from 'vuetify/components'

import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import { useCatalogStore, type DisplayTrack } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'
import NowPlayingFooter from '../NowPlayingFooter.vue'

function makeTrack(): DisplayTrack {
  return {
    id: 't1',
    path: '/music/t1.mp3',
    displayTitle: 'Song One',
    displayArtist: 'Artist One',
    displayAlbum: 'Album One',
  }
}

async function mountFooter(opts?: { currentTime?: number; duration?: number }) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  const track = makeTrack()
  catalog.tracks = [track]
  catalog.loading = false

  const player = usePlayerStore(pinia)
  player.queue = [track.id]
  player.currentId = track.id
  player.currentTime = opts?.currentTime ?? 30
  player.duration = opts?.duration ?? 120

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/now-playing', name: 'now-playing', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  return mount(
    {
      components: { NowPlayingFooter, VApp },
      template: '<VApp><NowPlayingFooter /></VApp>',
    },
    {
      global: { plugins: [pinia, router, vuetify, i18n] },
    },
  )
}

describe('NowPlayingFooter', () => {
  it('shows playback progress along the top of the footer', async () => {
    const wrapper = await mountFooter({ currentTime: 30, duration: 120 })
    await flushPromises()

    const progress = wrapper.find('[data-testid="footer-progress"]')
    expect(progress.exists()).toBe(true)
    expect(progress.classes()).toContain('footer-progress')
    expect(Number(progress.attributes('aria-valuenow'))).toBe(25)
  })
})
