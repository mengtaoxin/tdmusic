import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';

import { useManualDownload } from '@/hooks/useManualDownload';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';

export type DownloadAllButtonProps = {
  tracks: DisplayTrack[];
};

export function DownloadAllButton({ tracks }: DownloadAllButtonProps) {
  const { t } = useTranslation();
  const { remaining, downloadAll } = useManualDownload(tracks);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function confirmDownloadAll() {
    setConfirmOpen(false);
    downloadAll();
  }

  return (
    <>
      <Button
        data-testid="download-all"
        color="secondary"
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => setConfirmOpen(true)}
      >
        {remaining > 0
          ? t('player.downloadAllRemaining', { count: remaining })
          : t('player.downloadAll')}
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('player.downloadAll')}</DialogTitle>
        <DialogContent>{t('player.downloadAllConfirm', { count: tracks.length })}</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('settings.cancel')}</Button>
          <Button color="primary" variant="outlined" onClick={confirmDownloadAll}>
            {t('settings.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
