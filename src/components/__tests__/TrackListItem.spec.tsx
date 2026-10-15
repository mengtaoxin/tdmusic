import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrackListItem } from '@/components/TrackListItem';
import { renderWithProviders } from '@/__tests__/renderWithProviders';
import { putMeta, resetCacheDbForTests } from '@/lib/cache/cacheStore';
import { resetDownloadLimiterForTests } from '@/lib/cache/downloadLimiter';
import { resetManualDownloadsForTests } from '@/lib/cache/downloadQueue';
import { isTrackQueuedForDownload } from '@/lib/cache/musicCache';
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
  beforeEach(async () => {
    resetManualDownloadsForTests();
    resetDownloadLimiterForTests();
    await resetCacheDbForTests();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    );
  });

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

  it('does not select the track when dismissing the actions menu by clicking outside', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<() => void>();

    renderWithProviders(<TrackListItem track={makeTrack()} actions="queue" onSelect={onSelect} />);

    await user.click(screen.getByTestId('track-actions'));
    const backdrop = document.querySelector<HTMLElement>('.MuiBackdrop-root');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not select the track when choosing an actions menu item', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<() => void>();
    const onRemove = vi.fn<() => void>();

    renderWithProviders(
      <TrackListItem track={makeTrack()} actions="queue" onSelect={onSelect} onRemove={onRemove} />,
    );

    await user.click(screen.getByTestId('track-actions'));
    await user.click(screen.getByTestId('track-remove'));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('queues the track for download from the actions menu', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TrackListItem track={makeTrack()} />);

    await user.click(screen.getByTestId('track-actions'));
    const download = screen.getByTestId('track-download');
    expect(download).toHaveTextContent('Download');
    await user.click(download);

    await vi.waitFor(() => expect(isTrackQueuedForDownload('/music/t1.mp3')).toBe(true));

    await user.click(screen.getByTestId('track-actions'));
    const queued = screen.getByTestId('track-download');
    expect(queued).toHaveTextContent('Queued for download');
    expect(queued).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows a disabled Downloaded item when the track is already cached', async () => {
    const user = userEvent.setup();
    await putMeta({ sourceUrl: '/music/t1.mp3', status: 'ready', downloadedAt: 1 });
    renderWithProviders(<TrackListItem track={makeTrack()} />);

    await user.click(screen.getByTestId('track-actions'));

    await vi.waitFor(() => {
      const item = screen.getByTestId('track-download');
      expect(item).toHaveTextContent('Downloaded');
      expect(item).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
