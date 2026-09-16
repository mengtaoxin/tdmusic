import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'

import App from '../App.vue'
import HomeView from '../views/HomeView.vue'
import vuetify from '../plugins/vuetify'
import en from '../locales/en'
import zh from '../locales/zh'

const englishMenus = [
  'Home',
  'Music List',
  'Playlist',
  'Artist List',
  'Album List',
  'Now Playing',
  'Search',
  'Settings',
  'About',
]

const chineseMenus = [
  '首页',
  '音乐列表',
  '播放列表',
  '歌手列表',
  '专辑列表',
  '正在播放',
  '搜索',
  '设置',
  '关于',
]

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 'music-list': [] }),
      }),
    )
  })

  it('mounts and renders home content', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: HomeView }],
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router, vuetify, createTestI18n()],
      },
    })

    expect(wrapper.text()).toContain('tdmusic')
  })

  it('shows English header menus by default and switches to Chinese via dropdown', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: HomeView }],
    })

    router.push('/')
    await router.isReady()

    const i18n = createTestI18n()
    const wrapper = mount(App, {
      attachTo: document.body,
      global: {
        plugins: [createPinia(), router, vuetify, i18n],
      },
    })

    const text = wrapper.text()
    for (const label of englishMenus) {
      expect(text).toContain(label)
    }

    const localeSelect = wrapper.find('[data-testid="locale-select"]')
    expect(localeSelect.exists()).toBe(true)
    expect(localeSelect.text()).toContain('English')

    await localeSelect.trigger('click')
    await wrapper.vm.$nextTick()

    const zhOption = [...document.querySelectorAll('.v-list-item')].find((el) =>
      el.textContent?.includes('中文'),
    )
    expect(zhOption).toBeTruthy()
    zhOption!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    const zhText = wrapper.text()
    for (const label of chineseMenus) {
      expect(zhText).toContain(label)
    }
    expect(localeSelect.text()).toContain('中文')
    expect(localStorage.getItem('tdmusic.locale')).toBe('zh')

    wrapper.unmount()
  })
})
