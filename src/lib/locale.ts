import { getItem, setItem, type ClientStorage } from './clientStorage'

export const LOCALE_KEY = 'tdmusic.locale'
export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'zh'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function resolveLocale(storage: ClientStorage = localStorage): AppLocale {
  const raw = getItem(LOCALE_KEY, storage)
  if (raw == null) return DEFAULT_LOCALE
  const trimmed = raw.trim()
  return isAppLocale(trimmed) ? trimmed : DEFAULT_LOCALE
}

export function writeStoredLocale(value: string, storage: ClientStorage = localStorage): void {
  const trimmed = value.trim()
  if (!isAppLocale(trimmed)) return
  setItem(LOCALE_KEY, trimmed, storage)
}
