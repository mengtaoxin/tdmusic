import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrackListItem } from '@/components/TrackListItem';
import { renderWithProviders } from '@/__tests__/renderWithProviders';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';

function makeTrack(): DisplayTrack {
  return {
    id: 't1',
    path: '/music/t1.mp3',
    volumeRatio: 100,
    displayTitle: 'Song One',
    displayArtist: 'Artist One',
    displayAlbum: 'Album One',
  };
}

describe('TrackListItem', () => {
  it('renders the track title', () => {
    renderWithProviders(<TrackListItem track={makeTrack()} />);
    expect(screen.getByText('Song One')).toBeInTheDocument();
  });

  it('opens the menu and invokes play-next / add-to-queue callbacks', async () => {
    const user = userEvent.setup();
    const onPlayNext = vi.fn<() => void>();
    const onAddToQueue = vi.fn<() => void>();

    renderWithProviders(
      <TrackListItem
        track={makeTrack()}
        actions="playback"
        onPlayNext={onPlayNext}
        onAddToQueue={onAddToQueue}
      />,
    );

    await user.click(screen.getByTestId('track-actions'));
    await user.click(screen.getByTestId('track-play-next'));
    expect(onPlayNext).toHaveBeenCalledOnce();

    await user.click(screen.getByTestId('track-actions'));
    await user.click(screen.getByTestId('track-add-to-queue'));
    expect(onAddToQueue).toHaveBeenCalledOnce();
  });

  it('invokes remove from the queue actions menu', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn<() => void>();

    renderWithProviders(<TrackListItem track={makeTrack()} actions="queue" onRemove={onRemove} />);

    await user.click(screen.getByTestId('track-actions'));
    await user.click(screen.getByTestId('track-remove'));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
