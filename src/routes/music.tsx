import { createFileRoute } from '@tanstack/react-router';

import { SongsPage } from '@/components/SongsPage';

export const Route = createFileRoute('/music')({
  component: SongsPage,
});
