export type AppLogEntry = {
  id: number
  at: number
  message: string
}

export const MAX_APP_LOGS = 100

const DB_NAME = 'tdmusic-logs'
const DB_VERSION = 1
const LOGS_STORE = 'logs'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => {
        dbPromise = null
        reject(request.error ?? new Error('IndexedDB open failed'))
      }
      request.onsuccess = () => {
        const db = request.result
        db.onclose = () => {
          dbPromise = null
        }
        resolve(db)
      }
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(LOGS_STORE)) {
          db.createObjectStore(LOGS_STORE, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }
  return dbPromise
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function idbTransactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

/** Append an English-only log message; trims to MAX_APP_LOGS (oldest dropped). */
export async function appendAppLog(message: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(LOGS_STORE, 'readwrite')
  const store = tx.objectStore(LOGS_STORE)
  store.add({ at: Date.now(), message })
  await idbTransactionDone(tx)

  const trimTx = db.transaction(LOGS_STORE, 'readwrite')
  const trimStore = trimTx.objectStore(LOGS_STORE)
  const keys = (await idbRequest(trimStore.getAllKeys())) as number[]
  const overflow = keys.length - MAX_APP_LOGS
  if (overflow > 0) {
    for (let i = 0; i < overflow; i++) {
      const key = keys[i]
      if (key != null) trimStore.delete(key)
    }
  }
  await idbTransactionDone(trimTx)
}

/** Newest first. */
export async function listAppLogs(): Promise<AppLogEntry[]> {
  const db = await openDb()
  const rows = await idbRequest(
    db.transaction(LOGS_STORE, 'readonly').objectStore(LOGS_STORE).getAll(),
  )
  const list = ((rows as AppLogEntry[]) ?? []).slice()
  list.sort((a, b) => b.at - a.at || b.id - a.id)
  return list
}

export async function clearAppLogs(): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(LOGS_STORE, 'readwrite')
  tx.objectStore(LOGS_STORE).clear()
  await idbTransactionDone(tx)
}

/** Close shared connection and delete DB (tests). */
export async function resetAppLogDbForTests(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise
      db.close()
    } catch {
      // ignore open failures during reset
    }
    dbPromise = null
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error ?? new Error('IndexedDB delete failed'))
    req.onblocked = () => resolve()
  })
}
