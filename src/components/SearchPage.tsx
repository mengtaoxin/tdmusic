import { useState, type KeyboardEvent } from 'react';
import { Link } from '@tanstack/react-router';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';

import { TrackListItem } from '@/components/TrackListItem';
import { useTrackListPlayback } from '@/hooks/useTrackListPlayback';
import { localizeAlbumName, localizeArtistName } from '@/lib/catalog/displayLabels';
import { albumPath } from '@/lib/routes/albumRoutes';
import { artistAlbumsPath } from '@/lib/routes/artistRoutes';
import { pushSearchHistory, readSearchHistory } from '@/lib/searchHistory';
import { selectTracks, useCatalogStore } from '@/stores/catalog';

export function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>(() => readSearchHistory());
  const tracks = useCatalogStore(selectTracks);
  const search = useCatalogStore((s) => s.search);

  const { playById, playNextTrack, addTrackToQueue } = useTrackListPlayback(
    tracks.map((track) => track.id),
  );

  const results = search(query);
  const showHistory = !query.trim() && history.length > 0;

  function commitHistory() {
    setHistory(pushSearchHistory(query));
  }

  function applyHistoryItem(term: string) {
    setQuery(term);
    setHistory(pushSearchHistory(term));
  }

  function onSearchKeydown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commitHistory();
  }

  return (
    <Container maxWidth={false} className="page">
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {t('nav.search')}
      </Typography>
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onSearchKeydown}
        label={t('search.placeholder')}
        fullWidth
        variant="outlined"
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {showHistory ? (
        <>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t('search.history')}
          </Typography>
          <Box sx={{ mb: 2 }}>
            {history.map((term) => (
              <Chip
                key={term}
                label={term}
                variant="outlined"
                sx={{ m: 0.5 }}
                onClick={() => applyHistoryItem(term)}
              />
            ))}
          </Box>
        </>
      ) : null}

      {query.trim() ? (
        <>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t('search.tracks')}
          </Typography>
          <List sx={{ bgcolor: 'transparent', mb: 2 }}>
            {results.tracks.map((track) => (
              <TrackListItem
                key={track.id}
                track={track}
                onSelect={() => playById(track.id)}
                onPlayNext={() => playNextTrack(track.id)}
                onAddToQueue={() => addTrackToQueue(track.id)}
              />
            ))}
          </List>

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t('search.artists')}
          </Typography>
          <Box sx={{ mb: 1 }}>
            {results.artists.map((name) => (
              <Chip
                key={name}
                component={Link}
                to={artistAlbumsPath(name)}
                clickable
                label={localizeArtistName(name, t)}
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            {t('search.albums')}
          </Typography>
          <Box>
            {results.albums.map((name) => (
              <Chip
                key={name}
                component={Link}
                to={albumPath(name)}
                clickable
                label={localizeAlbumName(name, t)}
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </>
      ) : null}
    </Container>
  );
}
