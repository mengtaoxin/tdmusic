import i18n from '@/i18n';
import { clickTrack, type QueueSession } from '@/lib/playback/playbackQueue';
import { useNoticeStore } from '@/stores/notice';
import { usePlayerStore } from '@/stores/player';

function readQueueSession(player: ReturnType<typeof usePlayerStore.getState>): QueueSession {
  return {
    queue: player.queue,
    originalQueue: player.originalQueue,
    currentId: player.currentId,
    currentIndex: player.currentIndex,
    shuffle: player.shuffle,
    repeatMode: player.repeatMode,
  };
}

function notifyAddedToPlayNext() {
  useNoticeStore.getState().show(i18n.t('player.addedToPlayNext'));
}

/** Row click: queue next while audio is active; start the clicked track when paused. */
function playClickedTrack(ids: string[], index: number) {
  const player = usePlayerStore.getState();
  const result = clickTrack(
    readQueueSession(player),
    ids,
    index,
    player.playing || player.pendingPlay,
  );
  const id = ids[index];
  switch (result.kind) {
    case 'noop':
      return;
    case 'playFrom':
      player.playFrom(index, ids);
      return;
    case 'resume':
      player.play();
      return;
    case 'playIndex':
      player.goToIndex(result.index, true);
      return;
    case 'insertAndPlay':
      if (!id) return;
      player.playNext(id);
      player.goToIndex(result.index, true);
      return;
    case 'queueNext':
      if (!id) return;
      player.playNext(id);
      notifyAddedToPlayNext();
      return;
    case 'alreadyNext':
      notifyAddedToPlayNext();
      return;
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
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
