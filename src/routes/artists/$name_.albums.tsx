import { createFileRoute } from '@tanstack/react-router';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { AlbumGallery, type AlbumGalleryTile } from '@/components/AlbumGallery';
import { localizeArtistName } from '@/lib/catalog/displayLabels';
import {
  artistAlbumPath,
  artistAlbumsGalleryEntries,
  artistPath,
  findArtistGroup,
} from '@/lib/routes/artistRoutes';
import { decodeRouteParam } from '@/lib/routes/routeParams';
import { selectArtists, useCatalogStore } from '@/stores/catalog';

/** Sentinel tile name for the all-music gallery entry (not an album title). */
const ALL_MUSIC_TILE_NAME = '__artist_all_music__';

export const Route = createFileRoute('/artists/$name_/albums')({
  component: ArtistAlbumsPage,
});

function ArtistAlbumsPage() {
  const { t } = useTranslation();
  const { name: nameParam } = Route.useParams();
  const artistName = decodeRouteParam(nameParam);
  const artists = useCatalogStore(selectArtists);
  const loading = useCatalogStore((s) => s.loading);

  const artist = findArtistGroup(artists, artistName);

  const galleryTiles: AlbumGalleryTile[] = artist
    ? artistAlbumsGalleryEntries(artist.tracks, artist.name).map((entry) => {
        if (entry.kind === 'all-music') {
          return {
            name: ALL_MUSIC_TILE_NAME,
            label: t('artist.allMusic'),
            trackCount: entry.trackCount,
            coverSrc: entry.coverSrc,
            to: artistPath(artist.name),
          };
        }
        return {
          name: entry.name,
          trackCount: entry.trackCount,
          coverSrc: entry.coverSrc,
        };
      })
    : [];

  function pathFor(album: string) {
    return artistAlbumPath(artist?.name ?? artistName, album);
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
        <AlbumGallery tiles={galleryTiles} pathFor={pathFor} />
      ) : null}
    </Container>
  );
}
