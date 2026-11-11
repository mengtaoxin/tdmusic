import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import AlbumIcon from '@mui/icons-material/Album';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { useTranslation } from 'react-i18next';

import { CoverImg } from '@/components/CoverImg';
import { TrackInfoDialog } from '@/components/TrackInfoDialog';
import { useTrackDownload } from '@/hooks/useTrackDownload';
import { localizeAlbumName, localizeArtistName } from '@/lib/catalog/displayLabels';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import type { RepeatMode } from '@/lib/playback/playerLogic';
import { artistAlbumPath, artistAlbumsPath } from '@/lib/routes/artistRoutes';

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export type NowPlayingHeroProps = {
  current: DisplayTrack | undefined;
  currentTime: number;
  duration: number;
  playing: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  seek: (time: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  togglePlay: () => void;
  prev: () => void;
  next: () => void;
};

export function NowPlayingHero({
  current,
  currentTime,
  duration,
  playing,
  repeatMode,
  shuffle,
  seek,
  toggleRepeat,
  toggleShuffle,
  togglePlay,
  prev,
  next,
}: NowPlayingHeroProps) {
  const { t } = useTranslation();
  const [infoTrackId, setInfoTrackId] = useState<string | null>(null);
  const { downloading } = useTrackDownload(current);

  if (!current) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        {t('player.empty')}
      </Alert>
    );
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const RepeatModeIcon =
    repeatMode === 'one' ? RepeatOneIcon : repeatMode === 'all' ? RepeatIcon : RepeatIcon;

  function onSeek(_event: Event, value: number | number[]) {
    const pct = Array.isArray(value) ? value[0]! : value;
    if (!duration) return;
    seek((pct / 100) * duration);
  }

  return (
    <Box className="player-hero" sx={{ textAlign: 'center', mb: 4 }}>
      <Box
        className="cover-wrap"
        sx={{
          position: 'relative',
          mx: 'auto',
          mb: 2,
          maxWidth: (theme) => theme.layout.coverMaxWidth,
          borderRadius: 'var(--td-radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--td-cover-shadow)',
          animation: 'td-album-rise 0.45s ease',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {current.displayCover || downloading ? (
          <CoverImg
            src={current.displayCover}
            aspectRatio={1}
            downloading={downloading}
            className="cover-art"
          />
        ) : (
          <Box
            className="cover-fallback"
            sx={{
              aspectRatio: '1',
              display: 'grid',
              placeItems: 'center',
              background: `linear-gradient(145deg, var(--td-cover-start), var(--td-cover-end))`,
              color: 'rgba(232, 241, 240, 0.7)',
            }}
          >
            <AlbumIcon sx={{ fontSize: 72 }} />
          </Box>
        )}
        <IconButton
          data-testid="now-playing-track-info"
          aria-label={t('trackInfo.open')}
          onClick={() => setInfoTrackId(current.id)}
          sx={{
            position: 'absolute',
            top: (theme) => theme.spacing(1),
            right: (theme) => theme.spacing(1),
            color: 'rgba(255, 255, 255, 0.42)',
            bgcolor: 'rgba(0, 0, 0, 0.14)',
            '&:hover': {
              color: 'rgba(255, 255, 255, 0.78)',
              bgcolor: 'rgba(0, 0, 0, 0.28)',
            },
          }}
        >
          <InfoOutlinedIcon />
        </IconButton>
      </Box>

      <Typography variant="h5" noWrap sx={{ mb: 0.5 }}>
        {current.displayTitle}
      </Typography>
      <Typography data-testid="now-playing-track-meta" color="text.secondary" noWrap sx={{ mb: 2 }}>
        <Box
          component={Link}
          to={artistAlbumsPath(current.displayArtist)}
          className="meta-link"
          sx={{
            color: 'inherit',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {localizeArtistName(current.displayArtist, t)}
        </Box>
        {current.displayAlbum ? (
          <>
            {' · '}
            <Box
              component={Link}
              to={artistAlbumPath(current.displayArtist, current.displayAlbum)}
              className="meta-link"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {localizeAlbumName(current.displayAlbum, t)}
            </Box>
          </>
        ) : null}
      </Typography>

      <Slider
        value={progress}
        max={100}
        color="secondary"
        onChange={onSeek}
        sx={{ mb: 0.5 }}
        aria-label="Seek"
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          typography: 'caption',
          mb: 2,
        }}
      >
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </Box>

      <Box
        className="controls"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
      >
        <IconButton
          color={repeatMode === 'off' ? 'default' : 'secondary'}
          onClick={toggleRepeat}
          aria-label="Repeat"
        >
          <RepeatModeIcon sx={{ opacity: repeatMode === 'off' ? 0.5 : 1 }} />
        </IconButton>
        <IconButton size="large" onClick={prev} aria-label="Previous">
          <SkipPreviousIcon fontSize="large" />
        </IconButton>
        <IconButton
          color="secondary"
          size="large"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          sx={{
            bgcolor: 'secondary.main',
            color: 'secondary.contrastText',
            '&:hover': { bgcolor: 'secondary.dark' },
            transition: 'transform 0.15s ease',
            '&:active': { transform: 'scale(0.94)' },
          }}
        >
          {playing ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
        </IconButton>
        <IconButton size="large" onClick={next} aria-label="Next">
          <SkipNextIcon fontSize="large" />
        </IconButton>
        <IconButton
          color={shuffle ? 'secondary' : 'default'}
          onClick={toggleShuffle}
          aria-label="Shuffle"
        >
          <ShuffleIcon sx={{ opacity: shuffle ? 1 : 0.5 }} />
        </IconButton>
      </Box>
      <TrackInfoDialog
        track={current}
        open={infoTrackId === current.id}
        onClose={() => setInfoTrackId(null)}
      />
    </Box>
  );
}
