import Snackbar from '@mui/material/Snackbar';
import { useTheme } from '@mui/material/styles';

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
        },
      }}
      style={{ bottom }}
    />
  );
}
