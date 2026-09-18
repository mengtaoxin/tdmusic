import { createFileRoute } from '@tanstack/react-router'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import { useTranslation } from 'react-i18next'

import { TrackList } from '@/components/TrackList'
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback'
import { findPlaylistByName } from '@/lib/routes/playlistRoutes'
import { selectTrackById, useCatalogStore } from '@/stores/catalog'
import type { DisplayTrack } from '@/lib/catalog/catalogIndex'

export const Route = createFileRoute('/playlists/$name')({
  component: PlaylistDetailPage,
})

function PlaylistDetailPage() {
  const { t } = useTranslation()
  const { name: playlistParam } = Route.useParams()
  const playlists = useCatalogStore((s) => s.playlists)
  const trackById = useCatalogStore(selectTrackById)
  const loading = useCatalogStore((s) => s.loading)

  const playlist = findPlaylistByName(playlists, playlistParam)
  const tracks = playlist
    ? playlist.trackIds
        .map((id) => trackById.get(id))
        .filter((track): track is DisplayTrack => Boolean(track))
    : ([] as DisplayTrack[])

  const { currentId, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(
    tracks.map((track) => track.id),
  )

  function playAllInOrder() {
    if (!tracks.length) return
    playAt(0, { shuffle: false })
  }

  function shufflePlayAll() {
    if (!tracks.length) return
    const start = Math.floor(Math.random() * tracks.length)
    playAt(start, { shuffle: true })
  }

  return (
    <Container maxWidth={false} className="page">
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {playlist?.title || playlistParam || t('nav.playlist')}
      </Typography>

      {!loading && !playlist ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('playlist.notFound')}
        </Alert>
      ) : null}

      {tracks.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Button
            color="secondary"
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={playAllInOrder}
          >
            {t('playlist.playAll')}
          </Button>
          <Button
            color="secondary"
            variant="outlined"
            startIcon={<ShuffleIcon />}
            onClick={shufflePlayAll}
          >
            {t('playlist.shuffleAll')}
          </Button>
        </Box>
      ) : null}

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : (
        <TrackList
          tracks={tracks}
          currentId={currentId}
          onSelect={playAt}
          onPlayNext={playNextTrack}
          onAddToQueue={addTrackToQueue}
        />
      )}
    </Container>
  )
}
