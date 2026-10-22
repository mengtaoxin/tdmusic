const CONCURRENCY = 3;

export type DownloadPriority = 'high' | 'normal' | 'low';

const RANK: Record<DownloadPriority, number> = { high: 2, normal: 1, low: 0 };

export type AudioDownloadJob<T> = {
  done: Promise<T>;
  /** Raise (never lower) this job's priority; preempts running jobs now below it. */
  raisePriority: (priority: DownloadPriority) => void;
};

type Job = {
  rank: number;
  seq: number;
  controller: AbortController | null;
  preempted: boolean;
  /** Set when the job is cancelled outright and must not be re-queued. */
  dropped: boolean;
  reject: ((reason: unknown) => void) | null;
  run: () => void;
};

let pending: Job[] = [];
const running = new Set<Job>();
let nextSeq = 0;

function sortPending(): void {
  pending.sort((a, b) => b.rank - a.rank || a.seq - b.seq);
}

function hasHigherThan(rank: number): boolean {
  for (const job of running) if (job.rank > rank) return true;
  return pending.some((job) => job.rank > rank);
}

function preemptBelow(rank: number): void {
  for (const job of running) {
    if (job.rank < rank && !job.preempted) {
      job.preempted = true;
      job.controller?.abort();
    }
  }
}

function pump(): void {
  for (;;) {
    const next = pending[0];
    if (!next || running.size >= CONCURRENCY || hasHigherThan(next.rank)) return;
    pending.shift();
    next.run();
  }
}

function enqueue(job: Job): void {
  pending.push(job);
  sortPending();
}

/**
 * Queue `fn` for one of at most 3 global audio-download slots.
 * Creating (or raising) a job aborts running jobs of lower priority; they are
 * re-queued and run again from scratch once no higher-priority job remains.
 */
export function startAudioDownloadJob<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  priority: DownloadPriority = 'normal',
): AudioDownloadJob<T> {
  let resolveDone!: (value: T) => void;
  let rejectDone!: (reason: unknown) => void;
  const done = new Promise<T>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const job: Job = {
    rank: RANK[priority],
    seq: nextSeq++,
    controller: null,
    preempted: false,
    dropped: false,
    reject: null,
    run: () => {
      const controller = new AbortController();
      job.controller = controller;
      job.preempted = false;
      running.add(job);
      Promise.resolve()
        .then(() => fn(controller.signal))
        .then(
          (value) => {
            running.delete(job);
            resolveDone(value);
            pump();
          },
          (error: unknown) => {
            running.delete(job);
            if (job.preempted && !job.dropped) {
              enqueue(job);
            } else {
              rejectDone(error);
            }
            pump();
          },
        );
    },
  };

  job.reject = rejectDone;
  preemptBelow(job.rank);
  enqueue(job);
  pump();

  return {
    done,
    raisePriority: (next) => {
      const rank = RANK[next];
      if (rank <= job.rank) return;
      job.rank = rank;
      sortPending();
      preemptBelow(rank);
      pump();
    },
  };
}

export function withAudioDownloadSlot<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  priority: DownloadPriority = 'normal',
): Promise<T> {
  return startAudioDownloadJob(fn, priority).done;
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}

/** Stop queued and running jobs of one priority. They are not restarted. */
export function abortAudioDownloads(priority: DownloadPriority): void {
  const rank = RANK[priority];
  const droppedPending: Job[] = [];
  pending = pending.filter((job) => {
    if (job.rank !== rank) return true;
    droppedPending.push(job);
    return false;
  });
  for (const job of droppedPending) {
    job.dropped = true;
    job.reject?.(abortError());
  }
  for (const job of running) {
    if (job.rank !== rank || job.dropped) continue;
    job.dropped = true;
    job.controller?.abort();
  }
  pump();
}

export function resetDownloadLimiterForTests(): void {
  pending = [];
  running.clear();
  nextSeq = 0;
}

export function getDownloadLimiterStatsForTests() {
  return { active: running.size, pending: pending.length };
}
