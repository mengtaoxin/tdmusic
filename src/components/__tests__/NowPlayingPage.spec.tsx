import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithTestRouter } from '@/__tests__/renderWithProviders';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { NowPlayingPage } from '@/components/NowPlayingPage';
import { useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

function makeTrack(id = 't1', title = 'Song One'): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
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
  it('opens track info for the current song from the player', async () => {
    const user = userEvent.setup();
    seedPlaying();
    await renderWithTestRouter({ component: () => <NowPlayingPage /> });

    await user.click(screen.getByRole('button', { name: 'Track info' }));

    const dialog = await screen.findByRole('dialog', { name: 'Track info' });
    expect(within(dialog).getByText('Song One')).toBeInTheDocument();
    expect(within(dialog).getByText('/music/t1.mp3')).toBeInTheDocument();
  });

  it('hides track info when nothing is playing', async () => {
    await renderWithTestRouter({ component: () => <NowPlayingPage /> });

    expect(screen.queryByRole('button', { name: 'Track info' })).not.toBeInTheDocument();
  });
});
