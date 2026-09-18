import { useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import AlbumIcon from '@mui/icons-material/Album'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RepeatIcon from '@mui/icons-material/Repeat'
import RepeatOneIcon from '@mui/icons-material/RepeatOne'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import { useTranslation } from 'react-i18next'

import { ClearUpcomingButton } from '@/components/ClearUpcomingButton'
import { CoverImg } from '@/components/CoverImg'
import { TrackListItem } from '@/components/TrackListItem'
import { VirtualRowList } from '@/components/VirtualRowList'
import { useTrackDownload } from '@/hooks/useTrackDownload'
import { localizeAlbumName, localizeArtistName } from '@/lib/catalog/displayLabels'
import type { DisplayTrack } from '@/lib/catalog/catalogIndex'
import { playingQueueRowIndex } from '@/lib/playback/queueListScroll'
import { artistAlbumPath, artistAlbumsPath } from '@/lib/routes/artistRoutes'
import { selectTrackById, useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

export const Route = createFileRoute('/now-playing')({
  component: NowPlayingPage,
})

const TRACK_ROW_HEIGHT = 64

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function NowPlayingPage() {
  const { t } = useTranslation()
  const trackById = useCatalogStore(selectTrackById)
  const queue = usePlayerStore((s) => s.queue)
  const currentId = usePlayerStore((s) => s.currentId)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const playing = usePlayerStore((s) => s.playing)
  const repeatMode = usePlayerStore((s) => s.repeatMode)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const seek = usePlayerStore((s) => s.seek)
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const prev = usePlayerStore((s) => s.prev)
  const next = usePlayerStore((s) => s.next)
  const goToIndex = usePlayerStore((s) => s.goToIndex)
  const removeAt = usePlayerStore((s) => s.removeAt)
  const clearUpcoming = usePlayerStore((s) => s.clearUpcoming)

  const current = currentId ? trackById.get(currentId) : undefined
  const { downloading } = useTrackDownload(current)

  const queueRows = useMemo(() => {
    const rows: { key: string; queueIndex: number; track: DisplayTrack }[] = []
    queue.forEach((id, queueIndex) => {
      const track = trackById.get(id)
      if (!track) return
      rows.push({ key: `${queueIndex}:${id}`, queueIndex, track })
    })
    return rows
  }, [queue, trackById])

  const playingRowIndex = playingQueueRowIndex(queueRows, currentIndex)
  const entryScrollIndexRef = useRef<number | null>(null)
  if (entryScrollIndexRef.current == null && playingRowIndex != null) {
    entryScrollIndexRef.current = playingRowIndex
  }

  const queueListHeight = `min(${Math.max(queueRows.length, 1) * TRACK_ROW_HEIGHT}px, ${'calc(100dvh - 64px - 88px - 6rem)'})`

  const progress = duration ? (currentTime / duration) * 100 : 0

  const RepeatModeIcon =
    repeatMode === 'one' ? RepeatOneIcon : repeatMode === 'all' ? RepeatIcon : RepeatIcon

  function onSeek(_event: Event, value: number | number[]) {
    const pct = Array.isArray(value) ? value[0]! : value
    if (!duration) return
    seek((pct / 100) * duration)
  }

  return (
    <Container
      maxWidth={false}
      data-testid="now-playing-page"
      className="page-narrow no-touch-callout"
    >
      {current ? (
        <Box className="player-hero" sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            className="cover-wrap"
            sx={{
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
          </Box>

          <Typography variant="h5" sx={{ mb: 0.5 }}>
            {current.displayTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
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
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('player.empty')}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h6" component="h2" sx={{ m: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {t('player.queue')}
        </Typography>
        {queueRows.length > 1 ? <ClearUpcomingButton onClick={clearUpcoming} /> : null}
      </Box>

      <VirtualRowList
        items={queueRows}
        itemHeight={TRACK_ROW_HEIGHT}
        height={queueListHeight}
        listClassName="queue-list"
        scrollToIndex={entryScrollIndexRef.current}
        getItemKey={(item) => item.key}
        renderRow={(item) => (
          <TrackListItem
            track={item.track}
            active={currentIndex === item.queueIndex}
            actions="queue"
            onSelect={() => goToIndex(item.queueIndex, true)}
            onRemove={() => removeAt(item.queueIndex)}
          />
        )}
      />
    </Container>
  )
}
