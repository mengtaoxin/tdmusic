import { useEffect, useMemo } from 'react'

import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'
import { useCatalogStore, selectTracks } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

/** Ensure catalog is loaded, then expose play helpers bound to a source id list. */
export function useTrackListPlayback(sourceIds: string[] | (() => string[])) {
  const catalog = useCatalogStore()
  const player = usePlayerStore()
  const tracks = useCatalogStore(selectTracks)

  const ids = useMemo(
    () => (typeof sourceIds === 'function' ? sourceIds() : sourceIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass fresh arrays from store selectors
    [typeof sourceIds === 'function' ? tracks : sourceIds],
  )

  useEffect(() => {
    void ensureCatalogLoaded()
  }, [])

  return {
    catalog,
    player,
    playAt: (index: number) => {
      player.playFrom(index, ids)
    },
    playById: (id: string) => {
      const index = ids.indexOf(id)
      if (index < 0) return
      player.playFrom(index, ids)
    },
    playNextTrack: (id: string) => {
      player.playNext(id)
    },
    addTrackToQueue: (id: string) => {
      player.addToQueue(id)
    },
  }
}
