import { getItem, removeItem, setItem, type ClientStorage } from './clientStorage'

export const CONFIG_URL_KEY = 'tdmusic.configUrl'
export const DEFAULT_CONFIG_URL = '/configs.json'

export function resolveConfigUrl(storage: ClientStorage = localStorage): string {
  const raw = getItem(CONFIG_URL_KEY, storage)
  if (raw == null) return DEFAULT_CONFIG_URL
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : DEFAULT_CONFIG_URL
}

export function readStoredConfigUrl(storage: ClientStorage = localStorage): string {
  return getItem(CONFIG_URL_KEY, storage)?.trim() ?? ''
}

export function writeStoredConfigUrl(value: string, storage: ClientStorage = localStorage): void {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    removeItem(CONFIG_URL_KEY, storage)
    return
  }
  setItem(CONFIG_URL_KEY, trimmed, storage)
}
