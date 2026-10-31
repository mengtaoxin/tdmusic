import Snackbar from '@mui/material/Snackbar';
import { alpha, useTheme } from '@mui/material/styles';

import { useNoticeStore } from '@/stores/notice';

export function AppNotice() {
  const theme = useTheme();
  const message = useNoticeStore((state) => state.message);
  const open = useNoticeStore((state) => state.open);
  const nonce = useNoticeStore((state) => state.nonce);
  const close = useNoticeStore((state) => state.close);
  const bottom = `calc(${theme.layout.footerClearance} + ${theme.spacing(1)})`;

  return (
    <Snackbar
      key={nonce}
      open={open}
      autoHideDuration={4000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message={message}
      onClose={(_event, reason) => {
        if (reason === 'clickaway') return;
        close();
      }}
      slotProps={{
        content: {
          role: 'status',
          'aria-live': 'polite',
          sx: {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 600,
            letterSpacing: '0.01em',
            px: 2.5,
            py: 1.25,
            boxShadow: `0 10px 28px ${alpha(theme.palette.primary.main, 0.5)}`,
          },
        },
      }}
      style={{ bottom }}
    />
  );
}
