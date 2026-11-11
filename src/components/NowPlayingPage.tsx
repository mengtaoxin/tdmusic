import { useMemo } from 'react';
import Container from '@mui/material/Container';

import { NowPlayingHero } from '@/components/NowPlayingHero';
import { NowPlayingQueue } from '@/components/NowPlayingQueue';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { selectTrackById, useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

export function NowPlayingPage() {
  const trackById = useCatalogStore(selectTrackById);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const playing = usePlayerStore((s) => s.playing);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const seek = usePlayerStore((s) => s.seek);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const prev = usePlayerStore((s) => s.prev);
  const next = usePlayerStore((s) => s.next);
  const goToIndex = usePlayerStore((s) => s.goToIndex);
  const removeAt = usePlayerStore((s) => s.removeAt);
  const clearUpcoming = usePlayerStore((s) => s.clearUpcoming);

  const current = currentId ? trackById.get(currentId) : undefined;

  const queueRows = useMemo(() => {
    const rows: { key: string; queueIndex: number; track: DisplayTrack }[] = [];
    queue.forEach((id, queueIndex) => {
      const track = trackById.get(id);
      if (!track) return;
      rows.push({ key: `${queueIndex}:${id}`, queueIndex, track });
    });
    return rows;
  }, [queue, trackById]);

  return (
    <Container
      maxWidth={false}
      data-testid="now-playing-page"
      className="page-narrow no-touch-callout"
    >
      <NowPlayingHero
        current={current}
        currentTime={currentTime}
        duration={duration}
        playing={playing}
        repeatMode={repeatMode}
        shuffle={shuffle}
        seek={seek}
        toggleRepeat={toggleRepeat}
        toggleShuffle={toggleShuffle}
        togglePlay={togglePlay}
        prev={prev}
        next={next}
      />
      <NowPlayingQueue
        queueRows={queueRows}
        currentIndex={currentIndex}
        goToIndex={goToIndex}
        removeAt={removeAt}
        clearUpcoming={clearUpcoming}
      />
    </Container>
  );
}
