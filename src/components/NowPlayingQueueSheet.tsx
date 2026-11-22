import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { alpha, type Theme } from '@mui/material/styles';

export type NowPlayingQueueSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

function contentBandSx(theme: Theme) {
  return {
    top: theme.layout.appBarHeight,
    bottom: theme.layout.footerClearance,
    height: 'auto' as const,
  };
}

/** Right-side sheet clipped to the page content band; width fills up to contentMaxWidth. */
export function NowPlayingQueueSheet({ open, onClose, children }: NowPlayingQueueSheetProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        root: {
          sx: contentBandSx,
        },
        backdrop: {
          sx: (theme) => ({
            ...contentBandSx(theme),
            bgcolor: alpha(theme.palette.common.black, 0.4),
          }),
        },
        paper: {
          sx: (theme) => ({
            ...contentBandSx(theme),
            width: '100%',
            maxWidth: theme.layout.contentMaxWidth,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
          }),
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
