import Alert from '@mui/material/Alert'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import { PlayAllButtons } from '@/components/PlayAllButtons'
import { TrackList } from '@/components/TrackList'
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback'
import { localizeAlbumName } from '@/lib/catalog/displayLabels'
import { findAlbumGroup } from '@/lib/routes/albumRoutes'
import { selectAlbums, useCatalogStore } from '@/stores/catalog'
import type { DisplayTrack } from '@/lib/catalog/catalogIndex'

export function AlbumDetailPage({ albumName }: { albumName: string }) {
  const { t } = useTranslation()
  const albums = useCatalogStore(selectAlbums)
  const loading = useCatalogStore((s) => s.loading)

  const album = findAlbumGroup(albums, albumName)
  const tracks = album?.tracks ?? ([] as DisplayTrack[])

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
        {localizeAlbumName(album?.name || albumName || '', t) || t('nav.albumList')}
      </Typography>

      {!loading && !album ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('album.notFound')}
        </Alert>
      ) : null}

      {tracks.length > 0 ? (
        <PlayAllButtons onPlayAll={playAllInOrder} onShuffleAll={shufflePlayAll} />
      ) : null}

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : album ? (
        <TrackList
          tracks={tracks}
          currentId={currentId}
          onSelect={playAt}
          onPlayNext={playNextTrack}
          onAddToQueue={addTrackToQueue}
        />
      ) : null}
    </Container>
  )
}
