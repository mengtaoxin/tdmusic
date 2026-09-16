import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import CoverImg from '@/components/CoverImg.vue'
import vuetify from '@/plugins/vuetify'

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

describe('CoverImg', () => {
  beforeEach(() => {
    installMockIntersectionObserver()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not load the image src until scrolled into view', async () => {
    const wrapper = mount(CoverImg, {
      props: { src: COVER },
      global: { plugins: [vuetify] },
      attachTo: document.body,
    })
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
    const wrapper = mount(CoverImg, {
      props: { src: COVER, eager: true },
      global: { plugins: [vuetify] },
      attachTo: document.body,
    })
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
})
