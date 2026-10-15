import { useEffect, useState, useSyncExternalStore } from 'react';

import { useManualDownload } from '@/hooks/useManualDownload';
import { useTrackDownload } from '@/hooks/useTrackDownload';
import {
  getTrackCacheDetails,
  getTrackDownloadFailure,
  subscribeCacheDownloads,
  type TrackCacheDetails,
} from '@/lib/cache/musicCache';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { getTrackPlayStats, type TrackPlayStats } from '@/lib/playback/playHistory';

/** Live download state plus what IndexedDB and play history know about one track. */
export function useTrackInfo(track: DisplayTrack) {
  const { downloading, percent } = useTrackDownload(track);
  const { remaining } = useManualDownload([track]);
  const failure = useSyncExternalStore(subscribeCacheDownloads, () =>
    getTrackDownloadFailure(track.path),
  );
  const [details, setDetails] = useState<TrackCacheDetails | null>(null);
  const [playStats, setPlayStats] = useState<TrackPlayStats | null>(null);

  useEffect(() => {
    if (downloading) return;
    let cancelled = false;
    void getTrackCacheDetails(track.path).then(
      (next) => {
        if (!cancelled) setDetails(next);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [track.path, downloading]);

  useEffect(() => {
    let cancelled = false;
    void getTrackPlayStats(track.id).then(
      (next) => {
        if (!cancelled) setPlayStats(next);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [track.id]);

  return { details, failure, downloading, percent, queued: remaining > 0, playStats };
}
