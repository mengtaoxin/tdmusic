import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { AppNotice } from '@/components/AppNotice';
import { renderWithProviders } from '@/__tests__/renderWithProviders';
import { useNoticeStore } from '@/stores/notice';

describe('AppNotice', () => {
  it('shows a short confirmation when a track is queued to play next', async () => {
    useNoticeStore.setState({ message: '', open: false, nonce: 0 });
    renderWithProviders(<AppNotice />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    useNoticeStore.getState().show('Added to play next');

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Added to play next');
    expect(status.closest('.MuiSnackbar-root')).toHaveStyle({
      bottom: 'calc(88px + 8px)',
    });
  });
});
