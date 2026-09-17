import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import { useVirtualListHost } from '@/composables/useVirtualListHost'

type RoCallback = ResizeObserverCallback

function stubResizeObserver(heightPx: number, widthPx = 320) {
  class FakeResizeObserver {
    private readonly cb: RoCallback
    constructor(cb: RoCallback) {
      this.cb = cb
    }
    observe(target: Element) {
      this.cb(
        [
          {
            target,
            contentRect: { height: heightPx, width: widthPx } as DOMRectReadOnly,
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          } as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      )
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useVirtualListHost', () => {
  it('measures host height from ResizeObserver', async () => {
    stubResizeObserver(480, 640)
    const Comp = defineComponent({
      setup() {
        const { listHost, hostHeight, hostWidth } = useVirtualListHost()
        return { listHost, hostHeight, hostWidth }
      },
      template: '<div ref="listHost" class="host" />',
    })
    const wrapper = mount(Comp)
    await nextTick()
    await nextTick()
    expect(wrapper.vm.hostHeight).toBe(480)
    expect(wrapper.vm.hostWidth).toBe(0)
  })

  it('optionally measures host width', async () => {
    stubResizeObserver(200, 900)
    const Comp = defineComponent({
      setup() {
        const host = useVirtualListHost({ observeWidth: true })
        return host
      },
      template: '<div ref="listHost" class="host" />',
    })
    const wrapper = mount(Comp)
    await nextTick()
    await nextTick()
    expect(wrapper.vm.hostHeight).toBe(200)
    expect(wrapper.vm.hostWidth).toBe(900)
  })
})
