import { usePlayerStore } from '@/stores/player';

/** Row click: keep an existing queue and insert this track next; otherwise start that source list. */
function playClickedTrack(ids: string[], index: number) {
  const id = ids[index];
  if (id === undefined) return;
  const player = usePlayerStore.getState();
  if (player.queue.length > 0 && player.currentId) {
    player.playNext(id);
    return;
  }
  player.playFrom(index, ids);
}

/** Play helpers bound to a source id list. Catalog load lives on the root route. */
export function useTrackListPlayback(ids: string[]) {
  const currentId = usePlayerStore((s) => s.currentId);

  return {
    currentId,
    playAt: (index: number, options?: { shuffle?: boolean }) => {
      usePlayerStore.getState().playFrom(index, ids, options);
    },
    playTrackAt: (index: number) => {
      playClickedTrack(ids, index);
    },
    playById: (id: string) => {
      const index = ids.indexOf(id);
      if (index < 0) return;
      playClickedTrack(ids, index);
    },
    playNextTrack: (id: string) => {
      usePlayerStore.getState().playNext(id);
    },
    addTrackToQueue: (id: string) => {
      usePlayerStore.getState().addToQueue(id);
    },
  };
}
