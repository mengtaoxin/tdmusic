import { openAppDb } from '@/lib/storage/appDb';

import { playHistoryRetentionCutoff } from './playHistoryStats';

export type PlayHistoryRecord = {
  id?: number;
  trackId: string;
  startedAt: number;
  endedAt: number;
};

function deleteOlderThan(cutoffStartedAt: number): void {
  void openAppDb()
    .then((db) => db.exec('DELETE FROM play_history WHERE started_at < ?', [cutoffStartedAt]))
    .catch(() => {
      // Best-effort retention cleanup; ignore storage failures.
    });
}

/** Persist a play session, then asynchronously drop records older than 30 days. */
export async function savePlayRecord(record: Omit<PlayHistoryRecord, 'id'>): Promise<void> {
  const db = await openAppDb();
  await db.exec('INSERT INTO play_history (track_id, started_at, ended_at) VALUES (?, ?, ?)', [
    record.trackId,
    record.startedAt,
    record.endedAt,
  ]);

  const cutoff = playHistoryRetentionCutoff(Date.now());
  deleteOlderThan(cutoff);
}

export async function listPlayHistory(): Promise<PlayHistoryRecord[]> {
  const db = await openAppDb();
  const rows = await db.all<{
    id: number;
    track_id: string;
    started_at: number;
    ended_at: number;
  }>('SELECT id, track_id, started_at, ended_at FROM play_history');
  return rows.map((row) => ({
    id: Number(row.id),
    trackId: row.track_id,
    startedAt: Number(row.started_at),
    endedAt: Number(row.ended_at),
  }));
}

export async function clearPlayHistory(): Promise<void> {
  const db = await openAppDb();
  await db.exec('DELETE FROM play_history');
}

/** Clear all play-history rows (tests). */
export async function resetPlayHistoryDbForTests(): Promise<void> {
  const db = await openAppDb({ memory: true });
  await db.exec('DELETE FROM play_history');
}
