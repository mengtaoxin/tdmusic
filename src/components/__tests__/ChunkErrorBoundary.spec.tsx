import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ChunkErrorBoundary } from '@/components/ChunkErrorBoundary';
import * as spaUpdateNotice from '@/lib/spaUpdateNotice';

function Thrower({ error }: { error: Error }): ReactNode {
  throw error;
}

describe('ChunkErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ChunkErrorBoundary>
        <p>ok</p>
      </ChunkErrorBoundary>,
    );

    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('handles chunk load errors and renders nothing so the notice UI can take over', () => {
    const handleSpy = vi
      .spyOn(spaUpdateNotice, 'handleChunkLoadFailure')
      .mockImplementation(() => {});
    vi.spyOn(spaUpdateNotice, 'isChunkLoadError').mockReturnValue(true);

    render(
      <ChunkErrorBoundary>
        <Thrower error={new Error('Failed to fetch dynamically imported module')} />
      </ChunkErrorBoundary>,
    );

    expect(handleSpy).toHaveBeenCalled();
    expect(screen.queryByText('ok')).not.toBeInTheDocument();
  });

  it('rethrows non-chunk errors', () => {
    vi.spyOn(spaUpdateNotice, 'isChunkLoadError').mockReturnValue(false);

    expect(() =>
      render(
        <ChunkErrorBoundary>
          <Thrower error={new Error('boom')} />
        </ChunkErrorBoundary>,
      ),
    ).toThrow('boom');
  });
});
