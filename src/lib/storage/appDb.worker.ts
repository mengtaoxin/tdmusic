import sqlite3InitModule, { type Database, type SqlValue } from '@sqlite.org/sqlite-wasm';

import { APP_DB_FILENAME, APP_DB_SAH_POOL_NAME, APP_DB_SCHEMA_SQL } from './appDbSchema';
import type { WorkerRequest, WorkerResponse } from './appDbWorkerProtocol';

let db: Database | null = null;
let persistent = false;

function cloneBind(bind: SqlValue[] | undefined): SqlValue[] | undefined {
  if (!bind) return undefined;
  return bind.map((value) => {
    if (value instanceof Uint8Array) {
      const copy = new Uint8Array(value.byteLength);
      copy.set(value);
      return copy;
    }
    return value;
  });
}

function execSql(sql: string, bind?: SqlValue[]): void {
  if (!db) throw Object.assign(new Error('Database is not open'), { name: 'DatabaseClosedError' });
  db.exec({ sql, bind: cloneBind(bind) });
}

function allSql(sql: string, bind?: SqlValue[]): Array<Record<string, SqlValue>> {
  if (!db) throw Object.assign(new Error('Database is not open'), { name: 'DatabaseClosedError' });
  const rows = db.exec({
    sql,
    bind: cloneBind(bind),
    rowMode: 'object',
    returnValue: 'resultRows',
  });
  return (rows ?? []) as Array<Record<string, SqlValue>>;
}

async function openDb(): Promise<void> {
  const sqlite3 = await sqlite3InitModule();

  if (typeof sqlite3.installOpfsSAHPoolVfs === 'function') {
    try {
      const pool = await sqlite3.installOpfsSAHPoolVfs({
        name: APP_DB_SAH_POOL_NAME,
        clearOnInit: false,
        initialCapacity: 6,
      });
      await pool.reserveMinimumCapacity(6);
      db = new pool.OpfsSAHPoolDb(APP_DB_FILENAME);
      persistent = true;
      db.exec(APP_DB_SCHEMA_SQL);
      return;
    } catch {
      // Fall through to OpfsDb.
    }
  }

  if ('opfs' in sqlite3 && sqlite3.oo1.OpfsDb) {
    db = new sqlite3.oo1.OpfsDb(APP_DB_FILENAME, 'ct');
    persistent = true;
    db.exec(APP_DB_SCHEMA_SQL);
    return;
  }

  throw Object.assign(new Error('OPFS is not available for SQLite'), { name: 'MissingAPIError' });
}

function reply(message: WorkerResponse): void {
  postMessage(message);
}

addEventListener('message', (event: Event) => {
  void (async () => {
    const request = (event as MessageEvent<WorkerRequest>).data;
    try {
      switch (request.type) {
        case 'init': {
          if (!db) await openDb();
          reply({ id: request.id, type: 'ok', persistent });
          break;
        }
        case 'exec': {
          execSql(request.sql, request.bind);
          reply({ id: request.id, type: 'ok' });
          break;
        }
        case 'all': {
          const rows = allSql(request.sql, request.bind);
          reply({ id: request.id, type: 'ok', rows });
          break;
        }
        case 'batch': {
          execSql('BEGIN IMMEDIATE');
          try {
            for (const statement of request.statements) {
              execSql(statement.sql, statement.bind);
            }
            execSql('COMMIT');
            reply({ id: request.id, type: 'ok' });
          } catch (error) {
            try {
              execSql('ROLLBACK');
            } catch {
              // ignore
            }
            throw error;
          }
          break;
        }
        case 'close': {
          db?.close();
          db = null;
          reply({ id: request.id, type: 'ok' });
          break;
        }
        default:
          reply({
            id: (request as WorkerRequest).id,
            type: 'error',
            message: 'Unknown worker request',
          });
      }
    } catch (error) {
      reply({
        id: request.id,
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
      });
    }
  })();
});
