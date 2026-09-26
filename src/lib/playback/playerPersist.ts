import {
  PLAYER_STORAGE_KEY,
  serializePlayerState,
  type PersistedPlayerState,
} from './playerStateCodec';

export function createPlayerPersist(options: {
  getPayload: () => PersistedPlayerState;
  setItem: (key: string, value: string) => void;
  delayMs?: number;
  storageKey?: string;
}) {
  const delayMs = options.delayMs ?? 400;
  const storageKey = options.storageKey ?? PLAYER_STORAGE_KEY;
  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  function persistNow() {
    options.setItem(storageKey, serializePlayerState(options.getPayload()));
  }

  function schedulePersist() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      persistNow();
    }, delayMs);
  }

  function flushPersist() {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    persistNow();
  }

  return { persistNow, schedulePersist, flushPersist };
}
