import { createFileRoute } from '@tanstack/react-router';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';

import { AlbumGallery } from '@/components/AlbumGallery';
import { albumPath, firstAlbumCoverSrc } from '@/lib/routes/albumRoutes';
import { selectAlbums, useCatalogStore } from '@/stores/catalog';

export const Route = createFileRoute('/albums/')({
  component: AlbumsPage,
});

function AlbumsPage() {
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
      className="page albums-page"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : (
        <AlbumGallery tiles={albumTiles} pathFor={albumPath} />
      )}
    </Container>
  );
}
