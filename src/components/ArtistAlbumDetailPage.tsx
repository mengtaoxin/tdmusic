import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import { useTranslation } from 'react-i18next';

import { PlayAllButtons } from '@/components/PlayAllButtons';
import { TrackList } from '@/components/TrackList';
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { findArtistGroup, tracksForArtistAlbum } from '@/lib/routes/artistRoutes';
import { selectArtists, useCatalogStore } from '@/stores/catalog';

export function ArtistAlbumDetailPage({
  artistName,
  albumName,
}: {
  artistName: string;
  albumName: string;
}) {
  const { t } = useTranslation();
  const artists = useCatalogStore(selectArtists);
  const loading = useCatalogStore((s) => s.loading);

  const artist = findArtistGroup(artists, artistName);
  const tracks =
    artist != null
      ? tracksForArtistAlbum(artist.tracks, artist.name, albumName)
      : ([] as DisplayTrack[]);
  const albumFound = Boolean(artist) && tracks.length > 0;

  const { currentId, playAt, playTrackAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(
    tracks.map((track) => track.id),
  );

  function playAllInOrder() {
    if (!tracks.length) return;
    playAt(0, { shuffle: false });
  }

  function shufflePlayAll() {
    if (!tracks.length) return;
    const start = Math.floor(Math.random() * tracks.length);
    playAt(start, { shuffle: true });
  }

  return (
    <Container maxWidth={false} className="page">
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
        <PlayAllButtons
          onPlayAll={playAllInOrder}
          onShuffleAll={shufflePlayAll}
          downloadTracks={tracks}
        />
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
