import i18n from '@/i18n';
import { useNoticeStore } from '@/stores/notice';
import { usePlayerStore } from '@/stores/player';

function notifyAddedToPlayNext() {
  useNoticeStore.getState().show(i18n.t('player.addedToPlayNext'));
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
      if (usePlayerStore.getState().playTrackFromList(ids, index)) {
        notifyAddedToPlayNext();
      }
    },
    playById: (id: string) => {
      const index = ids.indexOf(id);
      if (index < 0) return;
      if (usePlayerStore.getState().playTrackFromList(ids, index)) {
        notifyAddedToPlayNext();
      }
    },
    playNextTrack: (id: string) => {
      usePlayerStore.getState().playNext(id);
    },
    addTrackToQueue: (id: string) => {
      usePlayerStore.getState().addToQueue(id);
    },
  };
}
