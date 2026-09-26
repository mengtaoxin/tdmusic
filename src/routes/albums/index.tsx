import { createFileRoute } from '@tanstack/react-router';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { AlbumGallery } from '@/components/AlbumGallery';
import { albumPath, firstAlbumCoverSrc } from '@/lib/routes/albumRoutes';
import { selectAlbums, useCatalogStore } from '@/stores/catalog';

export const Route = createFileRoute('/albums/')({
  component: AlbumListPage,
});

function AlbumListPage() {
  const { t } = useTranslation();
  const albums = useCatalogStore(selectAlbums);
  const loading = useCatalogStore((s) => s.loading);

  const albumTiles = albums.map((group) => ({
    name: group.name,
    trackCount: group.tracks.length,
    coverSrc: firstAlbumCoverSrc(group.tracks),
  }));

  return (
    <Container
      maxWidth={false}
      className="page album-list-page"
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
        {t('nav.albumList')}
      </Typography>

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : (
        <AlbumGallery tiles={albumTiles} pathFor={albumPath} />
      )}
    </Container>
  );
}
