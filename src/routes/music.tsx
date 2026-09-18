import { useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'

import { TrackListItem } from '@/components/TrackListItem'
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback'
import { useVirtualListHost } from '@/hooks/useVirtualListHost'
import { capVirtualListHeight, virtualListNeedsScroll } from '@/lib/virtualListHeight'
import { selectTracks, useCatalogStore } from '@/stores/catalog'

export const Route = createFileRoute('/music')({
  component: MusicPage,
})

const TRACK_ROW_HEIGHT = 64

function MusicPage() {
  const { t } = useTranslation()
  const tracks = useCatalogStore(selectTracks)
  const loading = useCatalogStore((s) => s.loading)
  const loadError = useCatalogStore((s) => s.loadError)
  const errors = useCatalogStore((s) => s.errors)
  const { listHostRef, hostHeight } = useVirtualListHost()
  const scrollParentRef = useRef<HTMLDivElement | null>(null)

  const { player, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(
    tracks.map((track) => track.id),
  )

  const listHeight = capVirtualListHeight(tracks.length, TRACK_ROW_HEIGHT, hostHeight)
  const listFlush = !virtualListNeedsScroll(tracks.length, TRACK_ROW_HEIGHT, hostHeight)

  const rowVirtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => TRACK_ROW_HEIGHT,
    overscan: 8,
  })

  return (
    <Container
      maxWidth={false}
      className="page music-list-page"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {t('nav.musicList')}
      </Typography>

      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {errors.map((err, i) => (
        <Alert key={i} severity="warning" sx={{ mb: 1 }}>
          {t('catalog.configError', { message: err })}
        </Alert>
      ))}

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : (
        <Box ref={listHostRef} className="list-host" sx={{ flex: '1 1 auto', minHeight: 0 }}>
          <Box
            ref={scrollParentRef}
            className={`track-list${listFlush ? ' track-list--flush' : ''}`}
            sx={{
              height: listHeight,
              overflowY: listFlush ? 'hidden' : 'auto',
              bgcolor: 'transparent',
              position: 'relative',
            }}
          >
            <Box
              sx={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const track = tracks[virtualRow.index]
                if (!track) return null
                return (
                  <Box
                    key={track.id}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <TrackListItem
                      track={track}
                      active={player.currentId === track.id}
                      onSelect={() => playAt(virtualRow.index)}
                      onPlayNext={() => playNextTrack(track.id)}
                      onAddToQueue={() => addTrackToQueue(track.id)}
                    />
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  )
}
