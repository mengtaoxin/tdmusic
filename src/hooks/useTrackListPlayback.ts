import { useMemo } from 'react';

import { useCatalogStore, selectTracks } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

/** Play helpers bound to a source id list. Catalog load lives on the root route. */
export function useTrackListPlayback(sourceIds: string[] | (() => string[])) {
  const currentId = usePlayerStore((s) => s.currentId);
  const tracks = useCatalogStore(selectTracks);

  const ids = useMemo(
    () => (typeof sourceIds === 'function' ? sourceIds() : sourceIds),
    // callers pass fresh arrays from store selectors
    [typeof sourceIds === 'function' ? tracks : sourceIds],
  );

  return {
    currentId,
    playAt: (index: number, options?: { shuffle?: boolean }) => {
      usePlayerStore.getState().playFrom(index, ids, options);
    },
    playById: (id: string) => {
      const index = ids.indexOf(id);
      if (index < 0) return;
      usePlayerStore.getState().playFrom(index, ids);
    },
    playNextTrack: (id: string) => {
      usePlayerStore.getState().playNext(id);
    },
    addTrackToQueue: (id: string) => {
      usePlayerStore.getState().addToQueue(id);
    },
  };
}
