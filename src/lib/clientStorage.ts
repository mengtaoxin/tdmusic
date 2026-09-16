export type ClientStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function isQuotaExceeded(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.code === 22
  }
  return false
}

export function getItem(key: string, storage: ClientStorage = localStorage): string | null {
  return storage.getItem(key)
}

/** Returns false when the write fails due to quota; other errors still throw. */
export function setItem(
  key: string,
  value: string,
  storage: ClientStorage = localStorage,
): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch (error) {
    if (isQuotaExceeded(error)) return false
    throw error
  }
}

export function removeItem(key: string, storage: ClientStorage = localStorage): void {
  storage.removeItem(key)
}
