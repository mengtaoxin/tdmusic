import { useSyncExternalStore } from 'react';

import {
  enqueueManualDownloads,
  isTrackQueuedForDownload,
  subscribeManualDownloads,
  type ManualDownloadTrackRef,
} from '@/lib/cache/musicCache';

/** Manual (low-priority, persisted) downloads for a list of tracks. */
export function useManualDownload(tracks: readonly ManualDownloadTrackRef[]) {
  const remaining = useSyncExternalStore(
    subscribeManualDownloads,
    () => tracks.filter((track) => isTrackQueuedForDownload(track.path)).length,
  );

  function downloadAll() {
    void enqueueManualDownloads(tracks.map(({ id, path }) => ({ id, path })));
  }

  return { remaining, downloadAll };
}
