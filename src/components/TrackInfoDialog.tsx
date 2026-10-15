import { useId, useState, type ReactNode } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { useTranslation } from 'react-i18next';

import { CoverImg } from '@/components/CoverImg';
import { useTrackInfo } from '@/hooks/useTrackInfo';
import { localizeAlbumName, localizeArtistName } from '@/lib/catalog/displayLabels';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { formatBytes } from '@/lib/formatBytes';
import { isPlayablePath } from '@/lib/paths';

type FieldSource = 'config' | 'tags' | 'fileName';

const SOURCE_LABEL_KEY = {
  config: 'trackInfo.fromConfig',
  tags: 'trackInfo.fromTags',
  fileName: 'trackInfo.fromFileName',
} as const;

function fieldSource(
  configValue: string | undefined,
  tagValue: string | undefined,
): FieldSource | null {
  if (configValue) return 'config';
  if (tagValue) return 'tags';
  return null;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ '& + &': { mt: 3 } }}>
      <Typography variant="subtitle2" component="h3" color="primary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Box
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(6rem, 30%) minmax(0, 1fr)',
          columnGap: 2,
          rowGap: 1,
          m: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function Row({
  label,
  hint,
  testId,
  children,
}: {
  label: string;
  hint?: string;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Typography component="dt" variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box component="dd" data-testid={testId} sx={{ m: 0, overflowWrap: 'anywhere' }}>
        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
          {children}
        </Typography>
        {hint ? (
          <Typography component="span" variant="caption" color="text.secondary">
            {hint}
          </Typography>
        ) : null}
      </Box>
    </>
  );
}

function TrackInfoContent({ track }: { track: DisplayTrack }) {
  const { t, i18n } = useTranslation();
  const { details, failure, downloading, percent, queued, playStats } = useTrackInfo(track);
  const [coverSize, setCoverSize] = useState<{ width: number; height: number } | null>(null);

  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleString(i18n.language);
  const sourceHint = (source: FieldSource | null) =>
    source ? t(SOURCE_LABEL_KEY[source]) : undefined;

  const extracted = details?.extracted;
  const titleSource = fieldSource(track.title, extracted?.title) ?? 'fileName';
  const coverSource = track.cover ? 'config' : track.displayCover ? 'tags' : null;

  function downloadStatus() {
    if (!isPlayablePath(track.path)) return t('trackInfo.statusStreamOnly');
    if (downloading) {
      return percent > 0
        ? t('trackInfo.statusDownloadingPercent', { percent })
        : t('trackInfo.statusDownloading');
    }
    if (details?.status === 'ready') return t('trackInfo.statusDownloaded');
    if (queued) return t('trackInfo.statusQueued');
    if (failure) return t('trackInfo.statusFailed');
    if (!details) return '…';
    return t('trackInfo.statusNotDownloaded');
  }

  const showFailure = failure != null && !downloading && details?.status !== 'ready';

  return (
    <>
      <Section title={t('trackInfo.sectionBasic')}>
        <Row label={t('trackInfo.name')} hint={sourceHint(titleSource)}>
          {track.displayTitle}
        </Row>
        <Row
          label={t('trackInfo.artist')}
          hint={sourceHint(fieldSource(track.artist, extracted?.artist))}
        >
          {localizeArtistName(track.displayArtist, t)}
        </Row>
        <Row
          label={t('trackInfo.album')}
          hint={sourceHint(fieldSource(track.album, extracted?.album))}
        >
          {localizeAlbumName(track.displayAlbum, t)}
        </Row>
      </Section>

      <Section title={t('trackInfo.sectionCover')}>
        <Row label={t('trackInfo.coverPreview')}>
          <Avatar variant="rounded" sx={{ width: 96, height: 96, bgcolor: 'action.hover' }}>
            {track.displayCover ? (
              <CoverImg
                src={track.displayCover}
                eager
                onLoad={(event) =>
                  setCoverSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })
                }
              />
            ) : (
              <MusicNoteIcon />
            )}
          </Avatar>
        </Row>
        <Row label={t('trackInfo.coverSource')}>
          {coverSource ? t(SOURCE_LABEL_KEY[coverSource]) : t('trackInfo.coverNone')}
        </Row>
        {track.cover ? <Row label={t('trackInfo.coverUrl')}>{track.cover}</Row> : null}
        {coverSource === 'tags' && details?.cover ? (
          <>
            <Row label={t('trackInfo.format')}>{details.cover.type || '—'}</Row>
            <Row label={t('trackInfo.fileSize')}>{formatBytes(details.cover.size)}</Row>
          </>
        ) : null}
        {coverSize ? (
          <Row label={t('trackInfo.coverDimensions')}>{t('trackInfo.dimensions', coverSize)}</Row>
        ) : null}
      </Section>

      <Section title={t('trackInfo.sectionDownload')}>
        <Row label={t('trackInfo.downloadStatus')} testId="track-info-status">
          {downloadStatus()}
        </Row>
        {showFailure ? (
          <>
            <Row label={t('trackInfo.failureReason')}>
              {failure.httpStatus != null
                ? t('trackInfo.failureHttp', { status: failure.httpStatus })
                : failure.message}
            </Row>
            <Row label={t('trackInfo.failedAt')}>{formatTime(failure.failedAt)}</Row>
          </>
        ) : null}
        {details?.status === 'ready' && details.downloadedAt != null ? (
          <Row label={t('trackInfo.cachedAt')}>{formatTime(details.downloadedAt)}</Row>
        ) : null}
        {details?.status === 'ready' && details.audio ? (
          <>
            <Row label={t('trackInfo.format')}>{details.audio.type || '—'}</Row>
            <Row label={t('trackInfo.fileSize')}>{formatBytes(details.audio.size)}</Row>
          </>
        ) : null}
        {extracted ? (
          <Row label={t('trackInfo.tagsReadAt')}>{formatTime(extracted.updatedAt)}</Row>
        ) : null}
      </Section>

      <Section title={t('trackInfo.sectionOther')}>
        <Row label={t('trackInfo.trackId')}>{track.id}</Row>
        <Row label={t('trackInfo.path')}>{track.path}</Row>
        <Row label={t('trackInfo.volume')}>
          {t('trackInfo.volumeValue', { ratio: track.volumeRatio })}
        </Row>
        {playStats ? (
          <>
            <Row label={t('trackInfo.playCount')}>{playStats.playCount}</Row>
            <Row label={t('trackInfo.lastPlayed')}>
              {playStats.lastPlayedAt != null
                ? formatTime(playStats.lastPlayedAt)
                : t('trackInfo.never')}
            </Row>
          </>
        ) : null}
      </Section>
    </>
  );
}

export type TrackInfoDialogProps = {
  track: DisplayTrack;
  open: boolean;
  onClose: () => void;
};

export function TrackInfoDialog({ track, open, onClose }: TrackInfoDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{t('trackInfo.title')}</DialogTitle>
      <DialogContent dividers>
        <TrackInfoContent track={track} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('trackInfo.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
