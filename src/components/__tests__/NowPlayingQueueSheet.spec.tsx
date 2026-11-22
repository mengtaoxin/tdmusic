import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/__tests__/renderWithProviders';
import { NowPlayingQueueSheet } from '@/components/NowPlayingQueueSheet';
import { muiTheme } from '@/theme/muiTheme';

describe('NowPlayingQueueSheet', () => {
  it('slides in from the right within the page content band', () => {
    renderWithProviders(
      <NowPlayingQueueSheet open onClose={vi.fn()}>
        <div>queue</div>
      </NowPlayingQueueSheet>,
    );

    const sheet = screen.getByTestId('now-playing-queue-sheet');
    const drawer = sheet.closest('.MuiDrawer-root');
    expect(drawer).not.toBeNull();
    expect(drawer).toHaveClass('MuiDrawer-anchorRight');

    const band = {
      top: muiTheme.layout.appBarHeight,
      bottom: muiTheme.layout.footerClearance,
      height: 'auto',
    };
    expect(drawer).toHaveStyle(band);
    expect(drawer!.querySelector('.MuiBackdrop-root')).toHaveStyle(band);
    expect(drawer!.querySelector('.MuiDrawer-paper')).toHaveStyle(band);
  });
});
