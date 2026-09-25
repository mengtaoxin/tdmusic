import { createFileRoute } from '@tanstack/react-router'

import { ArtistTracksPage } from '@/components/ArtistTracksPage'
import { decodeRouteParam } from '@/lib/routes/routeParams'

export const Route = createFileRoute('/artists/$name')({
  component: ArtistTracksRoute,
})

function ArtistTracksRoute() {
  const { name: nameParam } = Route.useParams()
  return <ArtistTracksPage artistName={decodeRouteParam(nameParam)} />
}
