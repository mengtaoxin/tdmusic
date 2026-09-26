import { describe, expect, it } from 'vitest';

import { playingQueueRowIndex } from '@/lib/playback/queueListScroll';

describe('playingQueueRowIndex', () => {
  it('maps the playing queue index onto the rendered row index', () => {
    const rows = [{ queueIndex: 0 }, { queueIndex: 2 }, { queueIndex: 3 }];
    expect(playingQueueRowIndex(rows, 2)).toBe(1);
  });

  it('is null when nothing is playing or the row is missing', () => {
    expect(playingQueueRowIndex([{ queueIndex: 0 }], -1)).toBeNull();
    expect(playingQueueRowIndex([{ queueIndex: 0 }], 4)).toBeNull();
  });
});
