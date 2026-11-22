import { useEffect, useRef, type ReactNode } from 'react';
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
  const paperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const paper = paperRef.current;
      const target = event.target;
      if (!paper || !(target instanceof Node) || paper.contains(target)) return;
      onClose();
    };

    // Capture so app-bar / footer clicks (outside the clipped Modal band) still dismiss.
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open, onClose]);

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
          ref: paperRef,
          sx: (theme) => {
            const inset = theme.spacing(1.5);
            return {
              top: `calc(${theme.layout.appBarHeight} + ${inset})`,
              bottom: `calc(${theme.layout.footerClearance} + ${inset})`,
              right: inset,
              height: 'auto',
              width: `calc(100% - (${inset}) * 2)`,
              maxWidth: theme.layout.contentMaxWidth,
              borderRadius: theme.layout.radiusLg,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
            };
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
