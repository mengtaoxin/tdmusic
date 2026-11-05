import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { planQuickPlay, type QuickPlayPlan } from '@/lib/routes/quickPlay';
import { selectTrackById, selectTracks, useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

function failureMessage(plan: Exclude<QuickPlayPlan, { kind: 'play' | 'resume' }>): string {
  switch (plan.kind) {
    case 'not-found':
      return plan.target === 'track' ? 'quickPlay.trackNotFound' : 'quickPlay.playlistNotFound';
    case 'empty':
      return 'quickPlay.empty';
    case 'idle':
      return 'quickPlay.nothingPlaying';
    case 'invalid':
      return 'quickPlay.invalid';
    default: {
      const unreachable: never = plan;
      return unreachable;
    }
  }
}

/** Shown when a /quick-play link cannot start playback. */
export function QuickPlayPage({ type, id }: { type: string; id: string }) {
  const { t } = useTranslation();
  const trackById = useCatalogStore(selectTrackById);
  const orderedTrackIds = useCatalogStore(selectTracks).map((item) => item.id);
  const playlists = useCatalogStore((s) => s.playlists);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const plan = planQuickPlay(
    { type, id },
    { trackIds: trackById, orderedTrackIds, playlists },
    { queue, currentId },
  );

  return (
    <Container maxWidth={false} className="page">
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {t('quickPlay.title')}
      </Typography>
      {plan.kind === 'play' || plan.kind === 'resume' ? null : (
        <Alert severity="warning">{t(failureMessage(plan))}</Alert>
      )}
    </Container>
  );
}
