import { getItem, setItem, type ClientStorage } from './clientStorage'

export const SEARCH_HISTORY_KEY = 'tdmusic.searchHistory'
export const MAX_SEARCH_HISTORY = 10

function parseHistory(raw: string | null): string[] {
  if (raw == null || raw.trim().length === 0) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

export function readSearchHistory(storage: ClientStorage = localStorage): string[] {
  return parseHistory(getItem(SEARCH_HISTORY_KEY, storage))
}

/** Newest-first, case-insensitive dedupe, capped at MAX_SEARCH_HISTORY. */
export function pushSearchHistory(query: string, storage: ClientStorage = localStorage): string[] {
  const trimmed = query.trim()
  if (trimmed.length === 0) return readSearchHistory(storage)

  const lower = trimmed.toLowerCase()
  const next = [
    trimmed,
    ...readSearchHistory(storage).filter((item) => item.toLowerCase() !== lower),
  ].slice(0, MAX_SEARCH_HISTORY)

  setItem(SEARCH_HISTORY_KEY, JSON.stringify(next), storage)
  return next
}
