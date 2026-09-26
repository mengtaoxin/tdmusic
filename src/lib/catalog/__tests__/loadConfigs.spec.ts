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

  it('returns cached configs without fetching on later loads', async () => {
    const payload = { 'music-list': [{ id: 'a', path: '/a.mp3' }] };
    const fetchMock = stubFetchOk(payload);
    await loadConfigsJson();
    const again = await loadConfigsJson();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(again).toEqual(payload);
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
