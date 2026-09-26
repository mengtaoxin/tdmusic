import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/__tests__/renderWithProviders';
import { StatsPage } from '@/components/StatsPage';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { MIN_COUNTED_PLAY_DURATION_MS } from '@/lib/playback/playHistoryStats';
import { resetPlayHistoryDbForTests, savePlayRecord } from '@/lib/playback/playHistoryStore';
import { useCatalogStore } from '@/stores/catalog';

const DAY_MS = 24 * 60 * 60 * 1000;

function track(id: string, title: string): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    volumeRatio: 100,
    displayTitle: title,
    displayArtist: 'Artist',
    displayAlbum: 'Album',
  };
}

describe('StatsPage', () => {
  beforeEach(async () => {
    await resetPlayHistoryDbForTests();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('lists counted plays sorted high to low and can switch the day range', async () => {
    const user = userEvent.setup();
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    useCatalogStore
      .getState()
      .setTracks([track('a', 'Alpha'), track('b', 'Beta'), track('c', 'Old Hit')]);

    await savePlayRecord({
      trackId: 'a',
      startedAt: now - DAY_MS,
      endedAt: now - DAY_MS + MIN_COUNTED_PLAY_DURATION_MS + 1,
    });
    await savePlayRecord({
      trackId: 'a',
      startedAt: now - DAY_MS + 10_000,
      endedAt: now - DAY_MS + 10_000 + MIN_COUNTED_PLAY_DURATION_MS + 1,
    });
    await savePlayRecord({
      trackId: 'b',
      startedAt: now - DAY_MS,
      endedAt: now - DAY_MS + MIN_COUNTED_PLAY_DURATION_MS + 1,
    });
    await savePlayRecord({
      trackId: 'c',
      startedAt: now - 10 * DAY_MS,
      endedAt: now - 10 * DAY_MS + MIN_COUNTED_PLAY_DURATION_MS + 1,
    });

    renderWithProviders(<StatsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('stats-row-a')).toBeInTheDocument();
    });

    const rows = screen.getAllByTestId(/stats-row-/);
    expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([
      'stats-row-a',
      'stats-row-b',
    ]);
    expect(within(screen.getByTestId('stats-row-a')).getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByTestId('stats-count-a')).toHaveTextContent('2');
    expect(screen.getByTestId('stats-count-b')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Last 30 days' }));

    await waitFor(() => {
      expect(screen.getByTestId('stats-row-c')).toBeInTheDocument();
    });
    expect(
      screen.getAllByTestId(/stats-row-/).map((row) => row.getAttribute('data-testid')),
    ).toEqual(['stats-row-a', 'stats-row-b', 'stats-row-c']);
  });

  it('shows an empty state when nothing qualifies', async () => {
    renderWithProviders(<StatsPage />);
    expect(await screen.findByText('No listening stats yet.')).toBeInTheDocument();
  });
});
