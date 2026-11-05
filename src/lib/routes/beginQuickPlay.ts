import { planQuickPlay, type QuickPlayPlan, type QuickPlayRequest } from '@/lib/routes/quickPlay';
import { useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

/** Start the queue for a quick-play link. Callers redirect when the plan plays. */
export function beginQuickPlay(search: QuickPlayRequest): QuickPlayPlan {
  const catalog = useCatalogStore.getState();
  const player = usePlayerStore.getState();
  const plan = planQuickPlay(
    search,
    {
      trackIds: catalog.snapshot.trackById,
      orderedTrackIds: catalog.snapshot.tracks.map((item) => item.id),
      playlists: catalog.playlists,
    },
    { queue: player.queue, currentId: player.currentId },
  );
  if (plan.kind === 'play') {
    player.playFrom(0, plan.sourceIds, { shuffle: false });
  } else if (plan.kind === 'resume') {
    player.play();
  }
  return plan;
}
