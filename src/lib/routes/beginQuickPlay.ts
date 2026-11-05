import { planQuickPlay, type QuickPlayPlan, type QuickPlayRequest } from '@/lib/routes/quickPlay';
import { useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

/** Start the queue for a quick-play link. Callers redirect when the plan plays. */
export function beginQuickPlay(search: QuickPlayRequest): QuickPlayPlan {
  const catalog = useCatalogStore.getState();
  const plan = planQuickPlay(search, {
    trackIds: catalog.snapshot.trackById,
    playlists: catalog.playlists,
  });
  if (plan.kind === 'play') {
    usePlayerStore.getState().playFrom(0, plan.sourceIds, { shuffle: false });
  }
  return plan;
}
