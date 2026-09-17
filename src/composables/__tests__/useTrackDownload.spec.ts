import { describe, expect, it, beforeEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import { useTrackDownload } from '@/composables/useTrackDownload'
import {
  reportCacheDownload,
  resetCacheDownloadStateForTests,
} from '@/lib/cache/cacheDownloadState'

const track = { id: 't1', path: '/music/t1.mp3' }

describe('useTrackDownload', () => {
  beforeEach(() => {
    resetCacheDownloadStateForTests()
  })

  it('updates downloading and percent when cache ingest reports progress', async () => {
    let api!: ReturnType<typeof useTrackDownload>
    const Host = defineComponent({
      setup() {
        api = useTrackDownload(() => track)
        return () => null
      },
    })
    const wrapper = mount(Host)

    expect(api.downloading.value).toBe(false)
    expect(api.percent.value).toBeNull()

    reportCacheDownload(track.path, track.id, { phase: 'download', loaded: 50, total: 200 })
    await nextTick()

    expect(api.downloading.value).toBe(true)
    expect(api.percent.value).toBe(25)

    reportCacheDownload(track.path, track.id, { phase: 'done', loaded: 200, total: 200 })
    await nextTick()

    expect(api.downloading.value).toBe(false)
    expect(api.percent.value).toBeNull()
    wrapper.unmount()
  })
})
