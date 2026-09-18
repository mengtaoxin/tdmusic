import { createFileRoute } from '@tanstack/react-router'
import Alert from '@mui/material/Alert'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import { TrackList } from '@/components/TrackList'
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback'
import { localizeArtistName } from '@/lib/catalog/displayLabels'
import { findArtistGroup } from '@/lib/routes/artistRoutes'
import { decodeRouteParam } from '@/lib/routes/routeParams'
import { selectArtists, useCatalogStore } from '@/stores/catalog'
import type { DisplayTrack } from '@/stores/catalog'

export const Route = createFileRoute('/artists/$name')({
  component: ArtistTracksPage,
})

function ArtistTracksPage() {
  const { t } = useTranslation()
  const { name: nameParam } = Route.useParams()
  const artistName = decodeRouteParam(nameParam)
  const artists = useCatalogStore(selectArtists)
  const loading = useCatalogStore((s) => s.loading)

  const artist = findArtistGroup(artists, artistName)
  const tracks = artist?.tracks ?? ([] as DisplayTrack[])

  const { player, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(
    tracks.map((track) => track.id),
  )

  return (
    <Container maxWidth={false} className="page">
      <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
        {localizeArtistName(artist?.name || artistName || '', t) || t('nav.artistList')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {t('artist.allMusic')}
      </Typography>

      {!loading && !artist ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('artist.notFound')}
        </Alert>
      ) : null}

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : (
        <TrackList
          tracks={tracks}
          currentId={player.currentId}
          onSelect={playAt}
          onPlayNext={playNextTrack}
          onAddToQueue={addTrackToQueue}
        />
      )}
    </Container>
  )
}
