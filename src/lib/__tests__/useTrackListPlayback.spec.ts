import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'

import { useTrackListPlayback } from '@/lib/useTrackListPlayback'
import * as catalogBootstrap from '@/stores/catalogBootstrap'
import { usePlayerStore } from '@/stores/player'

describe('useTrackListPlayback', () => {
  it('ensures catalog on mount and wires playAt / playNext / addToQueue', async () => {
    const ensure = vi.spyOn(catalogBootstrap, 'ensureCatalogLoaded').mockResolvedValue(undefined)

    const ids = ref(['a', 'b', 'c'])
    let api!: ReturnType<typeof useTrackListPlayback>

    const Host = defineComponent({
      setup() {
        api = useTrackListPlayback(() => ids.value)
        return () => null
      },
    })

    const pinia = createPinia()
    mount(Host, { global: { plugins: [pinia] } })
    await nextTick()
    await flushPromises()

    expect(ensure).toHaveBeenCalledOnce()

    const player = usePlayerStore(pinia)
    const playFrom = vi.spyOn(player, 'playFrom')
    const playNext = vi.spyOn(player, 'playNext')
    const addToQueue = vi.spyOn(player, 'addToQueue')

    api.playAt(1)
    expect(playFrom).toHaveBeenCalledWith(1, ['a', 'b', 'c'])

    api.playNextTrack('b')
    expect(playNext).toHaveBeenCalledWith('b')

    api.addTrackToQueue('c')
    expect(addToQueue).toHaveBeenCalledWith('c')

    api.playById('b')
    expect(playFrom).toHaveBeenCalledWith(1, ['a', 'b', 'c'])
  })
})
