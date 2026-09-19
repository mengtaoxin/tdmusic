import Button from '@mui/material/Button'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import { useTranslation } from 'react-i18next'

type ClearUpcomingButtonProps = {
  onClick: () => void
}

export function ClearUpcomingButton({ onClick }: ClearUpcomingButtonProps) {
  const { t } = useTranslation()
  return (
    <Button
      data-testid="clear-upcoming"
      color="secondary"
      variant="contained"
      startIcon={<PlaylistRemoveIcon />}
      sx={{ flexShrink: 0 }}
      onClick={onClick}
    >
      {t('player.clearUpcoming')}
    </Button>
  )
}
