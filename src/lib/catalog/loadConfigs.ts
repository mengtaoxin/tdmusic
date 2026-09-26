import { getItem, removeItem, setItem, type ClientStorage } from '../clientStorage';
import { resolveConfigUrl } from './configUrl';

export const CONFIGS_CACHE_KEY = 'tdmusic.configs';

type ConfigsCachePayload = {
  url: string;
  data: unknown;
};

function readConfigsCache(storage: ClientStorage): ConfigsCachePayload | null {
  const raw = getItem(CONFIGS_CACHE_KEY, storage);
  if (raw == null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.url !== 'string') return null;
    if (!('data' in record)) return null;
    return { url: record.url, data: record.data };
  } catch {
    return null;
  }
}

function writeConfigsCache(url: string, data: unknown, storage: ClientStorage): void {
  setItem(CONFIGS_CACHE_KEY, JSON.stringify({ url, data }), storage);
}

export function clearCachedConfigs(storage: ClientStorage = localStorage): void {
  removeItem(CONFIGS_CACHE_KEY, storage);
}

export async function loadConfigsJson(
  fetchImpl: typeof fetch = fetch,
  storage: ClientStorage = localStorage,
): Promise<unknown> {
  const url = resolveConfigUrl(storage);
  const cached = readConfigsCache(storage);
  if (cached && cached.url === url) {
    return cached.data;
  }
  const response = await fetchImpl(url, { cache: 'reload' });
  if (!response.ok) {
    throw new Error(`Failed to load configs: ${response.status}`);
  }
  const data = await response.json();
  writeConfigsCache(url, data, storage);
  return data;
}
