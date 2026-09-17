import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'

import { useLazyLoad } from '@/composables/useLazyLoad'

type ObserverInstance = {
  callback: IntersectionObserverCallback
  observe: (el: Element) => void
  disconnect: () => void
}

let observers: ObserverInstance[]

function installMockIntersectionObserver() {
  observers = []
  class MockIntersectionObserver {
    callback: IntersectionObserverCallback
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
      observers.push(this)
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

function mountLazy(eager = false) {
  const Comp = defineComponent({
    setup() {
      const el = ref<HTMLElement | null>(null)
      const visible = useLazyLoad(el, eager)
      return { el, visible }
    },
    template: '<div ref="el" data-testid="root">{{ visible }}</div>',
  })
  return mount(Comp, { attachTo: document.body })
}

describe('useLazyLoad', () => {
  beforeEach(() => {
    installMockIntersectionObserver()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stays hidden until the element intersects the viewport', async () => {
    const wrapper = mountLazy(false)
    await nextTick()

    expect(wrapper.text()).toBe('false')
    expect(observers).toHaveLength(1)
    expect(observers[0]!.observe).toHaveBeenCalled()

    observers[0]!.callback(
      [{ isIntersecting: true, target: wrapper.element } as IntersectionObserverEntry],
      observers[0] as unknown as IntersectionObserver,
    )
    await nextTick()

    expect(wrapper.text()).toBe('true')
    expect(observers[0]!.disconnect).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('is immediately visible when eager is true', async () => {
    const wrapper = mountLazy(true)
    await nextTick()

    expect(wrapper.text()).toBe('true')
    expect(observers).toHaveLength(0)
    wrapper.unmount()
  })
})
