import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@/__tests__/renderWithProviders';
import { NowPlayingQueueSheet } from '@/components/NowPlayingQueueSheet';
import { muiTheme } from '@/theme/muiTheme';

describe('NowPlayingQueueSheet', () => {
  it('closes on pointerdown outside the sheet, including chrome beyond the content band', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <>
        <button type="button">App chrome</button>
        <NowPlayingQueueSheet open onClose={onClose}>
          <div>queue</div>
        </NowPlayingQueueSheet>
      </>,
    );

    expect(screen.getByTestId('now-playing-queue-sheet')).toBeInTheDocument();
    // Modal aria-hides siblings (app bar / footer); pointer events still reach them.
    await user.click(screen.getByRole('button', { name: 'App chrome', hidden: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when pointerdown stays inside the sheet', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <NowPlayingQueueSheet open onClose={onClose}>
        <button type="button">Inside sheet</button>
      </NowPlayingQueueSheet>,
    );

    await user.click(screen.getByRole('button', { name: 'Inside sheet' }));
    expect(onClose).not.toHaveBeenCalled();
  });

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
    expect(drawer!.querySelector('.MuiDrawer-paper')).toHaveStyle({ height: 'auto' });
  });

  it('caps sheet width at content max width and dims the uncovered band', () => {
    renderWithProviders(
      <NowPlayingQueueSheet open onClose={vi.fn()}>
        <div>queue</div>
      </NowPlayingQueueSheet>,
    );

    const sheet = screen.getByTestId('now-playing-queue-sheet');
    const drawer = sheet.closest('.MuiDrawer-root');
    expect(drawer).not.toBeNull();

    // jsdom getComputedStyle resolves rem to px (40rem → 640px; 1rem → 16px).
    expect(drawer!.querySelector('.MuiDrawer-paper')).toHaveStyle({
      maxWidth: '640px',
    });
    expect(drawer!.querySelector('.MuiBackdrop-root')).toHaveStyle({
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    });
  });

  it('insets the sheet from the menu with rounded corners', () => {
    renderWithProviders(
      <NowPlayingQueueSheet open onClose={vi.fn()}>
        <div>queue</div>
      </NowPlayingQueueSheet>,
    );

    const sheet = screen.getByTestId('now-playing-queue-sheet');
    const paper = sheet.closest('.MuiDrawer-root')?.querySelector('.MuiDrawer-paper');
    expect(paper).not.toBeNull();

    // jsdom resolves calc() / rem (spacing 1.5 → 12px; radiusLg 1rem → 16px).
    const insetPx = 12;
    expect(paper).toHaveStyle({
      top: `${parseInt(muiTheme.layout.appBarHeight, 10) + insetPx}px`,
      bottom: `${parseInt(muiTheme.layout.footerClearance, 10) + insetPx}px`,
      right: `${insetPx}px`,
      borderRadius: '16px',
    });
  });
});
