import { createFileRoute } from '@tanstack/react-router'

import { AlbumDetailPage } from '@/components/AlbumDetailPage'
import { decodeRouteParam } from '@/lib/routes/routeParams'

export const Route = createFileRoute('/albums/$album')({
  component: AlbumDetailRoute,
})

function AlbumDetailRoute() {
  const { album: albumParam } = Route.useParams()
  return <AlbumDetailPage albumName={decodeRouteParam(albumParam)} />
}
