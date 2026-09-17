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

const englishTopMenus = [
  'Now Playing',
  'Music List',
  'Playlist',
  'Artist List',
  'Album List',
  'More',
]

const englishDesktopExtraMenus = ['Language']

const GITHUB_ISSUES_URL = 'https://github.com/mengtaoxin/tdmusic/issues'

const englishMoreSubMenus = [
  'Search',
  'Settings',
  'configs.json guideline',
  'About',
  'Logs',
  'Feedback',
]

const topNavIconsByPath: Record<string, string> = {
  '/now-playing': 'mdi-play-circle',
  '/music': 'mdi-music-box-multiple',
  '/playlists': 'mdi-playlist-music',
  '/artists': 'mdi-account-music',
  '/albums': 'mdi-album',
}

const moreSubNavIconsByPath: Record<string, string> = {
  '/search': 'mdi-magnify',
  '/settings': 'mdi-cog',
  '/config-guides': 'mdi-file-document-outline',
  '/about': 'mdi-information-outline',
  '/logs': 'mdi-text-box-outline',
}

const navRoutes = [
  { path: '/', name: 'home', component: { template: '<div />' } },
  { path: '/now-playing', name: 'now-playing', component: { template: '<div />' } },
  { path: '/music', name: 'music', component: { template: '<div />' } },
  { path: '/playlists', name: 'playlists', component: { template: '<div />' } },
  { path: '/artists', name: 'artists', component: { template: '<div />' } },
  { path: '/albums', name: 'albums', component: { template: '<div />' } },
  { path: '/search', name: 'search', component: { template: '<div />' } },
  { path: '/settings', name: 'settings', component: { template: '<div />' } },
  { path: '/config-guides', name: 'config-guides', component: { template: '<div />' } },
  { path: '/about', name: 'about', component: { template: '<div />' } },
  { path: '/logs', name: 'logs', component: { template: '<div />' } },
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

  it('links the brand title to the home page', async () => {
    const { wrapper } = await mountHeader()

    const brandLink = wrapper.find('[data-testid="brand-title"]')
    expect(brandLink.exists()).toBe(true)
    expect(brandLink.element.tagName).toBe('A')
    expect(brandLink.attributes('href')).toBe('/')

    wrapper.unmount()
  })

  it('shows a beta badge next to the brand title', async () => {
    const { wrapper } = await mountHeader()

    const brand = wrapper.find('.brand')
    const beta = wrapper.find('[data-testid="brand-beta"]')
    expect(beta.exists()).toBe(true)
    expect(beta.text()).toBe('Beta')
    expect(
      brand.element.contains(beta.element) &&
        brand.text().indexOf('tdmusic') < brand.text().indexOf('Beta'),
    ).toBe(true)
    // One step smaller than the previous 0.625rem (10px) badge.
    expect(getComputedStyle(beta.element).fontSize).toBe('8px')

    wrapper.unmount()
  })

  it('omits Home from desktop nav and the drawer', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 1200, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const desktopNav = wrapper.find('[data-testid="desktop-nav"]')
    expect(desktopNav.text()).not.toContain('Home')
    expect(desktopNav.find('a[href="/"]').exists()).toBe(false)

    applyLayoutWidths(wrapper, { toolbarWidth: 400, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()
    await wrapper.find('[data-testid="nav-menu-toggle"]').trigger('click')
    await nextTick()
    await flushPromises()

    const drawerRoot = document.querySelector('[data-testid="nav-drawer"]')
    expect(drawerRoot).toBeTruthy()
    expect(drawerRoot!.querySelector('a[href="/"]')).toBeNull()
    expect(drawerRoot!.textContent).not.toContain('Home')

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

  it('keeps brand title, hamburger, and desktop nav on the same vertical centerline', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 1200, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const brandMark = wrapper.find('[data-testid="brand-title"]')
    const desktopNav = wrapper.find('[data-testid="desktop-nav"]')
    expect(brandMark.exists()).toBe(true)
    expect(brandMark.classes()).toContain('header-centerline')
    expect(desktopNav.classes()).toContain('header-centerline')

    applyLayoutWidths(wrapper, { toolbarWidth: 400, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const toggle = wrapper.find('[data-testid="nav-menu-toggle"]')
    expect(toggle.exists()).toBe(true)
    expect(toggle.classes()).toContain('header-centerline')

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
    for (const label of englishTopMenus) {
      expect(desktopNav.text()).toContain(label)
    }
    for (const label of englishDesktopExtraMenus) {
      expect(desktopNav.text()).toContain(label)
    }
    for (const label of englishMoreSubMenus) {
      expect(desktopNav.text()).not.toContain(label)
    }

    const topLabels = [...desktopNav.element.querySelectorAll('a, button')]
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
    expect(topLabels.indexOf('Now Playing')).toBe(0)
    expect(topLabels.indexOf('Language')).toBeGreaterThan(topLabels.indexOf('More'))

    applyLayoutWidths(wrapper, { toolbarWidth: 700, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const toggle = wrapper.find('[data-testid="nav-menu-toggle"]')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-label')).toBeTruthy()
    expect(wrapper.find('[data-testid="desktop-nav"]').attributes('aria-hidden')).toBe('true')

    wrapper.unmount()
  })

  it('nests Search, Settings, configs.json guideline, About, Logs, and Feedback under More in desktop nav and the drawer', async () => {
    const { wrapper, router } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 1200, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const moreToggle = wrapper.find('[data-testid="nav-more-toggle"]')
    expect(moreToggle.exists()).toBe(true)
    expect(moreToggle.text()).toContain('More')
    expect(moreToggle.find('.mdi-dots-horizontal').exists()).toBe(true)

    await moreToggle.trigger('click')
    await nextTick()
    await flushPromises()

    const moreMenu = document.querySelector('[data-testid="nav-more-menu"]')
    expect(moreMenu).toBeTruthy()
    for (const label of englishMoreSubMenus) {
      expect(moreMenu!.textContent).toContain(label)
    }
    for (const [path, icon] of Object.entries(moreSubNavIconsByPath)) {
      const link = moreMenu!.querySelector(`a[href="${path}"]`)
      expect(link).toBeTruthy()
      expect(link!.querySelector(`.${icon}`)).toBeTruthy()
    }

    const feedbackLink = moreMenu!.querySelector(`a[href="${GITHUB_ISSUES_URL}"]`)
    expect(feedbackLink).toBeTruthy()
    expect(feedbackLink!.getAttribute('target')).toBe('_blank')
    expect(feedbackLink!.getAttribute('rel')).toContain('noopener')
    expect(feedbackLink!.querySelector('.mdi-message-text-outline')).toBeTruthy()

    const logsLink = moreMenu!.querySelector('a[href="/logs"]')
    expect(logsLink).toBeTruthy()
    await router.push('/logs')
    await nextTick()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/logs')

    applyLayoutWidths(wrapper, { toolbarWidth: 400, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    await wrapper.find('[data-testid="nav-menu-toggle"]').trigger('click')
    await nextTick()
    await flushPromises()

    const drawerRoot = document.querySelector('[data-testid="nav-drawer"]')
    expect(drawerRoot).toBeTruthy()
    expect(drawerRoot!.textContent).toContain('More')
    for (const label of englishMoreSubMenus) {
      expect(drawerRoot!.textContent).toContain(label)
    }
    for (const [path, icon] of Object.entries(moreSubNavIconsByPath)) {
      const link = drawerRoot!.querySelector(`a[href="${path}"]`)
      expect(link).toBeTruthy()
      expect(link!.querySelector(`.${icon}`)).toBeTruthy()
    }

    const drawerFeedback = drawerRoot!.querySelector(`a[href="${GITHUB_ISSUES_URL}"]`)
    expect(drawerFeedback).toBeTruthy()
    expect(drawerFeedback!.getAttribute('target')).toBe('_blank')
    expect(drawerFeedback!.querySelector('.mdi-message-text-outline')).toBeTruthy()

    wrapper.unmount()
  })

  it('does not use the dialog-scale menu transition that swallows touch taps', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 1200, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const menus = wrapper.findAllComponents({ name: 'VMenu' })
    expect(menus.length).toBeGreaterThan(0)
    for (const menu of menus) {
      const transition = menu.props('transition') as
        { component?: { name?: string } } | string | boolean
      const dialogScale =
        typeof transition === 'object' && transition?.component?.name === 'VDialogTransition'
      expect(dialogScale).toBe(false)
    }

    wrapper.unmount()
  })

  it('switches language from a desktop-nav dropdown that matches regular menu sizing', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 1200, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const desktopNav = wrapper.find('[data-testid="desktop-nav"]')
    const localeToggle = desktopNav.find('[data-testid="nav-locale-toggle"]')
    expect(localeToggle.exists()).toBe(true)
    expect(localeToggle.text()).toContain('Language')
    expect(localeToggle.find('.mdi-translate').exists()).toBe(true)
    expect(localeToggle.classes()).toContain('v-btn--size-small')

    const moreToggle = desktopNav.find('[data-testid="nav-more-toggle"]')
    expect(moreToggle.classes()).toContain('v-btn--size-small')

    await localeToggle.trigger('click')
    await nextTick()
    await flushPromises()

    const localeMenu = document.querySelector('[data-testid="nav-locale-menu"]')
    expect(localeMenu).toBeTruthy()
    expect(localeMenu!.textContent).toContain('English')
    expect(localeMenu!.textContent).toContain('中文')

    const zhOption = localeMenu!.querySelector('[data-testid="locale-option-zh"]')
    expect(zhOption).toBeTruthy()
    expect(zhOption!.querySelector('.mdi-translate')).toBeTruthy()
    zhOption!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await flushPromises()

    expect(localStorage.getItem('tdmusic.locale')).toBe('zh')
    expect(desktopNav.text()).toContain('语言')
    expect(desktopNav.text()).toContain('正在播放')
    expect(desktopNav.text()).not.toContain('首页')

    wrapper.unmount()
  })

  it('nests English and 中文 under a Language group in the drawer like More', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 400, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const toggle = wrapper.find('[data-testid="nav-menu-toggle"]')
    await toggle.trigger('click')
    await nextTick()
    await flushPromises()

    const drawerRoot = document.querySelector('[data-testid="nav-drawer"]')
    expect(drawerRoot).toBeTruthy()
    expect(drawerRoot!.className).toMatch(/v-navigation-drawer--active/)
    expect(drawerRoot!.textContent).toContain('Language')
    expect(drawerRoot!.textContent).toContain('English')
    expect(drawerRoot!.textContent).toContain('中文')
    // Same group pattern as More: no lone divider section of flat locale rows.
    expect(drawerRoot!.querySelector('hr.v-divider, .v-divider')).toBeNull()

    const languageGroup = [...drawerRoot!.querySelectorAll('.v-list-group')].find((el) =>
      el.textContent?.includes('Language'),
    )
    expect(languageGroup).toBeTruthy()
    expect(languageGroup!.querySelector('.mdi-translate')).toBeTruthy()

    const zhOption = languageGroup!.querySelector('[data-testid="locale-option-zh"]')
    expect(zhOption).toBeTruthy()
    expect(zhOption!.querySelector('.mdi-translate')).toBeTruthy()
    zhOption!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await flushPromises()

    expect(localStorage.getItem('tdmusic.locale')).toBe('zh')
    expect(drawerRoot!.textContent).toContain('正在播放')
    expect(drawerRoot!.textContent).toContain('语言')
    expect(drawerRoot!.textContent).not.toContain('首页')

    wrapper.unmount()
  })

  it('shows an appropriate icon for every nav and locale menu item', async () => {
    const { wrapper } = await mountHeader()
    applyLayoutWidths(wrapper, { toolbarWidth: 1200, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    const desktopNav = wrapper.find('[data-testid="desktop-nav"]')
    for (const [path, icon] of Object.entries(topNavIconsByPath)) {
      const link = desktopNav.find(`a[href="${path}"]`)
      expect(link.exists()).toBe(true)
      expect(link.find(`.${icon}`).exists()).toBe(true)
    }
    expect(desktopNav.find('[data-testid="nav-more-toggle"] .mdi-dots-horizontal').exists()).toBe(
      true,
    )
    expect(desktopNav.find('[data-testid="nav-locale-toggle"] .mdi-translate').exists()).toBe(true)

    applyLayoutWidths(wrapper, { toolbarWidth: 400, brandWidth: 120, navContentWidth: 800 })
    await measureNavLayout()

    await wrapper.find('[data-testid="nav-menu-toggle"]').trigger('click')
    await nextTick()
    await flushPromises()

    const drawerRoot = document.querySelector('[data-testid="nav-drawer"]')
    expect(drawerRoot).toBeTruthy()

    for (const [path, icon] of Object.entries(topNavIconsByPath)) {
      const link = drawerRoot!.querySelector(`a[href="${path}"]`)
      expect(link).toBeTruthy()
      expect(link!.querySelector(`.${icon}`)).toBeTruthy()
    }
    expect(drawerRoot!.querySelector('.mdi-dots-horizontal')).toBeTruthy()

    const languageGroup = [...drawerRoot!.querySelectorAll('.v-list-group')].find((el) =>
      el.textContent?.includes('Language'),
    )
    expect(languageGroup).toBeTruthy()
    for (const locale of ['en', 'zh'] as const) {
      const option = languageGroup!.querySelector(`[data-testid="locale-option-${locale}"]`)
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

    for (const label of [...englishTopMenus, 'Language', ...englishMoreSubMenus]) {
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
