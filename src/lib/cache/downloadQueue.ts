import { isPlayablePath } from '../paths';
import { ensureTrackCached } from './cacheIngest';
import {
  clearDownloadQueue,
  deleteDownloadQueueEntry,
  isTrackCached,
  listDownloadQueue,
  putDownloadQueueEntries,
  type DownloadQueueEntry,
} from './cacheStore';

export type ManualDownloadTrackRef = { id: string; path: string };

export type ManualDownloadHooks = {
  onCached?: (id: string | undefined) => void;
  onFailed?: (sourceUrl: string, error: unknown) => void;
};

const MAX_IN_FLIGHT = 3;

let entries: DownloadQueueEntry[] = [];
/** Source URLs that are queued (or being checked for enqueue). */
const queued = new Set<string>();
const inFlight = new Set<string>();
const listeners = new Set<() => void>();
let hooks: ManualDownloadHooks = {};
let generation = 0;
let lastAddedAt = 0;

function notify() {
  for (const listener of listeners) listener();
}

function nextAddedAt() {
  lastAddedAt = Math.max(Date.now(), lastAddedAt + 1);
  return lastAddedAt;
}

function finish(entry: DownloadQueueEntry) {
  inFlight.delete(entry.sourceUrl);
  queued.delete(entry.sourceUrl);
  entries = entries.filter((e) => e !== entry);
  void deleteDownloadQueueEntry(entry.sourceUrl).catch(() => {});
  notify();
  pump();
}

function start(entry: DownloadQueueEntry) {
  const gen = generation;
  inFlight.add(entry.sourceUrl);
  ensureTrackCached(entry.sourceUrl, entry.id, { priority: 'low' }).then(
    () => {
      if (gen !== generation) return;
      hooks.onCached?.(entry.id);
      finish(entry);
    },
    (error: unknown) => {
      if (gen !== generation) return;
      hooks.onFailed?.(entry.sourceUrl, error);
      finish(entry);
    },
  );
}

function pump() {
  for (const entry of entries) {
    if (inFlight.size >= MAX_IN_FLIGHT) return;
    if (!inFlight.has(entry.sourceUrl)) start(entry);
  }
}

/** Wire app-level side effects (cover enrich, failure logs) for manual downloads. */
export function setManualDownloadHooks(next: ManualDownloadHooks): void {
  hooks = next;
}

/**
 * Persist user-requested downloads (low priority) and start them.
 * Skips non-playable paths and tracks already cached or queued.
 */
export async function enqueueManualDownloads(tracks: ManualDownloadTrackRef[]): Promise<void> {
  const gen = generation;
  const candidates: ManualDownloadTrackRef[] = [];
  for (const track of tracks) {
    if (!isPlayablePath(track.path) || queued.has(track.path)) continue;
    queued.add(track.path);
    candidates.push(track);
  }
  if (!candidates.length) return;

  const cached = await Promise.all(candidates.map((track) => isTrackCached(track.path)));
  if (gen !== generation) return;

  const added: DownloadQueueEntry[] = [];
  candidates.forEach((track, index) => {
    if (cached[index]) {
      queued.delete(track.path);
    } else {
      added.push({ sourceUrl: track.path, id: track.id, addedAt: nextAddedAt() });
    }
  });
  if (!added.length) return;

  await putDownloadQueueEntries(added);
  if (gen !== generation) return;
  entries.push(...added);
  notify();
  pump();
}

/** Reload the persisted queue (e.g. after the page was reopened) and continue downloading. */
export async function resumeManualDownloads(): Promise<void> {
  const gen = generation;
  const stored = await listDownloadQueue();
  if (gen !== generation) return;

  for (const entry of stored) {
    if (queued.has(entry.sourceUrl)) continue;
    queued.add(entry.sourceUrl);
    entries.push(entry);
    lastAddedAt = Math.max(lastAddedAt, entry.addedAt);
  }
  entries.sort((a, b) => a.addedAt - b.addedAt);
  notify();
  pump();
}

/** Drop every queued manual download (memory and IndexedDB). */
export async function clearManualDownloads(): Promise<void> {
  generation += 1;
  entries = [];
  queued.clear();
  inFlight.clear();
  notify();
  await clearDownloadQueue();
}

export function isTrackQueuedForDownload(sourceUrl: string): boolean {
  return queued.has(sourceUrl);
}

export function subscribeManualDownloads(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Forget in-memory queue state without touching IndexedDB (tests simulate a reload). */
export function resetManualDownloadsForTests(): void {
  generation += 1;
  entries = [];
  queued.clear();
  inFlight.clear();
  listeners.clear();
  lastAddedAt = 0;
}
