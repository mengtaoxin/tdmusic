import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Avatar from '@mui/material/Avatar'
import { useTheme } from '@mui/material/styles'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { MouseEvent } from 'react'

import { CoverImg } from '@/components/CoverImg'
import { useTrackDownload } from '@/hooks/useTrackDownload'
import { localizeArtistName } from '@/lib/catalog/displayLabels'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'

export function NowPlayingFooter() {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const currentId = usePlayerStore((s) => s.currentId)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const playing = usePlayerStore((s) => s.playing)
  const prev = usePlayerStore((s) => s.prev)
  const next = usePlayerStore((s) => s.next)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const seek = usePlayerStore((s) => s.seek)
  const current = useCatalogStore((s) =>
    currentId ? s.snapshot.trackById.get(currentId) : undefined,
  )
  const { downloading } = useTrackDownload(current)

  if (!current) return null

  const progress = duration ? (currentTime / duration) * 100 : 0

  function openNowPlaying() {
    void navigate({ to: '/now-playing' })
  }

  function onSeek(pct: number) {
    if (!duration) return
    seek((pct / 100) * duration)
  }

  function onProgressClick(event: MouseEvent<HTMLElement>) {
    if (!duration) return
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    const pct = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
    onSeek(pct)
  }

  const footerGradient = `linear-gradient(90deg, ${theme.layout.footerStart} 0%, ${theme.layout.footerMid} 55%, ${theme.layout.footerEnd} 100%)`

  return (
    <Box
      component="footer"
      className="now-playing-footer"
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        height: 72,
        background: footerGradient,
        color: 'text.primary',
        borderTop: (t) =>
          `1px solid color-mix(in srgb, ${t.palette.secondary.main} 25%, transparent)`,
        boxShadow: 8,
        transition: 'transform 0.25s ease, opacity 0.25s ease',
      }}
    >
      <LinearProgress
        data-testid="footer-progress"
        className="footer-progress"
        variant="determinate"
        value={progress}
        aria-label="playback progress"
        onClick={onProgressClick}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          height: 3,
          cursor: 'pointer',
          bgcolor: 'transparent',
          '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' },
        }}
      />
      <Box
        className="footer-inner"
        onClick={openNowPlaying}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          cursor: 'pointer',
        }}
      >
        <Avatar
          variant="rounded"
          sx={{ width: 48, height: 48, bgcolor: 'action.hover', flexShrink: 0 }}
        >
          {current.displayCover || downloading ? (
            <CoverImg src={current.displayCover} downloading={downloading} />
          ) : (
            <MusicNoteIcon />
          )}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              fontWeight: 600,
              letterSpacing: '0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {current.displayTitle}
          </Box>
          <Box
            sx={{
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              typography: 'body2',
            }}
          >
            {localizeArtistName(current.displayArtist || '', t)}
          </Box>
        </Box>
        <IconButton
          data-testid="footer-prev"
          onClick={(event) => {
            event.stopPropagation()
            prev()
          }}
        >
          <SkipPreviousIcon />
        </IconButton>
        <IconButton
          onClick={(event) => {
            event.stopPropagation()
            togglePlay()
          }}
        >
          {playing ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton
          data-testid="footer-next"
          onClick={(event) => {
            event.stopPropagation()
            next()
          }}
        >
          <SkipNextIcon />
        </IconButton>
      </Box>
    </Box>
  )
}
