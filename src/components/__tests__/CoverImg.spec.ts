import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import CoverImg from '@/components/CoverImg.vue'
import vuetify from '@/plugins/vuetify'
import en from '@/locales/en'
import zh from '@/locales/zh'

type ObserverInstance = {
  callback: IntersectionObserverCallback
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

let observers: ObserverInstance[]

function installMockIntersectionObserver() {
  observers = []
  class MockIntersectionObserver {
    callback: IntersectionObserverCallback
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
      observers.push(this as unknown as ObserverInstance)
    }
    observe = vi.fn<(el: Element) => void>()
    unobserve = vi.fn<(el: Element) => void>()
    disconnect = vi.fn<() => void>()
    takeRecords = () => []
    root = null
    rootMargin = ''
    thresholds = []
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
}

const COVER = 'https://example.com/cover.jpg'

function mountCover(props: Record<string, unknown> = {}) {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, zh },
  })
  return mount(CoverImg, {
    props: { src: COVER, ...props },
    global: { plugins: [vuetify, i18n] },
    attachTo: document.body,
  })
}

describe('CoverImg', () => {
  beforeEach(() => {
    installMockIntersectionObserver()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not load the image src until scrolled into view', async () => {
    const wrapper = mountCover()
    await nextTick()

    expect(wrapper.find(`img[src="${COVER}"]`).exists()).toBe(false)
    expect(observers.length).toBeGreaterThan(0)

    const observer = observers[0]!
    observer.callback(
      [{ isIntersecting: true, target: wrapper.element } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    )
    await nextTick()
    await nextTick()

    expect(wrapper.find(`img[src="${COVER}"]`).exists()).toBe(true)
    wrapper.unmount()
  })

  it('blocks long-press save / drag on cover images', async () => {
    const wrapper = mountCover({ eager: true })
    await nextTick()
    await nextTick()
    await nextTick()

    const root = wrapper.find('.cover-img')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('no-touch-callout')

    const img = wrapper.find(`img[src="${COVER}"]`)
    expect(img.exists()).toBe(true)
    expect(img.attributes('draggable')).toBe('false')

    await wrapper.find('.cover-img').trigger('contextmenu')

    wrapper.unmount()
  })

  it('shows a downloading animation instead of the cover image', async () => {
    const wrapper = mountCover({ eager: true, downloading: true })
    await nextTick()

    expect(wrapper.find('[data-testid="cover-downloading"]').exists()).toBe(true)
    expect(wrapper.find(`img[src="${COVER}"]`).exists()).toBe(false)
    expect(wrapper.find('.cover-img__aurora').exists()).toBe(false)
    const spinner = wrapper.findComponent({ name: 'VProgressCircular' })
    expect(spinner.exists()).toBe(true)
    expect(spinner.props('indeterminate')).toBe(true)
    expect(wrapper.find('.cover-img').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.cover-img').attributes('aria-label')).toBe('Downloading')

    await wrapper.setProps({ downloading: false })
    await nextTick()

    expect(wrapper.find('[data-testid="cover-downloading"]').exists()).toBe(false)
    expect(wrapper.find(`img[src="${COVER}"]`).exists()).toBe(true)
    expect(wrapper.find('.cover-img').attributes('aria-busy')).toBeUndefined()

    wrapper.unmount()
  })

  it('animates a placeholder when downloading with no cover yet', async () => {
    const wrapper = mountCover({ src: undefined, downloading: true })
    await nextTick()

    expect(wrapper.find('[data-testid="cover-downloading"]').exists()).toBe(true)
    expect(wrapper.find('img').exists()).toBe(false)

    wrapper.unmount()
  })
})
