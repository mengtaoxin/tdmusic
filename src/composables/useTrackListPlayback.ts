import { onMounted, toValue, type MaybeRefOrGetter } from 'vue'

import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

/**
 * Shared track-list playback helpers: ensure catalog on mount, playFrom /
 * playNext / addToQueue against a source id list.
 */
export function useTrackListPlayback(sourceIds: MaybeRefOrGetter<string[]>) {
  const catalog = useCatalogStore()
  const player = usePlayerStore()

  onMounted(() => {
    void ensureCatalogLoaded()
  })

  function playAt(index: number) {
    player.playFrom(index, toValue(sourceIds))
  }

  function playById(id: string) {
    const ids = toValue(sourceIds)
    const index = ids.indexOf(id)
    if (index >= 0) player.playFrom(index, ids)
  }

  function playNextTrack(id: string) {
    player.playNext(id)
  }

  function addTrackToQueue(id: string) {
    player.addToQueue(id)
  }

  return {
    catalog,
    player,
    playAt,
    playById,
    playNextTrack,
    addTrackToQueue,
  }
}
