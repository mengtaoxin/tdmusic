import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { CoverImg } from '@/components/CoverImg';
import { renderWithProviders } from '@/__tests__/renderWithProviders';

const COVER = 'https://example.com/cover.jpg';

describe('CoverImg', () => {
  it('shows cover-downloading when downloading', () => {
    renderWithProviders(<CoverImg src={COVER} downloading eager />);
    expect(screen.getByTestId('cover-downloading')).toBeInTheDocument();
    expect(document.querySelector(`img[src="${COVER}"]`)).toBeNull();
  });

  it('shows the image when src is set and not downloading (eager)', () => {
    renderWithProviders(<CoverImg src={COVER} eager />);
    // alt="" maps to role="presentation" in the a11y tree
    expect(document.querySelector(`img[src="${COVER}"]`)).toBeTruthy();
    expect(screen.queryByTestId('cover-downloading')).not.toBeInTheDocument();
  });
});
