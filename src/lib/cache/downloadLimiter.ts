const CONCURRENCY = 3;

export type DownloadPriority = 'high' | 'normal';

type Waiter = {
  priority: DownloadPriority;
  resume: () => void;
};

const pending: Waiter[] = [];
let active = 0;
let activeHigh = 0;

function hasHighWaiter(): boolean {
  return pending.some((w) => w.priority === 'high');
}

function takeNextWaiter(): Waiter | undefined {
  if (active >= CONCURRENCY) return undefined;

  const highIndex = pending.findIndex((w) => w.priority === 'high');
  if (highIndex >= 0) {
    return pending.splice(highIndex, 1)[0];
  }

  if (activeHigh > 0) return undefined;

  return pending.shift();
}

function begin(priority: DownloadPriority): void {
  active += 1;
  if (priority === 'high') activeHigh += 1;
}

function canStartNow(priority: DownloadPriority): boolean {
  if (active >= CONCURRENCY) return false;
  if (priority === 'high') return true;
  return activeHigh === 0 && !hasHighWaiter();
}

function acquire(priority: DownloadPriority): Promise<void> {
  if (canStartNow(priority)) {
    begin(priority);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    pending.push({
      priority,
      resume: () => {
        begin(priority);
        resolve();
      },
    });
  });
}

function pump(): void {
  for (;;) {
    const next = takeNextWaiter();
    if (!next) return;
    next.resume();
  }
}

function release(priority: DownloadPriority): void {
  active -= 1;
  if (priority === 'high') activeHigh -= 1;
  pump();
}

/** Run `fn` while holding one of at most 3 global audio-download slots. */
export async function withAudioDownloadSlot<T>(
  fn: () => Promise<T>,
  priority: DownloadPriority = 'normal',
): Promise<T> {
  await acquire(priority);
  try {
    return await fn();
  } finally {
    release(priority);
  }
}

export function resetDownloadLimiterForTests(): void {
  pending.length = 0;
  active = 0;
  activeHigh = 0;
}

export function getDownloadLimiterStatsForTests() {
  return { active, pending: pending.length };
}
