import sqlite3InitModule, { type Database, type SqlValue } from '@sqlite.org/sqlite-wasm';

import { APP_DB_SCHEMA_SQL, META_IDB_MIGRATED_KEY } from './appDbSchema';
import type { WorkerRequest, WorkerRequestBody, WorkerResponse } from './appDbWorkerProtocol';
import { migrateFromIndexedDbIfNeeded } from './migrateFromIdb';

export type SqlStatement = { sql: string; bind?: readonly SqlValue[] };

export type AppDb = {
  /** True when the DB file lives in OPFS (not an ephemeral memory DB). */
  persistent: boolean;
  exec(sql: string, bind?: readonly SqlValue[]): Promise<void>;
  get<T extends Record<string, SqlValue>>(
    sql: string,
    bind?: readonly SqlValue[],
  ): Promise<T | undefined>;
  all<T extends Record<string, SqlValue>>(sql: string, bind?: readonly SqlValue[]): Promise<T[]>;
  runInTransaction(statements: readonly SqlStatement[]): Promise<void>;
  getMeta(key: string): Promise<string | undefined>;
  setMeta(key: string, value: string): Promise<void>;
};

type OpenOptions = {
  /** Force an in-memory DB (unit tests). */
  memory?: boolean;
};

let dbPromise: Promise<AppDb> | null = null;
let activeDb: AppDb | null = null;

function shouldUseMemory(options: OpenOptions | undefined): boolean {
  if (options?.memory) return true;
  if (import.meta.env.VITEST) return true;
  return false;
}

function wrapMemoryDb(raw: Database): AppDb {
  const execSync = (sql: string, bind?: readonly SqlValue[]) => {
    raw.exec({ sql, bind: bind ? [...bind] : undefined });
  };

  const allSync = <T extends Record<string, SqlValue>>(
    sql: string,
    bind?: readonly SqlValue[],
  ): T[] => {
    const rows = raw.exec({
      sql,
      bind: bind ? [...bind] : undefined,
      rowMode: 'object',
      returnValue: 'resultRows',
    });
    return (rows ?? []) as T[];
  };

  const exec = async (sql: string, bind?: readonly SqlValue[]) => {
    execSync(sql, bind);
  };

  const all = async <T extends Record<string, SqlValue>>(sql: string, bind?: readonly SqlValue[]) =>
    allSync<T>(sql, bind);

  const get = async <T extends Record<string, SqlValue>>(sql: string, bind?: readonly SqlValue[]) =>
    allSync<T>(sql, bind)[0];

  const runInTransaction = async (statements: readonly SqlStatement[]) => {
    execSync('BEGIN IMMEDIATE');
    try {
      for (const statement of statements) {
        execSync(statement.sql, statement.bind);
      }
      execSync('COMMIT');
    } catch (error) {
      try {
        execSync('ROLLBACK');
      } catch {
        // ignore
      }
      throw error;
    }
  };

  const getMeta = async (key: string) =>
    (await get<{ value: string }>('SELECT value FROM meta_kv WHERE key = ?', [key]))?.value;

  const setMeta = async (key: string, value: string) => {
    await exec('INSERT OR REPLACE INTO meta_kv (key, value) VALUES (?, ?)', [key, value]);
  };

  return {
    persistent: false,
    exec,
    get,
    all,
    runInTransaction,
    getMeta,
    setMeta,
  };
}

async function openMemoryDb(): Promise<AppDb> {
  const sqlite3 = await sqlite3InitModule();
  const raw = new sqlite3.oo1.DB(':memory:', 'c');
  raw.exec(APP_DB_SCHEMA_SQL);
  return wrapMemoryDb(raw);
}

