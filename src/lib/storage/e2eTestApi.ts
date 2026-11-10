import { openAppDb } from '@/lib/storage/appDb';
import {
  clearPlayHistory,
  listPlayHistory,
  savePlayRecord,
  type PlayHistoryRecord,
} from '@/lib/playback/playHistoryStore';

export type TdmusicTestApi = {
  waitForDb: () => Promise<void>;
  seedPlayHistory: (records: Array<Omit<PlayHistoryRecord, 'id'>>) => Promise<void>;
  clearPlayHistory: () => Promise<void>;
  listPlayHistory: () => Promise<PlayHistoryRecord[]>;
};

declare global {
  interface Window {
    tdmusicTestApi?: TdmusicTestApi;
  }
}

/** Expose a narrow Playwright seeding API for durable storage. */
export function installE2eTestApi(): void {
  if (typeof window === 'undefined') return;
  window.tdmusicTestApi = {
    waitForDb: async () => {
      await openAppDb();
    },
    seedPlayHistory: async (records) => {
      await openAppDb();
      await clearPlayHistory();
      // Sequential so each save can run retention cleanup against a stable clock.
      await records.reduce(async (prev, record) => {
        await prev;
        await savePlayRecord(record);
      }, Promise.resolve());
    },
    clearPlayHistory: async () => {
      await clearPlayHistory();
    },
    listPlayHistory: async () => listPlayHistory(),
  };
}
