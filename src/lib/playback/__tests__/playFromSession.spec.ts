import { describe, expect, it, vi } from 'vitest';

import { createPlayFromSession } from '../playFromSession';

describe('createPlayFromSession', () => {
  it('resets then delivers head and prefix synchronously', () => {
    const onReset = vi.fn<() => void>();
    const onHead = vi.fn<(headId: string, startIndex: number) => void>();
    const onChunk = vi.fn<(chunk: string[]) => void>();
    const session = createPlayFromSession();

    session.start(1, ['a', 'b', 'c'], { onReset, onHead, onChunk });

    expect(onReset).toHaveBeenCalledOnce();
    expect(onHead).toHaveBeenCalledWith('b', 1);
    expect(onChunk).toHaveBeenCalledWith(['a', 'b']);
  });

  it('cancel stops later chunks', async () => {
    vi.useFakeTimers();
    const onChunk = vi.fn<(chunk: string[]) => void>();
    const onDone = vi.fn<() => void>();
    const session = createPlayFromSession();

    session.start(0, ['a', 'b', 'c'], { onReset: () => {}, onHead: () => {}, onChunk, onDone });
    session.cancel();
    await vi.runAllTimersAsync();

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
