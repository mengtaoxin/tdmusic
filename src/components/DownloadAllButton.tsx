import Button from '@mui/material/Button';
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

  return (
    <Button
      data-testid="download-all"
      color="secondary"
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={downloadAll}
    >
      {remaining > 0
        ? t('player.downloadAllRemaining', { count: remaining })
        : t('player.downloadAll')}
    </Button>
  );
}
