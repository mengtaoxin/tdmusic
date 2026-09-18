import { createFileRoute } from '@tanstack/react-router'
import Alert from '@mui/material/Alert'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import { TrackList } from '@/components/TrackList'
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback'
import { localizeAlbumName } from '@/lib/catalog/displayLabels'
import { findAlbumGroup } from '@/lib/routes/albumRoutes'
import { decodeRouteParam } from '@/lib/routes/routeParams'
import { selectAlbums, useCatalogStore } from '@/stores/catalog'
import type { DisplayTrack } from '@/stores/catalog'

export const Route = createFileRoute('/albums/$album')({
  component: AlbumDetailPage,
})

function AlbumDetailPage() {
  const { t } = useTranslation()
  const { album: albumParam } = Route.useParams()
  const albumName = decodeRouteParam(albumParam)
  const albums = useCatalogStore(selectAlbums)
  const loading = useCatalogStore((s) => s.loading)

  const album = findAlbumGroup(albums, albumName)
  const tracks = album?.tracks ?? ([] as DisplayTrack[])

  const { player, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(
    tracks.map((track) => track.id),
  )

  return (
    <Container maxWidth={false} className="page">
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {localizeAlbumName(album?.name || albumName || '', t) || t('nav.albumList')}
      </Typography>

      {!loading && !album ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('album.notFound')}
        </Alert>
      ) : null}

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : album ? (
        <TrackList
          tracks={tracks}
          currentId={player.currentId}
          onSelect={playAt}
          onPlayNext={playNextTrack}
          onAddToQueue={addTrackToQueue}
        />
      ) : null}
    </Container>
  )
}
