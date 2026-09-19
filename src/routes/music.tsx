import { createFileRoute } from '@tanstack/react-router'

import { MusicListPage } from '@/components/MusicListPage'

export const Route = createFileRoute('/music')({
  component: MusicListPage,
})
