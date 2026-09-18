import { createFileRoute, Link } from '@tanstack/react-router'
import Alert from '@mui/material/Alert'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import { useTranslation } from 'react-i18next'

import { AlbumGallery } from '@/components/AlbumGallery'
import { localizeArtistName } from '@/lib/catalog/displayLabels'
import { firstAlbumCoverSrc } from '@/lib/routes/albumRoutes'
import {
  albumsForArtist,
  artistAlbumPath,
  artistPath,
  findArtistGroup,
} from '@/lib/routes/artistRoutes'
import { decodeRouteParam } from '@/lib/routes/routeParams'
import { selectArtists, useCatalogStore } from '@/stores/catalog'

export const Route = createFileRoute('/artists/$name_/albums')({
  component: ArtistAlbumsPage,
})

function ArtistAlbumsPage() {
  const { t } = useTranslation()
  const { name: nameParam } = Route.useParams()
  const artistName = decodeRouteParam(nameParam)
  const artists = useCatalogStore(selectArtists)
  const loading = useCatalogStore((s) => s.loading)

  const artist = findArtistGroup(artists, artistName)

  const albumTiles = artist
    ? albumsForArtist(artist.tracks, artist.name).map((group) => ({
        name: group.name,
        trackCount: group.tracks.length,
        coverSrc: firstAlbumCoverSrc(group.tracks),
      }))
    : []

  function pathFor(album: string) {
    return artistAlbumPath(artist?.name ?? artistName, album)
  }

  return (
    <Container
      maxWidth={false}
      className="page artist-albums-page"
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
        {localizeArtistName(artist?.name || artistName || '', t) || t('nav.artistList')}
      </Typography>

      {!loading && !artist ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('artist.notFound')}
        </Alert>
      ) : null}

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : artist ? (
        <>
          <List sx={{ bgcolor: 'transparent', mb: 2, p: 0, flexGrow: 0 }}>
            <ListItemButton component={Link} to={artistPath(artist.name)} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <MusicNoteIcon />
              </ListItemIcon>
              <ListItemText
                primary={t('artist.allMusic')}
                secondary={t('artist.trackCount', { count: artist.tracks.length })}
              />
              <ChevronRightIcon />
            </ListItemButton>
          </List>

          <AlbumGallery tiles={albumTiles} pathFor={pathFor} />
        </>
      ) : null}
    </Container>
  )
}
