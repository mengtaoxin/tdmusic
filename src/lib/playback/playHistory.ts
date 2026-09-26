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
