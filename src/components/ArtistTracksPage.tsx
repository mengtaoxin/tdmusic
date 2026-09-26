import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PlayAllButtons } from '@/components/PlayAllButtons';
import { TrackList } from '@/components/TrackList';
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback';
import { localizeArtistName } from '@/lib/catalog/displayLabels';
import { findArtistGroup } from '@/lib/routes/artistRoutes';
import { selectArtists, useCatalogStore } from '@/stores/catalog';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';

export function ArtistTracksPage({ artistName }: { artistName: string }) {
  const { t } = useTranslation();
  const artists = useCatalogStore(selectArtists);
  const loading = useCatalogStore((s) => s.loading);

  const artist = findArtistGroup(artists, artistName);
  const tracks = artist?.tracks ?? ([] as DisplayTrack[]);

  const { currentId, playAt, playNextTrack, addTrackToQueue } = useTrackListPlayback(
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

      {tracks.length > 0 ? (
        <PlayAllButtons onPlayAll={playAllInOrder} onShuffleAll={shufflePlayAll} />
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
  );
}