function createWorkerClient(): {
  request: (message: WorkerRequestBody) => Promise<WorkerResponse & { type: 'ok' }>;
  terminate: () => void;
} {
  const worker = new Worker(new URL('./appDb.worker.ts', import.meta.url), {
    type: 'module',
  });
  let nextId = 1;
  const pending = new Map<
    number,
    {
      resolve: (value: WorkerResponse & { type: 'ok' }) => void;
      reject: (error: Error) => void;
    }
  >();

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const entry = pending.get(response.id);
    if (!entry) return;
    pending.delete(response.id);
    if (response.type === 'error') {
      entry.reject(Object.assign(new Error(response.message), { name: response.name ?? 'Error' }));
      return;
    }
    entry.resolve(response);
  };

  worker.onerror = (event) => {
    const error = Object.assign(new Error(event.message || 'App DB worker failed'), {
      name: 'OpenFailedError',
    });
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
  };

  return {
    request: (message) =>
      new Promise((resolve, reject) => {
        const id = nextId;
        nextId += 1;
        pending.set(id, { resolve, reject });
        const payload = { ...message, id } as WorkerRequest;
        worker.postMessage(payload);
      }),
    terminate: () => {
      worker.terminate();
      pending.clear();
    },
  };
}

async function openWorkerDb(): Promise<AppDb & { terminate: () => void }> {
  const client = createWorkerClient();
  try {
    const opened = await client.request({ type: 'init' });
    const persistent = opened.persistent === true;

    const exec = async (sql: string, bind?: readonly SqlValue[]) => {
      await client.request({
        type: 'exec',
        sql,
        bind: bind ? [...bind] : undefined,
      });
    };

    const all = async <T extends Record<string, SqlValue>>(
      sql: string,
      bind?: readonly SqlValue[],
    ) => {
      const response = await client.request({
        type: 'all',
        sql,
        bind: bind ? [...bind] : undefined,
      });
      return (response.rows ?? []) as T[];
    };

    const get = async <T extends Record<string, SqlValue>>(
      sql: string,
      bind?: readonly SqlValue[],
    ) => (await all<T>(sql, bind))[0];

    const runInTransaction = async (statements: readonly SqlStatement[]) => {
      await client.request({
        type: 'batch',
        statements: statements.map((statement) => ({
          sql: statement.sql,
          bind: statement.bind ? [...statement.bind] : undefined,
        })),
      });
    };

    const getMeta = async (key: string) =>
      (await get<{ value: string }>('SELECT value FROM meta_kv WHERE key = ?', [key]))?.value;

    const setMeta = async (key: string, value: string) => {
      await exec('INSERT OR REPLACE INTO meta_kv (key, value) VALUES (?, ?)', [key, value]);
    };

    return {
      persistent,
      exec,
      get,
      all,
      runInTransaction,
      getMeta,
      setMeta,
      terminate: client.terminate,
    };
  } catch (error) {
    client.terminate();
    throw error;
  }
}

async function createAppDb(options?: OpenOptions): Promise<AppDb> {
  const db = shouldUseMemory(options) ? await openMemoryDb() : await openWorkerDb();

  if ((await db.getMeta(META_IDB_MIGRATED_KEY)) !== '1') {
    await migrateFromIndexedDbIfNeeded(db);
    await db.setMeta(META_IDB_MIGRATED_KEY, '1');
  }

  return db;
}

/** Open (or reuse) the app SQLite database. */
export function openAppDb(options?: OpenOptions): Promise<AppDb> {
  if (dbPromise) return dbPromise;

  dbPromise = createAppDb(options)
    .then((db) => {
      activeDb = db;
      return db;
    })
    .catch((error) => {
      dbPromise = null;
      activeDb = null;
      throw error;
    });
  return dbPromise;
}

/** Close and drop the cached connection (tests). */
export async function closeAppDbForTests(): Promise<void> {
  if (activeDb && 'terminate' in activeDb && typeof activeDb.terminate === 'function') {
    activeDb.terminate();
  }
  activeDb = null;
  dbPromise = null;
}

/** Clear all app tables and reopen a fresh in-memory DB (unit tests). */
export async function resetAppDbForTests(): Promise<void> {
  await closeAppDbForTests();
  await openAppDb({ memory: true });
}
