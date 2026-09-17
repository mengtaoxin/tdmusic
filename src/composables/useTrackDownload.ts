import { computed, onScopeDispose, shallowRef, toValue, type MaybeRefOrGetter } from 'vue'

import {
  isTrackDownloading,
  subscribeCacheDownloads,
  trackDownloadPercent,
  type CacheDownloadTrackRef,
} from '@/lib/cache/musicCache'

export function useTrackDownload(track: MaybeRefOrGetter<CacheDownloadTrackRef | undefined>) {
  const tick = shallowRef(0)
  const stop = subscribeCacheDownloads(() => {
    tick.value += 1
  })
  onScopeDispose(stop)

  const downloading = computed(() => {
    void tick.value
    const current = toValue(track)
    return current ? isTrackDownloading(current) : false
  })

  const percent = computed(() => {
    void tick.value
    const current = toValue(track)
    return current ? trackDownloadPercent(current) : null
  })

  return { downloading, percent }
}
