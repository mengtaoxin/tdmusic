import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithTestRouter } from '@/__tests__/renderWithProviders';
import { SearchPage } from '@/components/SearchPage';
import type { DisplayTrack } from '@/lib/catalog/catalogIndex';
import { albumPath } from '@/lib/routes/albumRoutes';
import { artistAlbumsPath } from '@/lib/routes/artistRoutes';
import { useCatalogStore } from '@/stores/catalog';
import i18n from '@/i18n';

function track(
  id: string,
  artist: string,
  album: string,
  extras: Partial<DisplayTrack> = {},
): DisplayTrack {
  return {
    id,
    path: `/music/${id}.mp3`,
    volumeRatio: 100,
    displayTitle: extras.displayTitle ?? id,
    displayArtist: artist,
    displayAlbum: album,
    ...extras,
  };
}

describe('SearchPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
    useCatalogStore
      .getState()
      .setTracks([
        track('a', 'Alpha Artist', 'Z Album', { displayTitle: 'Song A' }),
        track('b', 'Beta Band', 'Alpha Album', { displayTitle: 'Song B' }),
      ]);
  });

  it('links artist and album chips to their catalog pages', async () => {
    const user = userEvent.setup();
    await renderWithTestRouter({
      component: () => <SearchPage />,
      extraPaths: ['/artists/$name/albums', '/albums/$album'],
    });

    await user.type(screen.getByLabelText('Search tracks, artists, albums'), 'alpha');

    const artistLink = screen.getByRole('link', { name: 'Alpha Artist' });
    expect(artistLink).toHaveAttribute('href', artistAlbumsPath('Alpha Artist'));

    const albumLink = screen.getByRole('link', { name: 'Alpha Album' });
    expect(albumLink).toHaveAttribute('href', albumPath('Alpha Album'));
  });
});
