import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';

export type NowPlayingQueueSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** Near-fullscreen bottom sheet that hosts the now-playing queue list. */
export function NowPlayingQueueSheet({ open, onClose, children }: NowPlayingQueueSheetProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            height: '100%',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
          },
        },
      }}
    >
      <Box
        data-testid="now-playing-queue-sheet"
        className="page-narrow no-touch-callout"
        sx={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: 'var(--td-content-max-width)',
          mx: 'auto',
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          px: 2,
          pt: 2,
          pb: 2,
        }}
      >
        {children}
      </Box>
    </Drawer>
  );
}
