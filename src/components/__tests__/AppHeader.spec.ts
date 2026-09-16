import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import { VApp } from 'vuetify/components'

import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'
import AppHeader from '../AppHeader.vue'

type RoCallback = ResizeObserverCallback
const resizeObserverCallbacks: RoCallback[] = []

function stubResizeObserver() {
  resizeObserverCallbacks.length = 0
  class FakeResizeObserver {
    constructor(cb: RoCallback) {
      resizeObserverCallbacks.push(cb)
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
}

function applyLayoutWidths(
  wrapper: { element: Element },
  args: {
    toolbarWidth: number
    brandWidth: number
    navContentWidth: number
  },
) {
  const { toolbarWidth, brandWidth, navContentWidth } = args
  const root = wrapper.element.parentElement ?? wrapper.element
  const toolbarContent = root.querySelector('.v-toolbar__content')
  const brand = root.querySelector('.brand')
  const nav = root.querySelector('[data-testid="desktop-nav"]')

  if (toolbarContent) {
    Object.defineProperty(toolbarContent, 'clientWidth', {
      configurable: true,
      get: () => toolbarWidth,
    })
  }
  if (brand) {
    Object.defineProperty(brand, 'offsetWidth', {
      configurable: true,
      get: () => brandWidth,
    })
  }
  if (nav) {
    Object.defineProperty(nav, 'scrollWidth', {
      configurable: true,
      get: () => navContentWidth,
    })
  }
}

async function measureNavLayout() {
  for (const cb of resizeObserverCallbacks) {
    cb([], {} as ResizeObserver)
  }
  await nextTick()
  await flushPromises()
}

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

const navIconsByPath: Record<string, string> = {
  '/': 'mdi-home',
  '/music': 'mdi-music-box-multiple',
  '/playlists': 'mdi-playlist-music',
  '/artists': 'mdi-account-music',
  '/albums': 'mdi-album',
  '/now-playing': 'mdi-play-circle',
  '/search': 'mdi-magnify',
  '/settings': 'mdi-cog',
  '/about': 'mdi-information-outline',
}

const navRoutes = [
  { path: '/', name: 'home', component: { template: '<div />' } },
  { path: '/music', name: 'music', component: { template: '<div />' } },
  { path: '/playlists', name: 'playlists', component: { template: '<div />' } },
  { path: '/artists', name: 'artists', component: { template: '<div />' } },
  { path: '/albums', name: 'albums', component: { template: '<div />' } },
  { path: '/now-playing', name: 'now-playing', component: { template: '<div />' } },
  { path: '/search', name: 'search', component: { template: '<div />' } },
  { path: '/settings', name: 'settings', component: { template: '<div />' } },
  { path: '/about', name: 'about', component: { template: '<div />' } },
]

async function mountHeader() {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: navRoutes,
  })
  await router.push('/')
  await router.isReady()

  const wrapper = mount(
    {
      components: { AppHeader, VApp },
      template: '<VApp><AppHeader /></VApp>',
    },
    {
      attachTo: document.body,
      global: { plugins: [router, vuetify, i18n] },
    },
  )

  return { wrapper, router }
}

