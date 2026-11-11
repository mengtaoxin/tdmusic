import { useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ClearUpcomingButton } from '@/components/ClearUpcomingButton';
import { TRACK_ROW_HEIGHT, TrackListItem } from '@/components/TrackListItem';
import { VirtualRowList } from '@/components/VirtualRowList';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { playingQueueRowIndex } from '@/lib/playback/queueListScroll';

export type NowPlayingQueueRow = {
  key: string;
  queueIndex: number;
  track: DisplayTrack;
};

export type NowPlayingQueueProps = {
  queueRows: NowPlayingQueueRow[];
  currentIndex: number;
  goToIndex: (index: number, autoPlay: boolean) => void;
  removeAt: (index: number) => void;
  clearUpcoming: () => void;
};

export function NowPlayingQueue({
  queueRows,
  currentIndex,
  goToIndex,
  removeAt,
  clearUpcoming,
}: NowPlayingQueueProps) {
  const { t } = useTranslation();
  const playingRowIndex = playingQueueRowIndex(queueRows, currentIndex);
  const entryScrollIndexRef = useRef<number | null>(null);
  if (entryScrollIndexRef.current == null && playingRowIndex != null) {
    entryScrollIndexRef.current = playingRowIndex;
  }

  const queueListHeight = `min(${Math.max(queueRows.length, 1) * TRACK_ROW_HEIGHT}px, ${'calc(100dvh - 64px - 88px - 6rem)'})`;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h6" component="h2" sx={{ m: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {t('player.queue')}
        </Typography>
        {queueRows.length > 1 ? <ClearUpcomingButton onClick={clearUpcoming} /> : null}
      </Box>

      <VirtualRowList
        items={queueRows}
        itemHeight={TRACK_ROW_HEIGHT}
        height={queueListHeight}
        listClassName="queue-list"
        scrollToIndex={entryScrollIndexRef.current}
        getItemKey={(item) => item.key}
        renderRow={(item) => (
          <TrackListItem
            track={item.track}
            active={currentIndex === item.queueIndex}
            actions="queue"
            onSelect={() => goToIndex(item.queueIndex, true)}
            onRemove={() => removeAt(item.queueIndex)}
          />
        )}
      />
    </>
  );
}
