import { onBeforeUnmount, ref, watch } from 'vue'

export type UseVirtualListHostOptions = {
  /** When true, also track contentRect.width (album gallery columns). */
  observeWidth?: boolean
}

/**
 * Shared ResizeObserver host for `v-virtual-scroll` pages.
 * Bind `listHost` to the flex-growing element that wraps the virtual list.
 */
export function useVirtualListHost(options: UseVirtualListHostOptions = {}) {
  const observeWidth = options.observeWidth === true
  const listHost = ref<HTMLElement | null>(null)
  const hostHeight = ref(0)
  const hostWidth = ref(0)
  let resizeObserver: ResizeObserver | null = null

  watch(
    listHost,
    (el) => {
      resizeObserver?.disconnect()
      resizeObserver = null
      hostHeight.value = 0
      hostWidth.value = 0
      if (!el || typeof ResizeObserver === 'undefined') return

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry) return
        hostHeight.value = entry.contentRect.height
        if (observeWidth) hostWidth.value = entry.contentRect.width
      })
      resizeObserver.observe(el)
    },
    { flush: 'post' },
  )

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  return { listHost, hostHeight, hostWidth }
}
