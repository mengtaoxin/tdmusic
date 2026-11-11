import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { routeTree } from './routeTree.gen';
import { ChunkErrorBoundary } from '@/components/ChunkErrorBoundary';
import { installSpaUpdateNotice } from '@/lib/spaUpdateNotice';
import { muiTheme } from '@/theme/muiTheme';
import { bindAppCatalogBootstrap, bindAppManualDownloads } from '@/stores/bindAppCatalog';
import '@/i18n';
import '@/styles/app.css';

bindAppCatalogBootstrap();
bindAppManualDownloads();

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ChunkErrorBoundary>
        <RouterProvider router={router} />
      </ChunkErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);

void installSpaUpdateNotice();
