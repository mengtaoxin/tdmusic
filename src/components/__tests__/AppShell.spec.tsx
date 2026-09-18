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

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('insets page content below the header menu', async () => {
    await renderWithTestRouter({
      rootComponent: () => (
        <TestProviders>
          <AppShell />
        </TestProviders>
      ),
      component: () => <div data-testid="page-outlet">page</div>,
    })

    const scroller = screen.getByTestId('main-scroller')
    const page = scroller.firstElementChild
    expect(page).toBeTruthy()
    const paddingTop = getComputedStyle(page as Element).paddingTop
    expect(paddingTop === '24px' || paddingTop === 'var(--td-page-top-inset)').toBe(true)
  })
})
