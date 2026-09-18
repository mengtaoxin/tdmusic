import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'

import { useTrackListPlayback } from '@/hooks/useTrackListPlayback'
import * as catalogBootstrap from '@/lib/catalog/catalogBootstrap'
import { usePlayerStore } from '@/stores/player'

type Api = ReturnType<typeof useTrackListPlayback>

function Harness({ ids, onReady }: { ids: string[]; onReady: (api: Api) => void }) {
  const api = useTrackListPlayback(ids)
  useEffect(() => {
    onReady(api)
  }, [api, onReady])
  return null
}

describe('useTrackListPlayback', () => {
  it('ensures catalog on mount and wires playAt / playNext / addToQueue', async () => {
    const ensure = vi.spyOn(catalogBootstrap, 'ensureCatalogLoaded').mockResolvedValue(undefined)
    let api!: Api

    render(
      <Harness
        ids={['a', 'b', 'c']}
        onReady={(value) => {
          api = value
        }}
      />,
    )

    await waitFor(() => {
      expect(ensure).toHaveBeenCalled()
      expect(api).toBeDefined()
    })

    const playFrom = vi.spyOn(usePlayerStore.getState(), 'playFrom')
    const playNext = vi.spyOn(usePlayerStore.getState(), 'playNext')
    const addToQueue = vi.spyOn(usePlayerStore.getState(), 'addToQueue')

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
