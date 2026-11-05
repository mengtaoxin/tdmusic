import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/__tests__/renderWithProviders';
import { QuickPlayPage } from '@/components/QuickPlayPage';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { useCatalogStore } from '@/stores/catalog';

function track(id: string): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    volumeRatio: 100,
    displayTitle: id,
    displayArtist: 'Artist',
    displayAlbum: 'Album',
  };
}

describe('QuickPlayPage', () => {
  it('explains when the link cannot start playback', () => {
    useCatalogStore.getState().setTracks([track('a')]);
    useCatalogStore.setState({
      playlists: [{ id: 'empty-list', trackIds: ['gone'] }],
    });

    const { rerender } = renderWithProviders(<QuickPlayPage type="track" id="missing" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Quick play');
    expect(screen.getByRole('alert')).toHaveTextContent('Track not found.');

    rerender(<QuickPlayPage type="playlist" id="missing" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Playlist not found.');

    rerender(<QuickPlayPage type="playlist" id="empty-list" />);
    expect(screen.getByRole('alert')).toHaveTextContent('This playlist has no tracks to play.');

    rerender(<QuickPlayPage type="album" id="a" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This link needs type=track or type=playlist, and an id.',
    );
  });
});
