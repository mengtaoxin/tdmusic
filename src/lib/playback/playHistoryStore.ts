import { playHistoryRetentionCutoff } from './playHistoryStats';

export type PlayHistoryRecord = {
  id?: number;
  trackId: string;
  startedAt: number;
  endedAt: number;
};

const DB_NAME = 'play-history';
const DB_VERSION = 1;
const STORE = 'plays';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error('IndexedDB open failed'));
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => {
          dbPromise = null;
        };
        resolve(db);
      };
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('startedAt', 'startedAt', { unique: false });
        }
      };
    });
  }
  return dbPromise;
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function idbTransactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

async function deleteOlderThan(cutoffStartedAt: number): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const index = store.index('startedAt');
  const range = IDBKeyRange.upperBound(cutoffStartedAt, true);
  const keys = await idbRequest(index.getAllKeys(range));
  for (const key of keys) {
    store.delete(key);
  }
  await idbTransactionDone(tx);
}

/** Persist a play session, then asynchronously drop records older than 30 days. */
export async function savePlayRecord(record: Omit<PlayHistoryRecord, 'id'>): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).add(record);
  await idbTransactionDone(tx);

  const cutoff = playHistoryRetentionCutoff(Date.now());
  void deleteOlderThan(cutoff).catch(() => {
    // Best-effort retention cleanup; ignore storage failures.
  });
}

export async function listPlayHistory(): Promise<PlayHistoryRecord[]> {
  const db = await openDb();
  const rows = await idbRequest(db.transaction(STORE, 'readonly').objectStore(STORE).getAll());
  return (rows as PlayHistoryRecord[]) ?? [];
}

export async function clearPlayHistory(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).clear();
  await idbTransactionDone(tx);
}

/** Close shared connection and delete the DB (tests). */
export async function resetPlayHistoryDbForTests(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      // ignore open failures during reset
    }
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('IndexedDB delete failed'));
    req.onblocked = () => resolve();
  });
}
