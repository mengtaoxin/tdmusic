import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';

import { AlbumGallery } from '@/components/AlbumGallery';
import { renderWithTestRouter } from '@/__tests__/renderWithProviders';

type RoCallback = ResizeObserverCallback;
const resizeObserverCallbacks: RoCallback[] = [];

function stubResizeObserver() {
  resizeObserverCallbacks.length = 0;
  class FakeResizeObserver {
    constructor(cb: RoCallback) {
      resizeObserverCallbacks.push(cb);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
}

async function measureGalleryHost() {
  const host = document.querySelector('.album-gallery');
  const scroll = document.querySelector('.album-list') as HTMLElement | null;
  if (host) {
    Object.defineProperty(host, 'clientWidth', { configurable: true, get: () => 640 });
    Object.defineProperty(host, 'clientHeight', { configurable: true, get: () => 480 });
  }
  if (scroll) {
    Object.defineProperty(scroll, 'clientWidth', { configurable: true, get: () => 640 });
    Object.defineProperty(scroll, 'clientHeight', { configurable: true, get: () => 480 });
    Object.defineProperty(scroll, 'offsetHeight', { configurable: true, get: () => 480 });
    scroll.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        bottom: 480,
        right: 640,
        width: 640,
        height: 480,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
  }
  await act(async () => {
    for (const cb of resizeObserverCallbacks) {
      cb([], {} as ResizeObserver);
    }
  });
}

describe('AlbumGallery', () => {
  beforeEach(() => {
    stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders an optional label and direct to on a tile', async () => {
    await renderWithTestRouter({
      component: () => (
        <AlbumGallery
          tiles={[
            {
              name: '__all__',
              label: 'All music by this artist',
              trackCount: 5,
              coverSrc: 'https://example.com/cover.jpg',
              to: '/artists/Artist%201',
            },
          ]}
          pathFor={() => '/albums/should-not-use'}
        />
      ),
      extraPaths: ['/artists/$name', '/albums/$name'],
    });
    await measureGalleryHost();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /All music by this artist/ })).toBeInTheDocument();
    });
    const link = screen.getByRole('link', { name: /All music by this artist/ });
    expect(link).toHaveAttribute('href', '/artists/Artist%201');
    expect(document.querySelector('img[src="https://example.com/cover.jpg"]')).toBeTruthy();
  });
});
