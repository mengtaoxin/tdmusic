import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { AppShell } from '@/components/AppShell'
import { TestProviders, renderWithTestRouter } from '@/__tests__/renderWithProviders'

vi.mock('@/lib/catalog/catalogBootstrap', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/catalog/catalogBootstrap')>()
  return {
    ...actual,
    loadCatalogAndHydratePlayer: vi.fn<() => Promise<void>>(async () => undefined),
    ensureCatalogLoaded: vi.fn<() => Promise<void>>(async () => undefined),
  }
})

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders AppShell with tdmusic brand text', async () => {
    await renderWithTestRouter({
      rootComponent: () => (
        <TestProviders>
          <AppShell />
        </TestProviders>
      ),
      component: () => <div data-testid="home-outlet">home</div>,
    })

    expect(screen.getByTestId('brand-title')).toHaveTextContent('tdmusic')
  })
})
