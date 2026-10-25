import { createFileRoute } from '@tanstack/react-router';

import { NowPlayingPage } from '@/components/NowPlayingPage';

export const Route = createFileRoute('/now-playing')({
  component: NowPlayingPage,
});
