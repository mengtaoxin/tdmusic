import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AppHeader } from '@/components/AppHeader'
import { renderWithTestRouter } from '@/__tests__/renderWithProviders'

vi.mock('@/lib/navLayout', () => ({
  shouldCollapseNav: () => false,
}))

type RoCallback = ResizeObserverCallback
const resizeObserverCallbacks: RoCallback[] = []

function stubResizeObserver() {
  resizeObserverCallbacks.length = 0
  class FakeResizeObserver {
    constructor(cb: RoCallback) {
      resizeObserverCallbacks.push(cb)
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
}

function applyDesktopWidths() {
  const toolbar = document.querySelector('.MuiToolbar-root')
  const brand = document.querySelector('[data-testid="brand-title"]')?.parentElement
  const nav = document.querySelector('[data-testid="desktop-nav"]')

  if (toolbar) {
    Object.defineProperty(toolbar, 'clientWidth', { configurable: true, get: () => 1200 })
  }
  if (brand) {
    Object.defineProperty(brand, 'offsetWidth', { configurable: true, get: () => 160 })
  }
  if (nav) {
    Object.defineProperty(nav, 'scrollWidth', { configurable: true, get: () => 400 })
  }
}

async function measureNavLayout() {
  applyDesktopWidths()
  await act(async () => {
    for (const cb of resizeObserverCallbacks) {
      cb([], {} as ResizeObserver)
    }
  })
}

describe('AppHeader', () => {
  beforeEach(() => {
    stubResizeObserver()
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1400 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders brand-title and nav chrome', async () => {
    await renderWithTestRouter({ component: () => <AppHeader /> })
    await measureNavLayout()

    expect(screen.getByTestId('brand-title')).toHaveTextContent('tdmusic')
    expect(
      screen.getByTestId('desktop-nav') || screen.queryByTestId('nav-menu-toggle'),
    ).toBeTruthy()

    await waitFor(() => {
      expect(screen.getByTestId('desktop-nav')).not.toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('shows locale menu options when opened on a desktop layout', async () => {
    const user = userEvent.setup()
    await renderWithTestRouter({ component: () => <AppHeader /> })
    await measureNavLayout()

    const localeToggle = await screen.findByTestId('nav-locale-toggle')
    expect(localeToggle).toBeVisible()

    await user.click(localeToggle)
    expect(screen.getByTestId('locale-option-en')).toBeInTheDocument()
    expect(screen.getByTestId('locale-option-zh')).toBeInTheDocument()
  })
})
