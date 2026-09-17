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
  'Now Playing',
  'Music List',
  'Playlist',
  'Artist List',
  'Album List',
  'Language',
  'More',
]

const chineseMenus = ['正在播放', '音乐列表', '播放列表', '歌手列表', '专辑列表', '语言', '更多']

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

  it('styles the document scrollbar to blend with the page theme', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: HomeView }],
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      attachTo: document.body,
      global: {
        plugins: [createPinia(), router, vuetify, createTestI18n()],
      },
    })

    const style = getComputedStyle(document.documentElement)
    expect(style.scrollbarGutter).toContain('stable')
    expect(style.scrollbarColor).not.toBe('auto')
    expect(style.scrollbarColor.toLowerCase()).toMatch(/rgba?\(/)

    wrapper.unmount()
  })

  it('shows the brand icon in the app header', async () => {
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

    const brandIcon = wrapper.find('[data-testid="brand-icon"]')
    expect(brandIcon.exists()).toBe(true)
    expect(brandIcon.attributes('src')).toMatch(/brand-icon\.png|data:image\/png/)
  })

  it('shows English header menus by default and switches to Chinese from the locale menu', async () => {
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
    expect(text).not.toMatch(/(^|[^a-zA-Z])Home([^a-zA-Z]|$)/)

    const localeToggle = wrapper.find('[data-testid="nav-locale-toggle"]')
    expect(localeToggle.exists()).toBe(true)
    await localeToggle.trigger('click')
    await wrapper.vm.$nextTick()

    const localeMenu = document.querySelector('[data-testid="nav-locale-menu"]')
    expect(localeMenu).toBeTruthy()

    const zhOption = localeMenu!.querySelector('[data-testid="locale-option-zh"]')
    expect(zhOption).toBeTruthy()
    zhOption!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    const zhText = wrapper.text()
    for (const label of chineseMenus) {
      expect(zhText).toContain(label)
    }
    expect(zhText).not.toContain('首页')
    expect(localStorage.getItem('tdmusic.locale')).toBe('zh')

    wrapper.unmount()
  })
})
