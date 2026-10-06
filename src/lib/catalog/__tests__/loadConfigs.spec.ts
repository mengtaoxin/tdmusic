import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CONFIG_URL_KEY, DEFAULT_CONFIG_URL } from '../configUrl';
import { CONFIGS_CACHE_KEY, clearCachedConfigs, loadConfigsJson } from '../loadConfigs';

function stubFetchOk(payload: unknown) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
    ok: true,
    json: async () => payload,
  } as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function seedCache(url: string, data: unknown) {
  localStorage.setItem(CONFIGS_CACHE_KEY, JSON.stringify({ url, data }));
}

function readCache(): unknown {
  const raw = localStorage.getItem(CONFIGS_CACHE_KEY);
  return raw == null ? null : JSON.parse(raw);
}

describe('loadConfigsJson', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('fetches from resolved url', async () => {
    const payload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    stubFetchOk(payload);
    const data = await loadConfigsJson();
    expect(fetch).toHaveBeenCalledWith(DEFAULT_CONFIG_URL, { cache: 'reload' });
    expect(data).toEqual(payload);
  });

  it('saves default configs.json to localStorage after fetch', async () => {
    const payload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    stubFetchOk(payload);
    await loadConfigsJson();
    expect(CONFIGS_CACHE_KEY).toBe('tdmusic.configs');
    expect(JSON.parse(localStorage.getItem(CONFIGS_CACHE_KEY)!)).toEqual({
      url: DEFAULT_CONFIG_URL,
      data: payload,
    });
  });

  it('saves a user config URL payload to localStorage after fetch', async () => {
    const url = 'https://cdn.example.com/configs.json';
    const payload = { 'music-list': [{ id: 'b', path: '/b.mp3' }] };
    localStorage.setItem(CONFIG_URL_KEY, url);
    stubFetchOk(payload);
    await loadConfigsJson();
    expect(fetch).toHaveBeenCalledWith(url, { cache: 'reload' });
    expect(JSON.parse(localStorage.getItem(CONFIGS_CACHE_KEY)!)).toEqual({
      url,
      data: payload,
    });
  });

  it('returns cached configs on later loads and refreshes them in the background', async () => {
    const payload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    const fetchMock = stubFetchOk(payload);
    await loadConfigsJson();
    const again = await loadConfigsJson();
    expect(again).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, DEFAULT_CONFIG_URL, { cache: 'reload' });
  });

  it('returns cached configs while the background refresh is still pending', async () => {
    const cachedPayload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    seedCache(DEFAULT_CONFIG_URL, cachedPayload);
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    const data = await loadConfigsJson();
    expect(data).toEqual(cachedPayload);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_CONFIG_URL, { cache: 'reload' });
  });

  it('stores the refreshed remote configs for the next load', async () => {
    const cachedPayload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    const remotePayload = { 'music-list': [{ id: 'b', path: '/b.mp3' }] };
    seedCache(DEFAULT_CONFIG_URL, cachedPayload);
    stubFetchOk(remotePayload);
    const data = await loadConfigsJson();
    expect(data).toEqual(cachedPayload);
    await vi.waitFor(() => {
      expect(readCache()).toEqual({ url: DEFAULT_CONFIG_URL, data: remotePayload });
    });
  });

  it('keeps the cache when the background refresh fails (offline)', async () => {
    const cachedPayload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    seedCache(DEFAULT_CONFIG_URL, cachedPayload);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    const data = await loadConfigsJson();
    expect(data).toEqual(cachedPayload);
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    expect(readCache()).toEqual({ url: DEFAULT_CONFIG_URL, data: cachedPayload });
  });

  it('keeps the cache when the background refresh gets a non-ok response', async () => {
    const cachedPayload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    seedCache(DEFAULT_CONFIG_URL, cachedPayload);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const json = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue({ ok: false, status: 503, json } as unknown as Response),
    );
    await loadConfigsJson();
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    expect(json).not.toHaveBeenCalled();
    expect(readCache()).toEqual({ url: DEFAULT_CONFIG_URL, data: cachedPayload });
  });

  it('does not overwrite the cache when the config URL changes during the background refresh', async () => {
    const cachedPayload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    const stalePayload = { 'music-list': [{ id: 'stale', path: '/stale.mp3' }] };
    seedCache(DEFAULT_CONFIG_URL, cachedPayload);
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await loadConfigsJson();

    const customUrl = 'https://cdn.example.com/configs.json';
    const customPayload = { 'music-list': [{ id: 'b', path: '/b.mp3' }] };
    localStorage.setItem(CONFIG_URL_KEY, customUrl);
    seedCache(customUrl, customPayload);
    const json = vi.fn(async () => stalePayload);
    resolveFetch({ ok: true, json } as unknown as Response);

    await vi.waitFor(() => expect(json).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(readCache()).toEqual({ url: customUrl, data: customPayload });
  });

  it('throws when there is no cache and the fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')),
    );
    await expect(loadConfigsJson()).rejects.toThrow('Failed to fetch');
    expect(readCache()).toBeNull();
  });

  it('fetches again when the resolved config URL no longer matches the cache', async () => {
    const defaultPayload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    stubFetchOk(defaultPayload);
    await loadConfigsJson();

    const customUrl = 'https://cdn.example.com/configs.json';
    const customPayload = { 'music-list': [{ id: 'b', path: '/b.mp3' }] };
    localStorage.setItem(CONFIG_URL_KEY, customUrl);
    const secondFetch = stubFetchOk(customPayload);
    const data = await loadConfigsJson();
    expect(secondFetch).toHaveBeenCalledWith(customUrl, { cache: 'reload' });
    expect(data).toEqual(customPayload);
    expect(JSON.parse(localStorage.getItem(CONFIGS_CACHE_KEY)!)).toEqual({
      url: customUrl,
      data: customPayload,
    });
  });

  it('fetches again after the local configs cache is cleared', async () => {
    const payload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    const fetchMock = stubFetchOk(payload);
    await loadConfigsJson();
    clearCachedConfigs();
    expect(localStorage.getItem(CONFIGS_CACHE_KEY)).toBeNull();
    const again = await loadConfigsJson();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, DEFAULT_CONFIG_URL, { cache: 'reload' });
    expect(again).toEqual(payload);
  });

  it('ignores invalid cached JSON and fetches', async () => {
    localStorage.setItem(CONFIGS_CACHE_KEY, 'not-json');
    const payload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    stubFetchOk(payload);
    const data = await loadConfigsJson();
    expect(fetch).toHaveBeenCalledOnce();
    expect(data).toEqual(payload);
  });
});
