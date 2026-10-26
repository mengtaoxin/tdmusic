import { describe, expect, it, vi } from 'vitest';

import { createBackgroundPrefetch } from '@/lib/playback/backgroundPrefetch';

function ports(overrides: Partial<Parameters<typeof createBackgroundPrefetch>[0]> = {}) {
  return {
    prefetch: vi.fn<() => void>(),
    isPlaying: () => true,
    hasCurrentTrack: () => true,
    ...overrides,
  };
}

describe('createBackgroundPrefetch', () => {
  it('prefetches when scheduled', () => {
    const deps = ports();
    createBackgroundPrefetch(deps).schedule();
    expect(deps.prefetch).toHaveBeenCalledOnce();
  });

  it('prefetches on visibility change while playback is still running', () => {
    const deps = ports();
    createBackgroundPrefetch(deps).onVisibilityChange();
    expect(deps.prefetch).toHaveBeenCalledOnce();
  });

  it('does not prefetch on visibility change when playback is paused or there is no track', () => {
    const paused = ports({ isPlaying: () => false });
    createBackgroundPrefetch(paused).onVisibilityChange();
    expect(paused.prefetch).not.toHaveBeenCalled();

    const empty = ports({ hasCurrentTrack: () => false });
    createBackgroundPrefetch(empty).onVisibilityChange();
    expect(empty.prefetch).not.toHaveBeenCalled();
  });
});
