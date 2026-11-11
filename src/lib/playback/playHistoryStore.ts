import Dexie, { type Table } from 'dexie';

import { playHistoryRetentionCutoff } from './playHistoryStats';

export type PlayHistoryRecord = {
  id?: number;
  trackId: string;
  startedAt: number;
  endedAt: number;
};

const db = new Dexie('play-history') as Dexie & {
  plays: Table<PlayHistoryRecord, number>;
};

db.version(1).stores({
  plays: '++id, startedAt',
});

async function deleteOlderThan(cutoffStartedAt: number): Promise<void> {
  await db.plays.where('startedAt').below(cutoffStartedAt).delete();
}

/** Persist a play session, then asynchronously drop records older than 30 days. */
export async function savePlayRecord(record: Omit<PlayHistoryRecord, 'id'>): Promise<void> {
  await db.plays.add(record);

  const cutoff = playHistoryRetentionCutoff(Date.now());
  void deleteOlderThan(cutoff).catch(() => {
    // Best-effort retention cleanup; ignore storage failures.
  });
}

export async function listPlayHistory(): Promise<PlayHistoryRecord[]> {
  return db.plays.toArray();
}

export async function clearPlayHistory(): Promise<void> {
  await db.plays.clear();
}

/** Clear all records (tests). */
export async function resetPlayHistoryDbForTests(): Promise<void> {
  await clearPlayHistory();
}
