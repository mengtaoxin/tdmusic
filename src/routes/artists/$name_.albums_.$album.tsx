import { createFileRoute } from '@tanstack/react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DownloadAllButton } from '@/components/DownloadAllButton';
import { TrackList } from '@/components/TrackList';
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { localizeAlbumName } from '@/lib/catalog/displayLabels';
import { findArtistGroup, tracksForArtistAlbum } from '@/lib/routes/artistRoutes';
import { decodeRouteParam } from '@/lib/routes/routeParams';
import { selectArtists, useCatalogStore } from '@/stores/catalog';

export const Route = createFileRoute('/artists/$name_/albums_/$album')({
  component: ArtistAlbumDetailPage,
});

function ArtistAlbumDetailPage() {
  const { t } = useTranslation();
  const { name: nameParam, album: albumParam } = Route.useParams();
  const artistName = decodeRouteParam(nameParam);
  const albumName = decodeRouteParam(albumParam);
  const artists = useCatalogStore(selectArtists);
  const loading = useCatalogStore((s) => s.loading);

  const artist = findArtistGroup(artists, artistName);
  const tracks =
    artist != null
      ? tracksForArtistAlbum(artist.tracks, artist.name, albumName)
      : ([] as DisplayTrack[]);
  const albumFound = Boolean(artist) && tracks.length > 0;

  const { currentId, playTrackAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(
    tracks.map((track) => track.id),
  );

  return (
    <Container maxWidth={false} className="page">
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {localizeAlbumName(albumName || '', t) || t('nav.albumList')}
      </Typography>

      {!loading && !artist ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('artist.notFound')}
        </Alert>
      ) : null}

      {!loading && artist && !albumFound ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('artist.albumNotFound')}
        </Alert>
      ) : null}

      {albumFound ? (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <DownloadAllButton tracks={tracks} />
        </Box>
      ) : null}

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : (
        <TrackList
          tracks={tracks}
          currentId={currentId}
          onSelect={playTrackAt}
          onPlayNext={playNextTrack}
          onAddToQueue={addTrackToQueue}
        />
      )}
    </Container>
  );
}
