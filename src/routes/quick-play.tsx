import { createFileRoute, redirect } from '@tanstack/react-router';

import { QuickPlayPage } from '@/components/QuickPlayPage';
import { beginQuickPlay } from '@/lib/routes/beginQuickPlay';
import { parseQuickPlaySearch, type QuickPlayRequest } from '@/lib/routes/quickPlay';

export const Route = createFileRoute('/quick-play')({
  validateSearch: (search: Record<string, unknown>): QuickPlayRequest =>
    parseQuickPlaySearch(search),
  beforeLoad: ({ search }) => {
    const plan = beginQuickPlay(search);
    if (plan.kind === 'play' || plan.kind === 'resume') {
      throw redirect({ to: '/now-playing', replace: true });
    }
  },
  component: QuickPlayRoute,
});

function QuickPlayRoute() {
  const { type, id } = Route.useSearch();
  return <QuickPlayPage type={type} id={id} />;
}
