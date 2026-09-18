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

async function mountFooter(opts?: { currentTime?: number; duration?: number; queue?: string[] }) {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)
  const track = makeTrack()
  const track2: DisplayTrack = {
    id: 't2',
    path: '/music/t2.mp3',
    displayTitle: 'Song Two',
    displayArtist: 'Artist One',
    displayAlbum: 'Album One',
  }
  catalog.tracks = [track, track2]
  catalog.loading = false

  const player = usePlayerStore(pinia)
  player.queue = opts?.queue ?? [track.id, track2.id]
  player.originalQueue = [...player.queue]
  player.currentId = track.id
  player.currentIndex = 0
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

  const wrapper = mount(
    {
      components: { NowPlayingFooter, VApp },
      template: '<VApp><NowPlayingFooter /></VApp>',
    },
    {
      global: { plugins: [pinia, router, vuetify, i18n] },
    },
  )
  return { wrapper, player, router }
}

describe('NowPlayingFooter', () => {
  it('shows playback progress along the top of the footer', async () => {
    const { wrapper } = await mountFooter({ currentTime: 30, duration: 120 })
    await flushPromises()

    const progress = wrapper.find('[data-testid="footer-progress"]')
    expect(progress.exists()).toBe(true)
    expect(progress.classes()).toContain('footer-progress')
    expect(Number(progress.attributes('aria-valuenow'))).toBe(25)
  })

  it('seeks when the footer progress control changes', async () => {
    const { wrapper, player } = await mountFooter({ currentTime: 30, duration: 100 })
    await flushPromises()

    const progress = wrapper.findComponent({ name: 'VProgressLinear' })
    expect(progress.exists()).toBe(true)
    progress.vm.$emit('update:modelValue', 50)
    await flushPromises()

    expect(player.currentTime).toBe(50)
    expect(player.seekTo).toBe(50)
  })

  it('has previous and next controls that advance the queue', async () => {
    const { wrapper, player } = await mountFooter()
    await flushPromises()

    const nextBtn = wrapper.find('[data-testid="footer-next"]')
    const prevBtn = wrapper.find('[data-testid="footer-prev"]')
    expect(nextBtn.exists()).toBe(true)
    expect(prevBtn.exists()).toBe(true)

    await nextBtn.trigger('click')
    expect(player.currentId).toBe('t2')
  })
})
