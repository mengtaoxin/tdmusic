import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrackListItem } from '@/components/TrackListItem';
import { renderWithProviders } from '@/__tests__/renderWithProviders';
import i18n from '@/i18n';
import { resetCacheDownloadStateForTests } from '@/lib/cache/cacheDownloadState';
import { clearEnsureInFlight } from '@/lib/cache/cacheIngest';
import { AUDIO_FILE_KEY, putFiles, putMeta, resetCacheDbForTests } from '@/lib/cache/cacheStore';
import { resetDownloadLimiterForTests } from '@/lib/cache/downloadLimiter';
import { resetManualDownloadsForTests } from '@/lib/cache/downloadQueue';
import { ensureTrackCached, isTrackQueuedForDownload } from '@/lib/cache/musicCache';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { resetPlayHistoryDbForTests } from '@/lib/playback/playHistoryStore';

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
    clearEnsureInFlight();
    resetCacheDownloadStateForTests();
    await resetCacheDbForTests();
    await resetPlayHistoryDbForTests();
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

  describe('track info dialog', () => {
    async function openTrackInfo(track: DisplayTrack, onSelect?: () => void) {
      const user = userEvent.setup();
      renderWithProviders(<TrackListItem track={track} onSelect={onSelect} />);
      await user.click(screen.getByTestId('track-actions'));
      await user.click(screen.getByTestId('track-info'));
      return { user, dialog: await screen.findByRole('dialog', { name: 'Track info' }) };
    }

    it('shows the title, artist, album, and file path without selecting the track', async () => {
      const onSelect = vi.fn<() => void>();
      const { user, dialog } = await openTrackInfo(makeTrack(), onSelect);

      expect(within(dialog).getByText('Song One')).toBeInTheDocument();
      expect(within(dialog).getByText('Artist One')).toBeInTheDocument();
      expect(within(dialog).getByText('Album One')).toBeInTheDocument();
      expect(within(dialog).getByText('/music/t1.mp3')).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'Close' }));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('shows the cover URL configured in configs.json', async () => {
      const { dialog } = await openTrackInfo({
        ...makeTrack(),
        cover: 'https://example.com/cover.jpg',
        displayCover: 'https://example.com/cover.jpg',
      });

      expect(within(dialog).getByText('From configs.json')).toBeInTheDocument();
      expect(within(dialog).getByText('https://example.com/cover.jpg')).toBeInTheDocument();
    });

    it('says when the track has no cover', async () => {
      const { dialog } = await openTrackInfo(makeTrack());

      expect(within(dialog).getByText('No cover')).toBeInTheDocument();
    });

    it('shows the cached time and file size for a downloaded track', async () => {
      const cachedAt = Date.UTC(2026, 0, 2, 3, 4, 5);
      await putFiles('/music/t1.mp3', [
        {
          relativePath: AUDIO_FILE_KEY,
          blob: new Blob(['x'.repeat(2048)], { type: 'audio/mpeg' }),
        },
      ]);
      await putMeta({ sourceUrl: '/music/t1.mp3', status: 'ready', downloadedAt: cachedAt });

      const { dialog } = await openTrackInfo(makeTrack());

      await vi.waitFor(() => {
        expect(within(dialog).getByTestId('track-info-status')).toHaveTextContent('Downloaded');
      });
      expect(
        within(dialog).getByText(new Date(cachedAt).toLocaleString(i18n.language)),
      ).toBeInTheDocument();
      expect(within(dialog).getByText('2 KB')).toBeInTheDocument();
      expect(within(dialog).getByText('audio/mpeg')).toBeInTheDocument();
    });

    it('shows the failure reason when the last download failed', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          headers: new Headers(),
          body: null,
          blob: async () => new Blob([]),
        }),
      );
      await expect(ensureTrackCached('/music/t1.mp3', 't1')).rejects.toThrow();

      const { dialog } = await openTrackInfo(makeTrack());

      expect(within(dialog).getByTestId('track-info-status')).toHaveTextContent('Download failed');
      expect(within(dialog).getByText('Server responded with HTTP 404')).toBeInTheDocument();
    });

    it('marks a track that is not cached as not downloaded', async () => {
      const { dialog } = await openTrackInfo(makeTrack());

      await vi.waitFor(() => {
        expect(within(dialog).getByTestId('track-info-status')).toHaveTextContent('Not downloaded');
      });
    });
  });
});
