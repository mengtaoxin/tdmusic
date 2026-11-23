import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/__tests__/renderWithProviders';
import { CatalogPageShell } from '@/components/CatalogPageShell';

describe('CatalogPageShell', () => {
  it('renders page body without a page-level title heading', () => {
    renderWithProviders(
      <CatalogPageShell>
        <div>catalog body</div>
      </CatalogPageShell>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('catalog body')).toBeInTheDocument();
  });
});
