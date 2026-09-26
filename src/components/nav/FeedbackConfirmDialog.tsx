import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTranslation } from 'react-i18next';

export type FeedbackConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function FeedbackConfirmDialog({ open, onClose, onConfirm }: FeedbackConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('nav.feedback')}</DialogTitle>
      <DialogContent>{t('nav.feedbackConfirm')}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('settings.cancel')}</Button>
        <Button color="primary" variant="contained" onClick={onConfirm}>
          {t('settings.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
