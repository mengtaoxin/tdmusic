import { useEffect, useRef } from 'react';

import { createAppPlaybackTransport } from '@/stores/bindAppPlayback';
import { useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

export function AudioHost() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transportRef = useRef<ReturnType<typeof createAppPlaybackTransport> | null>(null);
  if (transportRef.current == null) {
    transportRef.current = createAppPlaybackTransport(() => audioRef.current);
  }
  const transport = transportRef.current;

  const loadToken = usePlayerStore((s) => s.loadToken);
  const pendingPlay = usePlayerStore((s) => s.pendingPlay);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playing = usePlayerStore((s) => s.playing);
  const displayTitle = useCatalogStore((s) =>
    currentId ? (s.snapshot.trackById.get(currentId)?.displayTitle ?? null) : null,
  );
  const displayCover = useCatalogStore((s) =>
    currentId ? (s.snapshot.trackById.get(currentId)?.displayCover ?? null) : null,
  );

  useEffect(() => {
    void transport.loadCurrent();
  }, [loadToken, transport]);

  useEffect(() => {
    transport.syncMediaSession();
  }, [currentId, playing, displayTitle, displayCover, transport]);

  useEffect(() => {
    if (usePlayerStore.getState().currentId) transport.schedulePrefetch();
  }, [queue, transport]);

  useEffect(() => {
    transport.onRepeatModeChange(repeatMode);
  }, [repeatMode, transport]);

  useEffect(() => {
    transport.onPendingPlayChange(pendingPlay);
  }, [pendingPlay, transport]);

  useEffect(() => {
    transport.onSeekToChange(seekTo);
  }, [seekTo, transport]);

  useEffect(() => {
    function onVisibilityFlush() {
      usePlayerStore.getState().flushPersist();
    }

    function onPageHide() {
      transport.stopPlayHistory?.();
      usePlayerStore.getState().flushPersist();
    }

    transport.syncLoopFromRepeatMode();
    document.addEventListener('visibilitychange', onVisibilityFlush);
    window.addEventListener('pagehide', onPageHide);
    transport.syncMediaSession();

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityFlush);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [transport]);

  return (
    <audio
      ref={audioRef}
      data-testid="global-audio"
      preload="metadata"
      hidden
      onTimeUpdate={transport.onTimeUpdate}
      onPlay={transport.onPlay}
      onPause={transport.onPause}
      onEnded={transport.onEnded}
      onError={transport.onError}
    />
  );
}
