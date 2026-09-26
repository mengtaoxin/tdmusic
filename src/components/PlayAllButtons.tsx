import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useTranslation } from 'react-i18next';

export type PlayAllButtonsProps = {
  onPlayAll: () => void;
  onShuffleAll: () => void;
};

export function PlayAllButtons({ onPlayAll, onShuffleAll }: PlayAllButtonsProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
      <Button
        color="secondary"
        variant="contained"
        startIcon={<PlayArrowIcon />}
        onClick={onPlayAll}
      >
        {t('player.playAll')}
      </Button>
      <Button
        color="secondary"
        variant="outlined"
        startIcon={<ShuffleIcon />}
        onClick={onShuffleAll}
      >
        {t('player.shuffleAll')}
      </Button>
    </Box>
  );
}
