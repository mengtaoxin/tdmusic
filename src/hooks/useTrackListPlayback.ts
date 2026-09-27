import { usePlayerStore } from '@/stores/player';

/** Play helpers bound to a source id list. Catalog load lives on the root route. */
export function useTrackListPlayback(ids: string[]) {
  const currentId = usePlayerStore((s) => s.currentId);

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
