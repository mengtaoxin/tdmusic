import { createFileRoute, redirect } from '@tanstack/react-router';

import { QuickPlayPage } from '@/components/QuickPlayPage';
import { beginQuickPlay } from '@/lib/routes/beginQuickPlay';
import type { QuickPlayRequest } from '@/lib/routes/quickPlay';

export const Route = createFileRoute('/quick-play')({
  validateSearch: (search: Record<string, unknown>): QuickPlayRequest => ({
    type: typeof search.type === 'string' ? search.type : '',
    id: typeof search.id === 'string' ? search.id : '',
  }),
  beforeLoad: ({ search }) => {
    const plan = beginQuickPlay(search);
    if (plan.kind === 'play') {
      throw redirect({ to: '/now-playing', replace: true });
    }
  },
  component: QuickPlayRoute,
});

function QuickPlayRoute() {
  const { type, id } = Route.useSearch();
  return <QuickPlayPage type={type} id={id} />;
}
