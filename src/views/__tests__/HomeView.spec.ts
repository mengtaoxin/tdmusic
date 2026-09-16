import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'

import HomeView from '../HomeView.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'

function mountHome(locale: 'en' | 'zh') {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en, zh },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: HomeView },
      { path: '/music', component: { template: '<div />' } },
    ],
  })
  return mount(HomeView, {
    global: { plugins: [router, vuetify, i18n] },
  })
}

describe('HomeView', () => {
  it('shows a plain-language project intro in English', () => {
    const wrapper = mountHome('en')
    const text = wrapper.text()

    expect(text).toContain('tdmusic')
    expect(text).toContain('A simple way to listen to your music in the browser.')
    expect(text).toContain('Open the music list, pick a song, and hit play.')
    expect(text).toContain('Browse by artist or album, or search when you know the title.')
    expect(text).not.toMatch(/Material Design|IndexedDB|Pinia|configs\.json/i)
  })

  it('shows a plain-language project intro in Chinese', () => {
    const wrapper = mountHome('zh')
    const text = wrapper.text()

    expect(text).toContain('tdmusic')
    expect(text).toContain('在浏览器里轻松听自己的音乐。')
    expect(text).toContain('打开音乐列表，点一首歌就能播放。')
    expect(text).toContain('也可以按歌手、专辑浏览，或直接搜索歌名。')
    expect(text).not.toMatch(/Material Design|IndexedDB|Pinia|configs\.json/i)
  })
})
