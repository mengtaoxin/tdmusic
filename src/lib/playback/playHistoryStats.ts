export const MIN_COUNTED_PLAY_DURATION_MS = 60_000
export const PLAY_HISTORY_RETENTION_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

export type PlayStatsRangeDays = 3 | 7 | 30

export type PlayHistoryRecordInput = {
  trackId: string
  startedAt: number
  endedAt: number
}

export type PlayCountRow = {
  trackId: string
  playCount: number
}

/** Count sessions longer than one minute in the window, highest play count first. */
export function aggregatePlayCounts(
  records: readonly PlayHistoryRecordInput[],
  options: { now: number; rangeDays: PlayStatsRangeDays },
): PlayCountRow[] {
  const windowStart = options.now - options.rangeDays * DAY_MS
  const counts = new Map<string, number>()

  for (const record of records) {
    if (record.startedAt < windowStart) continue
    const durationMs = record.endedAt - record.startedAt
    if (durationMs <= MIN_COUNTED_PLAY_DURATION_MS) continue
    counts.set(record.trackId, (counts.get(record.trackId) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([trackId, playCount]) => ({ trackId, playCount }))
    .sort((a, b) => b.playCount - a.playCount || a.trackId.localeCompare(b.trackId))
}

export function playHistoryRetentionCutoff(now: number): number {
  return now - PLAY_HISTORY_RETENTION_DAYS * DAY_MS
}
