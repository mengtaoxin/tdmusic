import {
  aggregatePlayCounts,
  type PlayCountRow,
  type PlayStatsRangeDays,
} from '@/lib/playback/playHistoryStats';
import { listPlayHistory } from '@/lib/playback/playHistoryStore';

export type { PlayCountRow, PlayStatsRangeDays };
export {
  MIN_COUNTED_PLAY_DURATION_MS,
  PLAY_HISTORY_RETENTION_DAYS,
  aggregatePlayCounts,
} from '@/lib/playback/playHistoryStats';
export { clearPlayHistory, listPlayHistory, savePlayRecord } from '@/lib/playback/playHistoryStore';
export { createPlayHistoryRecorder } from '@/lib/playback/playHistoryRecorder';

/** Listening stats for the UI: counted plays (>1 min) in the selected window. */
export async function getPlayCountStats(rangeDays: PlayStatsRangeDays): Promise<PlayCountRow[]> {
  const records = await listPlayHistory();
  return aggregatePlayCounts(records, { now: Date.now(), rangeDays });
}

export type TrackPlayStats = {
  /** Counted plays (>1 min) in the last 30 days. */
  playCount: number;
  /** Start of the most recent recorded session, counted or not. */
  lastPlayedAt: number | null;
};

export async function getTrackPlayStats(trackId: string): Promise<TrackPlayStats> {
  const records = (await listPlayHistory()).filter((record) => record.trackId === trackId);
  const [row] = aggregatePlayCounts(records, { now: Date.now(), rangeDays: 30 });
  const lastPlayedAt = records.reduce<number | null>(
    (latest, record) => (latest == null || record.startedAt > latest ? record.startedAt : latest),
    null,
  );
  return { playCount: row?.playCount ?? 0, lastPlayedAt };
}
