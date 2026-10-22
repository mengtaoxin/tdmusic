import { describe, expect, it, vi } from 'vitest';

import { createBackgroundPrefetch } from '@/lib/playback/backgroundPrefetch';

function ports(overrides: Partial<Parameters<typeof createBackgroundPrefetch>[0]> = {}) {
  return {
    isDocumentHidden: () => false,
    abortPrefetchDownloads: vi.fn<() => void>(),
    prefetch: vi.fn<() => void>(),
    isPlaying: () => true,
    hasCurrentTrack: () => true,
    ...overrides,
  };
}

describe('createBackgroundPrefetch', () => {
  it('prefetches while the document is visible', () => {
    const deps = ports();
    createBackgroundPrefetch(deps).schedule();
    expect(deps.prefetch).toHaveBeenCalledOnce();
    expect(deps.abortPrefetchDownloads).not.toHaveBeenCalled();
  });

  it('aborts prefetch downloads and does not start new ones while hidden', () => {
    const deps = ports({ isDocumentHidden: () => true });
    const gate = createBackgroundPrefetch(deps);

    gate.schedule();
    gate.onVisibilityChange();

    expect(deps.prefetch).not.toHaveBeenCalled();
    expect(deps.abortPrefetchDownloads).toHaveBeenCalledTimes(2);
  });

  it('prefetches again when the page returns and playback is still running', () => {
    const deps = ports();
    createBackgroundPrefetch(deps).onVisibilityChange();
    expect(deps.prefetch).toHaveBeenCalledOnce();
    expect(deps.abortPrefetchDownloads).not.toHaveBeenCalled();
  });

  it('does not prefetch on return when playback is paused or there is no track', () => {
    const paused = ports({ isPlaying: () => false });
    createBackgroundPrefetch(paused).onVisibilityChange();
    expect(paused.prefetch).not.toHaveBeenCalled();

    const empty = ports({ hasCurrentTrack: () => false });
    createBackgroundPrefetch(empty).onVisibilityChange();
    expect(empty.prefetch).not.toHaveBeenCalled();
  });
});
