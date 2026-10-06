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

async function fetchConfigs(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  const response = await fetchImpl(url, { cache: 'reload' });
  if (!response.ok) {
    throw new Error(`Failed to load configs: ${response.status}`);
  }
  return response.json();
}

/** Refresh the cached copy for the next load; failures (e.g. offline) keep the cache. */
async function revalidateCachedConfigs(
  url: string,
  fetchImpl: typeof fetch,
  storage: ClientStorage,
): Promise<void> {
  try {
    const data = await fetchConfigs(url, fetchImpl);
    if (resolveConfigUrl(storage) !== url) return;
    writeConfigsCache(url, data, storage);
  } catch (error) {
    console.warn(`Background configs refresh failed for ${url}:`, error);
  }
}

export async function loadConfigsJson(
  fetchImpl: typeof fetch = fetch,
  storage: ClientStorage = localStorage,
): Promise<unknown> {
  const url = resolveConfigUrl(storage);
  const cached = readConfigsCache(storage);
  if (cached && cached.url === url) {
    void revalidateCachedConfigs(url, fetchImpl, storage);
    return cached.data;
  }
  const data = await fetchConfigs(url, fetchImpl);
  writeConfigsCache(url, data, storage);
  return data;
}