describe('AppHeader', () => {
  beforeEach(() => {
    localStorage.clear()
    stubResizeObserver()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps the brand title from shrinking under desktop nav', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 1200, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const brand = wrapper.find('.brand')
    expect(brand.exists()).toBe(true)
    expect(brand.text()).toContain('tdmusic')
    expect(brand.classes()).toEqual(expect.arrayContaining(['flex-grow-0', 'flex-shrink-0']))

    wrapper.unmount()
  })

  it('places the brand title before the menu toggle when nav is collapsed', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 400, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const brand = wrapper.find('.brand').element
    const toggle = wrapper.find('[data-testid="nav-menu-toggle"]').element
    expect(brand.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    wrapper.unmount()
  })

  it('shows desktop nav when links fit and collapses to hamburger when they would be clipped', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 1200, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    expect(wrapper.find('[data-testid="nav-menu-toggle"]').exists()).toBe(false)

    const desktopNav = wrapper.find('[data-testid="desktop-nav"]')
    expect(desktopNav.exists()).toBe(true)
    expect(desktopNav.attributes('aria-hidden')).not.toBe('true')
    for (const label of englishMenus) {
      expect(desktopNav.text()).toContain(label)
    }

    applyLayoutWidths(wrapper, { toolbarWidth: 700, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const toggle = wrapper.find('[data-testid="nav-menu-toggle"]')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-label')).toBeTruthy()
    expect(wrapper.find('[data-testid="desktop-nav"]').attributes('aria-hidden')).toBe('true')

    wrapper.unmount()
  })

  it('keeps language options in the nav drawer instead of a separate app-bar control', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 400, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    expect(wrapper.find('[data-testid="locale-select"]').exists()).toBe(false)

    const toggle = wrapper.find('[data-testid="nav-menu-toggle"]')
    await toggle.trigger('click')
    await nextTick()
    await flushPromises()

    const drawerRoot = document.querySelector('[data-testid="nav-drawer"]')
    expect(drawerRoot).toBeTruthy()
    expect(drawerRoot!.className).toMatch(/v-navigation-drawer--active/)
    expect(drawerRoot!.textContent).toContain('English')
    expect(drawerRoot!.textContent).toContain('中文')

    const zhOption = [...drawerRoot!.querySelectorAll('[data-testid^="locale-option-"]')].find(
      (el) => el.getAttribute('data-testid') === 'locale-option-zh',
    )
    expect(zhOption).toBeTruthy()
    zhOption!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await flushPromises()

    expect(localStorage.getItem('tdmusic.locale')).toBe('zh')
    expect(drawerRoot!.textContent).toContain('首页')

    wrapper.unmount()
  })

  it('shows an appropriate icon for every nav and locale menu item', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 1200, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const desktopNav = wrapper.find('[data-testid="desktop-nav"]')
    for (const [path, icon] of Object.entries(navIconsByPath)) {
      const link = desktopNav.find(`a[href="${path}"]`)
      expect(link.exists()).toBe(true)
      expect(link.find(`.${icon}`).exists()).toBe(true)
    }

    applyLayoutWidths(wrapper, { toolbarWidth: 400, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    await wrapper.find('[data-testid="nav-menu-toggle"]').trigger('click')
    await nextTick()
    await flushPromises()

    const drawerRoot = document.querySelector('[data-testid="nav-drawer"]')
    expect(drawerRoot).toBeTruthy()

    for (const [path, icon] of Object.entries(navIconsByPath)) {
      const link = drawerRoot!.querySelector(`a[href="${path}"]`)
      expect(link).toBeTruthy()
      expect(link!.querySelector(`.${icon}`)).toBeTruthy()
    }

    for (const locale of ['en', 'zh'] as const) {
      const option = drawerRoot!.querySelector(`[data-testid="locale-option-${locale}"]`)
      expect(option).toBeTruthy()
      expect(option!.querySelector('.mdi-translate')).toBeTruthy()
    }

    wrapper.unmount()
  })

  it('opens the nav drawer from the hamburger and closes it after navigating', async () => {
    const { wrapper, router } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 400, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const drawer = wrapper.find('[data-testid="nav-drawer"]')
    expect(drawer.exists()).toBe(true)

    const toggle = wrapper.find('[data-testid="nav-menu-toggle"]')
    await toggle.trigger('click')
    await nextTick()
    await flushPromises()

    const drawerRoot = document.querySelector('[data-testid="nav-drawer"]')
    expect(drawerRoot).toBeTruthy()
    expect(drawerRoot!.className).toMatch(/v-navigation-drawer--active/)

    for (const label of englishMenus) {
      expect(drawerRoot!.textContent).toContain(label)
    }

    const musicLink = [...drawerRoot!.querySelectorAll('a')].find((el) =>
      el.textContent?.includes('Music List'),
    )
    expect(musicLink).toBeTruthy()
    await router.push('/music')
    await nextTick()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/music')
    expect(document.querySelector('[data-testid="nav-drawer"]')!.className).not.toMatch(
      /v-navigation-drawer--active/,
    )

    wrapper.unmount()
  })
})
