import {
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'

/**
 * Becomes true once `el` intersects the viewport (or immediately when `eager`).
 * Falls back to visible when IntersectionObserver is unavailable.
 */
export function useLazyLoad(
  el: Ref<Element | null>,
  eager: MaybeRefOrGetter<boolean> = false,
): Ref<boolean> {
  const visible = ref(toValue(eager))

  let observer: IntersectionObserver | null = null

  function disconnect() {
    observer?.disconnect()
    observer = null
  }

  function observe() {
    disconnect()
    if (visible.value) return

    const target = el.value
    if (!target) return

    if (typeof IntersectionObserver === 'undefined') {
      visible.value = true
      return
    }

    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        visible.value = true
        disconnect()
      }
    })
    observer.observe(target)
  }

  onMounted(() => {
    if (toValue(eager)) {
      visible.value = true
      return
    }
    observe()
  })

  watch(
    () => toValue(eager),
    (isEager) => {
      if (isEager) {
        visible.value = true
        disconnect()
      }
    },
  )

  onBeforeUnmount(disconnect)

  return visible
}
