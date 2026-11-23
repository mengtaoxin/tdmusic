import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithTestRouter } from '@/__tests__/renderWithProviders';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { NowPlayingPage } from '@/components/NowPlayingPage';
import { useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

function makeTrack(id = 't1', title = 'Song One'): DisplayTrack {
  return {
    id,
    url: `/music/${id}.mp3`,
    volumeRatio: 100,
    displayTitle: title,
    displayArtist: 'Artist One',
    displayAlbum: 'Album One',
  };
}

function seedPlaying() {
  const track = makeTrack();
  useCatalogStore.getState().setTracks([track]);
  usePlayerStore.setState({
    queue: [track.id],
    originalQueue: [track.id],
    currentId: track.id,
    currentIndex: 0,
  });
}

describe('NowPlayingPage', () => {
  it('centers the player in the page content area', async () => {
    seedPlaying();
    await renderWithTestRouter({ component: () => <NowPlayingPage /> });

    const page = screen.getByTestId('now-playing-page');
    expect(page).toHaveStyle({
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    });
  });

  it('keeps the queue in a right-side sheet opened from the player', async () => {
    const user = userEvent.setup();
    const tracks = [
      makeTrack('t1', 'Song One'),
      makeTrack('t2', 'Song Two'),
      makeTrack('t3', 'Song Three'),
    ];
    useCatalogStore.getState().setTracks(tracks);
    usePlayerStore.setState({
      queue: tracks.map((track) => track.id),
      originalQueue: tracks.map((track) => track.id),
      currentId: tracks[0]!.id,
      currentIndex: 0,
    });

    await renderWithTestRouter({ component: () => <NowPlayingPage /> });

    const page = screen.getByTestId('now-playing-page');
    expect(page.querySelector('.queue-list')).toBeNull();
    expect(screen.queryByTestId('now-playing-queue-sheet')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open queue' }));

    const sheet = await screen.findByTestId('now-playing-queue-sheet');
    expect(sheet.closest('.MuiDrawer-root')).toHaveClass('MuiDrawer-anchorRight');
    expect(within(sheet).getByRole('heading', { name: 'Now playing queue' })).toBeInTheDocument();
    expect(sheet.querySelector('.queue-list')).not.toBeNull();
    expect(sheet.querySelector('.list-host')).not.toBeNull();

    await user.click(within(sheet).getByRole('button', { name: 'Close queue' }));
    await waitFor(() => {
      expect(screen.queryByTestId('now-playing-queue-sheet')).not.toBeInTheDocument();
    });
  });

  it('opens track info from the leftmost control so play stays centered', async () => {
    const user = userEvent.setup();
    seedPlaying();
    await renderWithTestRouter({ component: () => <NowPlayingPage /> });

    const cover = document.querySelector('.cover-wrap');
    expect(cover).not.toBeNull();
    expect(within(cover as HTMLElement).queryByRole('button', { name: 'Track info' })).toBeNull();

    const controls = document.querySelector('.controls');
    expect(controls).not.toBeNull();
    const buttons = within(controls as HTMLElement).getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Track info',
      'Repeat',
      'Previous',
      'Play',
      'Next',
      'Shuffle',
      'Open queue',
    ]);

    await user.click(buttons[0]!);

    const dialog = await screen.findByRole('dialog', { name: 'Track info' });
    expect(within(dialog).getByText('Song One')).toBeInTheDocument();
    expect(within(dialog).getByText('/music/t1.mp3')).toBeInTheDocument();
  });

  it('hides track info when nothing is playing', async () => {
    await renderWithTestRouter({ component: () => <NowPlayingPage /> });

    expect(screen.queryByRole('button', { name: 'Track info' })).not.toBeInTheDocument();
  });

  it('keeps artist and album on one line with ellipsis when the album name is long', async () => {
    const longAlbum =
      'An Extremely Long Album Title That Must Not Wrap Onto A Second Line And Push Controls Down';
    const track = makeTrack();
    track.displayAlbum = longAlbum;
    useCatalogStore.getState().setTracks([track]);
    usePlayerStore.setState({
      queue: [track.id],
      originalQueue: [track.id],
      currentId: track.id,
      currentIndex: 0,
    });

    await renderWithTestRouter({ component: () => <NowPlayingPage /> });

    const meta = screen.getByTestId('now-playing-track-meta');
    expect(meta).toHaveTextContent('Artist One');
    expect(meta).toHaveTextContent(longAlbum);
    expect(meta).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  });

  it('keeps a very long song title on one line with ellipsis', async () => {
    const longTitle =
      'An Extremely Long Song Title That Must Not Wrap Onto A Second Line And Push Controls Down';
    const track = makeTrack('t1', longTitle);
    useCatalogStore.getState().setTracks([track]);
    usePlayerStore.setState({
      queue: [track.id],
      originalQueue: [track.id],
      currentId: track.id,
      currentIndex: 0,
    });

    await renderWithTestRouter({ component: () => <NowPlayingPage /> });

    const title = screen.getByRole('heading', { level: 5, name: longTitle });
    expect(title).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  });
});
