import { createFileRoute } from '@tanstack/react-router';

import { ArtistAlbumDetailPage } from '@/components/ArtistAlbumDetailPage';
import { decodeRouteParam } from '@/lib/routes/routeParams';

export const Route = createFileRoute('/artists/$name_/albums_/$album')({
  component: ArtistAlbumDetailRoute,
});

function ArtistAlbumDetailRoute() {
  const { name: nameParam, album: albumParam } = Route.useParams();
  return (
    <ArtistAlbumDetailPage
      artistName={decodeRouteParam(nameParam)}
      albumName={decodeRouteParam(albumParam)}
    />
  );
}
