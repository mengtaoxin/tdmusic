import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  type AnyRouter,
} from '@tanstack/react-router'

import '@/i18n'
import { muiTheme } from '@/theme/muiTheme'

const STUB_PATHS = [
  '/now-playing',
  '/music',
  '/playlists',
  '/artists',
  '/albums',
  '/search',
  '/settings',
  '/config-guides',
  '/about',
  '/logs',
] as const

type ProvidersProps = {
  children: ReactNode
  withCssBaseline?: boolean
}

export function TestProviders({ children, withCssBaseline = true }: ProvidersProps) {
  return (
    <ThemeProvider theme={muiTheme}>
      {withCssBaseline ? <CssBaseline /> : null}
      {children}
    </ThemeProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { withCssBaseline?: boolean },
) {
  const { withCssBaseline = true, ...renderOptions } = options ?? {}
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders withCssBaseline={withCssBaseline}>{children}</TestProviders>
    ),
    ...renderOptions,
  })
}

export type TestRouterOptions = {
  /** UI rendered for the matched index route (or as the sole root UI). */
  component: () => ReactNode
  /**
   * Optional layout route that must render `<Outlet />`.
   * When omitted, `component` is mounted directly on the root route.
   */
  rootComponent?: () => ReactNode
  initialEntries?: string[]
  withCssBaseline?: boolean
  extraPaths?: string[]
}

/** Minimal TanStack memory router for components that use Link / useNavigate. */
export function createTestRouter(options: TestRouterOptions): AnyRouter {
  const {
    component: Page,
    rootComponent,
    initialEntries = ['/'],
    withCssBaseline = true,
    extraPaths = [],
  } = options

  if (!rootComponent) {
    const rootRoute = createRootRoute({
      component: () => (
        <TestProviders withCssBaseline={withCssBaseline}>
          <Page />
        </TestProviders>
      ),
    })

    const stubs = [...new Set([...STUB_PATHS, ...extraPaths])].map((path) =>
      createRoute({
        getParentRoute: () => rootRoute,
        path,
        component: () => null,
      }),
    )

    return createRouter({
      routeTree: rootRoute.addChildren(stubs),
      history: createMemoryHistory({ initialEntries }),
    })
  }

  const rootRoute = createRootRoute({
    component: rootComponent,
  })

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Page,
  })

  const stubs = [...new Set([...STUB_PATHS, ...extraPaths])].map((path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => null,
    }),
  )

  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute, ...stubs]),
    history: createMemoryHistory({ initialEntries }),
  })
}

export async function renderWithTestRouter(options: TestRouterOptions) {
  const router = createTestRouter(options)
  await router.load()
  const result = render(<RouterProvider router={router} />)
  return { ...result, router }
}
