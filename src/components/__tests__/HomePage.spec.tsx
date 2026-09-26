import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { HomePage } from '@/components/HomePage';
import i18n from '@/i18n';
import { renderWithTestRouter } from '@/__tests__/renderWithProviders';

describe('HomePage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  it('shows product highlights instead of configs.json setup jargon', async () => {
    await renderWithTestRouter({ component: () => <HomePage /> });

    expect(
      screen.getByRole('heading', { name: 'Your music library, in the browser' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No account. No backend. Point tdmusic at your catalog and play.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tracks cache on this device and upcoming songs prefetch; incomplete tags fill in from the audio.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Queue, shuffle, repeat, and lock-screen controls — browse by list, artist, album, or search.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse music' })).toHaveAttribute('href', '/music');

    expect(document.body.textContent).not.toMatch(/configs\.json|music-list/i);
  });
});
