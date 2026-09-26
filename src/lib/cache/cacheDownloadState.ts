export type CacheDownloadTrackRef = { id: string; path: string };

type CacheProgressEvent = {
  phase: 'download' | 'done';
  loaded: number;
  total: number | null;
};

type ActiveDownload = {
  sourceUrl: string;
  id?: string;
  loaded: number;
  total: number | null;
};

const active = new Map<string, ActiveDownload>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function findDownload(track: CacheDownloadTrackRef): ActiveDownload | undefined {
  const byPath = active.get(track.path);
  if (byPath) return byPath;
  for (const entry of active.values()) {
    if (entry.id != null && entry.id === track.id) return entry;
  }
  return undefined;
}

/** Record ingest progress so the UI can animate covers while audio downloads. */
export function reportCacheDownload(
  sourceUrl: string,
  id: string | undefined,
  progress: CacheProgressEvent,
): void {
  if (progress.phase === 'done') {
    active.delete(sourceUrl);
  } else {
    active.set(sourceUrl, {
      sourceUrl,
      id,
      loaded: progress.loaded,
      total: progress.total,
    });
  }
  notify();
}

export function isTrackDownloading(track: CacheDownloadTrackRef): boolean {
  return findDownload(track) != null;
}

/** 0–100 when Content-Length is known; otherwise null (indeterminate). */
export function trackDownloadPercent(track: CacheDownloadTrackRef): number | null {
  const entry = findDownload(track);
  if (!entry || entry.total == null || entry.total <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((entry.loaded / entry.total) * 100)));
}

export function subscribeCacheDownloads(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearCacheDownloadState(): void {
  active.clear();
  notify();
}

export function resetCacheDownloadStateForTests(): void {
  active.clear();
  listeners.clear();
}
