import List from '@mui/material/List';

import { TrackListItem } from '@/components/TrackListItem';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';

export type TrackListProps = {
  tracks: DisplayTrack[];
  currentId?: string | null;
  onSelect?: (index: number) => void;
  onPlayNext?: (id: string) => void;
  onAddToQueue?: (id: string) => void;
};

export function TrackList({
  tracks,
  currentId = null,
  onSelect,
  onPlayNext,
  onAddToQueue,
}: TrackListProps) {
  return (
    <List sx={{ bgcolor: 'transparent', py: 0 }}>
      {tracks.map((track, index) => (
        <TrackListItem
          key={track.id}
          track={track}
          active={currentId === track.id}
          onSelect={() => onSelect?.(index)}
          onPlayNext={() => onPlayNext?.(track.id)}
          onAddToQueue={() => onAddToQueue?.(track.id)}
        />
      ))}
    </List>
  );
}
