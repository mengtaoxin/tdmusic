import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { AppNotice } from '@/components/AppNotice';
import { renderWithProviders } from '@/__tests__/renderWithProviders';
import { useNoticeStore } from '@/stores/notice';
import { muiTheme } from '@/theme/muiTheme';

describe('AppNotice', () => {
  it('shows a short confirmation when a track is queued to play next', async () => {
    useNoticeStore.setState({ message: '', open: false, nonce: 0 });
    renderWithProviders(<AppNotice />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    useNoticeStore.getState().show('Added to play next');

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Added to play next');
    // Inline style: jsdom getComputedStyle collapses calc()/CSS vars differently than happy-dom.
    // theme.spacing(1) under cssVariables is `var(--mui-spacing)`.
    const snackbar = status.closest('.MuiSnackbar-root');
    expect(snackbar).toBeInstanceOf(HTMLElement);
    expect((snackbar as HTMLElement).style.bottom).toBe(
      `calc(${muiTheme.layout.footerClearance} + var(--mui-spacing))`,
    );
  });
});
