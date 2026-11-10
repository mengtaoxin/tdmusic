import type { SqlValue } from '@sqlite.org/sqlite-wasm';

export type WorkerRequestBody =
  | { type: 'init' }
  | { type: 'exec'; sql: string; bind?: SqlValue[] }
  | { type: 'all'; sql: string; bind?: SqlValue[] }
  | {
      type: 'batch';
      statements: Array<{ sql: string; bind?: SqlValue[] }>;
    }
  | { type: 'close' };

export type WorkerRequest = WorkerRequestBody & { id: number };

export type WorkerResponse =
  | { id: number; type: 'ok'; persistent?: boolean; rows?: Array<Record<string, SqlValue>> }
  | { id: number; type: 'error'; message: string; name?: string };
