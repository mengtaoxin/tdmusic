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

  it('locks document scroll so mobile browser chrome does not thrash', async () => {
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

    expect(getComputedStyle(document.documentElement).overflow).toContain('hidden')
    expect(getComputedStyle(document.body).overflow).toContain('hidden')
    expect(wrapper.find('.v-main--scrollable').exists()).toBe(true)
    expect(wrapper.find('.v-main__scroller').exists()).toBe(true)

    wrapper.unmount()
  })

  it('styles the main scroller scrollbar to blend with the page theme', async () => {
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

    const scroller = wrapper.find('.v-main__scroller').element
    const style = getComputedStyle(scroller)
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

  it('switches locale from the header menu and persists tdmusic.locale', async () => {
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

    expect(wrapper.text()).toContain('Now Playing')

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

    expect(wrapper.text()).toContain('正在播放')
    expect(localStorage.getItem('tdmusic.locale')).toBe('zh')

    wrapper.unmount()
  })
})
