import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import { HomePage } from '@/components/HomePage';
import i18n from '@/i18n';
import { renderWithTestRouter } from '@/__tests__/renderWithProviders';

const SAMPLE_KEYS = [
  'music-list',
  'id',
  'path',
  'title',
  'artist',
  'album',
  'cover',
  'volume-ratio',
  'playlists',
];

describe('HomePage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  it('leads with the one read-only configs.json that drives the whole app', async () => {
    await renderWithTestRouter({ component: () => <HomePage /> });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'One read-only JSON file is your whole music library',
    );
    expect(screen.getByRole('link', { name: 'Browse music' })).toHaveAttribute('href', '/music');
    expect(screen.getByRole('link', { name: 'Write your configs.json' })).toHaveAttribute(
      'href',
      '/config-guides',
    );
  });

  it('annotates every configs.json key with whether it is required', async () => {
    await renderWithTestRouter({ component: () => <HomePage /> });

    const sample = screen.getByTestId('home-json-sample');
    expect(within(sample).getByText('configs.json')).toBeInTheDocument();
    for (const key of SAMPLE_KEYS) {
      expect(within(sample).getAllByText(`"${key}"`).length).toBeGreaterThan(0);
    }
    expect(within(sample).getAllByText('required')).toHaveLength(3);
    expect(within(sample).getAllByText('optional').length).toBeGreaterThan(0);
    expect(
      within(sample).getByText('Unique key; playlists refer to tracks by it'),
    ).toBeInTheDocument();
  });

  it('shows the annotations in Chinese', async () => {
    await i18n.changeLanguage('zh');
    await renderWithTestRouter({ component: () => <HomePage /> });

    const sample = screen.getByTestId('home-json-sample');
    expect(within(sample).getAllByText('必填')).toHaveLength(3);
    expect(within(sample).getAllByText('可选').length).toBeGreaterThan(0);
  });
});
