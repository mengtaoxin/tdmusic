import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/__tests__/renderWithProviders';
import { ArtistTracksPage } from '@/components/ArtistTracksPage';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { useCatalogStore } from '@/stores/catalog';
import { usePlayerStore } from '@/stores/player';

function track(id: string, title: string, artist = 'Doubao'): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    volumeRatio: 100,
    displayTitle: title,
    displayArtist: artist,
    displayAlbum: 'Album 1',
  };
}

describe('ArtistTracksPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hides play-all actions when the artist has no tracks', () => {
    renderWithProviders(<ArtistTracksPage artistName="Missing" />);

    expect(screen.queryByRole('button', { name: 'Play all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Shuffle all' })).not.toBeInTheDocument();
  });

  it('plays the artist catalog in order or shuffled from the page actions', async () => {
    const user = userEvent.setup();
    useCatalogStore
      .getState()
      .setTracks([track('a', 'Track A'), track('b', 'Track B'), track('c', 'Track C')]);
    const playFrom = vi.spyOn(usePlayerStore.getState(), 'playFrom');
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    renderWithProviders(<ArtistTracksPage artistName="Doubao" />);

    await user.click(screen.getByRole('button', { name: 'Play all' }));
    expect(playFrom).toHaveBeenCalledWith(0, ['a', 'b', 'c'], { shuffle: false });

    playFrom.mockClear();
    await user.click(screen.getByRole('button', { name: 'Shuffle all' }));
    expect(playFrom).toHaveBeenCalledWith(2, ['a', 'b', 'c'], { shuffle: true });
  });
});
