import { beforeEach, describe, expect, it } from 'vitest';

import {
  abortAudioDownloads,
  getDownloadLimiterStatsForTests,
  resetDownloadLimiterForTests,
  startAudioDownloadJob,
  withAudioDownloadSlot,
} from '../downloadLimiter';

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/** Tasks that record start/abort and settle when released, rejected, or aborted. */
function createHarness() {
  const started: number[] = [];
  const aborted: number[] = [];
  const releases = new Map<number, () => void>();
  const rejects = new Map<number, (error: Error) => void>();

  const makeTask = (id: number) => (signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      started.push(id);
      releases.set(id, resolve);
      rejects.set(id, reject);
      signal.addEventListener(
        'abort',
        () => {
          aborted.push(id);
          reject(new Error('aborted'));
        },
        { once: true },
      );
    });

  const release = (id: number) => releases.get(id)!();
  const fail = (id: number, error: Error) => rejects.get(id)!(error);

  return { started, aborted, makeTask, release, fail };
}

describe('downloadLimiter', () => {
  beforeEach(() => {
    resetDownloadLimiterForTests();
  });

  it('runs at most three tasks concurrently', async () => {
    const { started, makeTask, release } = createHarness();

    const all = [1, 2, 3, 4].map((id) => withAudioDownloadSlot(makeTask(id)));

    await flush();
    expect(started).toEqual([1, 2, 3]);
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 3, pending: 1 });

    release(1);
    await flush();
    expect(started).toEqual([1, 2, 3, 4]);

    for (const id of [2, 3, 4]) release(id);
    await Promise.all(all);
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 0, pending: 0 });
  });

  it('aborts running normal and low tasks when a high task is created, then restarts them', async () => {
    const { started, aborted, makeTask, release } = createHarness();

    const pNormal = withAudioDownloadSlot(makeTask(1), 'normal');
    const pLow = withAudioDownloadSlot(makeTask(2), 'low');
    await flush();
    expect(started).toEqual([1]);

    const pHigh = withAudioDownloadSlot(makeTask(3), 'high');
    await flush();
    expect(aborted).toEqual([1]);
    expect(started).toEqual([1, 3]);

    release(3);
    await flush();
    expect(started).toEqual([1, 3, 1]);

    release(1);
    await flush();
    expect(started).toEqual([1, 3, 1, 2]);

    release(2);
    await Promise.all([pNormal, pLow, pHigh]);
  });

  it('aborts running low tasks when a normal task is created', async () => {
    const { started, aborted, makeTask, release } = createHarness();

    const lows = [1, 2].map((id) => withAudioDownloadSlot(makeTask(id), 'low'));
    await flush();
    expect(started).toEqual([1, 2]);

    const pNormal = withAudioDownloadSlot(makeTask(3), 'normal');
    await flush();
    expect(aborted).toEqual([1, 2]);
    expect(started).toEqual([1, 2, 3]);
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 1, pending: 2 });

    release(3);
    await flush();
    expect(started).toEqual([1, 2, 3, 1, 2]);

    release(1);
    release(2);
    await Promise.all([...lows, pNormal]);
  });

  it('restarts preempted tasks before same-priority tasks queued after them', async () => {
    const { started, makeTask, release } = createHarness();

    const lows = [1, 2, 3, 4].map((id) => withAudioDownloadSlot(makeTask(id), 'low'));
    await flush();
    expect(started).toEqual([1, 2, 3]);

    const pHigh = withAudioDownloadSlot(makeTask(5), 'high');
    await flush();
    expect(started).toEqual([1, 2, 3, 5]);

    release(5);
    await flush();
    expect(started).toEqual([1, 2, 3, 5, 1, 2, 3]);

    release(1);
    await flush();
    expect(started).toEqual([1, 2, 3, 5, 1, 2, 3, 4]);

    for (const id of [2, 3, 4]) release(id);
    await Promise.all([...lows, pHigh]);
  });

  it('starts a waiting high-priority task before waiting lower ones', async () => {
    const { started, makeTask, release } = createHarness();

    const highs = [1, 2, 3].map((id) => withAudioDownloadSlot(makeTask(id), 'high'));
    const pLow = withAudioDownloadSlot(makeTask(4), 'low');
    const pNormal = withAudioDownloadSlot(makeTask(5), 'normal');
    const pHigh = withAudioDownloadSlot(makeTask(6), 'high');
    await flush();
    expect(started).toEqual([1, 2, 3]);

    release(1);
    await flush();
    expect(started).toEqual([1, 2, 3, 6]);

    for (const id of [2, 3, 6]) release(id);
    await flush();
    expect(started).toEqual([1, 2, 3, 6, 5]);

    release(5);
    await flush();
    expect(started).toEqual([1, 2, 3, 6, 5, 4]);

    release(4);
    await Promise.all([...highs, pLow, pNormal, pHigh]);
  });

  it('does not start a new lower task while a higher one is running, even with idle slots', async () => {
    const { started, makeTask, release } = createHarness();

    const pHigh = withAudioDownloadSlot(makeTask(1), 'high');
    await flush();

    const pNormal = withAudioDownloadSlot(makeTask(2), 'normal');
    await flush();
    expect(started).toEqual([1]);
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 1, pending: 1 });

    release(1);
    await flush();
    expect(started).toEqual([1, 2]);

    release(2);
    await Promise.all([pHigh, pNormal]);
  });

  it('raises a waiting task so it preempts and starts', async () => {
    const { started, aborted, makeTask, release } = createHarness();

    const pNormal = withAudioDownloadSlot(makeTask(1), 'normal');
    const lowJob = startAudioDownloadJob(makeTask(2), 'low');
    await flush();
    expect(started).toEqual([1]);

    lowJob.raisePriority('high');
    await flush();
    expect(aborted).toEqual([1]);
    expect(started).toEqual([1, 2]);

    release(2);
    await flush();
    expect(started).toEqual([1, 2, 1]);

    release(1);
    await Promise.all([pNormal, lowJob.done]);
  });

  it('raises a running task without restarting it and preempts tasks now below it', async () => {
    const { started, aborted, makeTask, release } = createHarness();

    const lowJob = startAudioDownloadJob(makeTask(1), 'low');
    const pOtherLow = withAudioDownloadSlot(makeTask(2), 'low');
    await flush();
    expect(started).toEqual([1, 2]);

    lowJob.raisePriority('normal');
    await flush();
    expect(aborted).toEqual([2]);
    expect(started).toEqual([1, 2]);

    release(1);
    await flush();
    expect(started).toEqual([1, 2, 2]);

    release(2);
    await Promise.all([lowJob.done, pOtherLow]);
  });

  it('ignores a raise to an equal or lower priority', async () => {
    const { started, aborted, makeTask, release } = createHarness();

    const highJob = startAudioDownloadJob(makeTask(1), 'high');
    await flush();
    highJob.raisePriority('low');
    const pNormal = withAudioDownloadSlot(makeTask(2), 'normal');
    await flush();
    expect(aborted).toEqual([]);
    expect(started).toEqual([1]);

    release(1);
    await flush();
    release(2);
    await Promise.all([highJob.done, pNormal]);
  });

  it('rejects with the task error when the failure is not a preemption', async () => {
    const { makeTask, fail } = createHarness();

    const p = withAudioDownloadSlot(makeTask(1), 'low');
    await flush();
    fail(1, new Error('boom'));

    await expect(p).rejects.toThrow('boom');
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 0, pending: 0 });
  });

  it('aborts only normal downloads and does not restart them', async () => {
    const { started, aborted, makeTask, release } = createHarness();

    const high = withAudioDownloadSlot(makeTask(1), 'high');
    const normalWaiting = withAudioDownloadSlot(makeTask(2), 'normal');
    await flush();
    expect(started).toEqual([1]);

    const waitingResult = expect(normalWaiting).rejects.toThrow(/abort/i);
    abortAudioDownloads('normal');
    await waitingResult;
    expect(aborted).toEqual([]);
    expect(started).toEqual([1]);

    release(1);
    await high;

    const running = [3, 4, 5].map((id) => withAudioDownloadSlot(makeTask(id), 'normal'));
    await flush();
    const pending = withAudioDownloadSlot(makeTask(6), 'normal');
    const low = withAudioDownloadSlot(makeTask(7), 'low');
    await flush();
    expect(started).toEqual([1, 3, 4, 5]);

    const dropped = [
      expect(pending).rejects.toThrow(/abort/i),
      ...running.map((job) => expect(job).rejects.toThrow('aborted')),
    ];
    abortAudioDownloads('normal');
    await flush();
    await Promise.all(dropped);

    expect(aborted).toEqual([3, 4, 5]);
    expect(started).toEqual([1, 3, 4, 5, 7]);

    release(7);
    await low;
    expect(started).toEqual([1, 3, 4, 5, 7]);
    expect(getDownloadLimiterStatsForTests()).toEqual({ active: 0, pending: 0 });
  });

  it('keeps FIFO order among same-priority waiters', async () => {
    const { started, makeTask, release } = createHarness();

    const all = [1, 2, 3, 4, 5].map((id) => withAudioDownloadSlot(makeTask(id), 'high'));
    await flush();
    expect(started).toEqual([1, 2, 3]);

    release(1);
    await flush();
    expect(started).toEqual([1, 2, 3, 4]);

    release(2);
    await flush();
    expect(started).toEqual([1, 2, 3, 4, 5]);

    for (const id of [3, 4, 5]) release(id);
    await Promise.all(all);
  });
});
