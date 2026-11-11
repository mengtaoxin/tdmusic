import type { QueueSession } from './queueSession';

/** Pick the queue-session fields from a larger player snapshot. */
export function readQueueSession(s: QueueSession): QueueSession {
  return {
    queue: s.queue,
    originalQueue: s.originalQueue,
    currentId: s.currentId,
    currentIndex: s.currentIndex,
    shuffle: s.shuffle,
    repeatMode: s.repeatMode,
  };
}

export type CueOptions = {
  autoPlay: boolean;
  bumpLoad: boolean;
  currentTime?: number;
  seekTo?: number | null;
};

export type CuePatch = QueueSession & {
  currentTime: number;
  seekTo: number | null;
  pendingPlay: boolean;
  playing: boolean;
  loadToken?: number;
};

export function buildCuePatch(
  session: QueueSession,
  loadToken: number,
  options: CueOptions,
): CuePatch {
  return {
    ...session,
    currentTime: options.currentTime ?? 0,
    seekTo: options.seekTo ?? 0,
    pendingPlay: options.autoPlay,
    playing: options.autoPlay,
    ...(options.bumpLoad ? { loadToken: loadToken + 1 } : {}),
  };
}

export type PersistMode = 'flush' | 'schedule' | 'none';

/** Unify session writes: cue (autoPlay / loadToken) and persist timing. */
export function createPlayerSessionApply(options: {
  getSession: () => QueueSession;
  getLoadToken: () => number;
  set: (partial: CuePatch | QueueSession | Partial<CuePatch>) => void;
  flushPersist: () => void;
  schedulePersist: () => void;
}) {
  function applyCue(session: QueueSession, cue: CueOptions) {
    options.set(buildCuePatch(session, options.getLoadToken(), cue));
  }

  function applySession(session: QueueSession, persist: PersistMode = 'flush') {
    options.set(session);
    if (persist === 'flush') options.flushPersist();
    else if (persist === 'schedule') options.schedulePersist();
  }

  function applyCueAndFlush(session: QueueSession, cue: CueOptions) {
    applyCue(session, cue);
    options.flushPersist();
  }

  return {
    readSession: options.getSession,
    applyCue,
    applySession,
    applyCueAndFlush,
  };
}
