import { createRootRoute } from '@tanstack/react-router';

import { AppShell } from '@/components/AppShell';
import { ensureCatalogLoaded } from '@/lib/catalog/catalogBootstrap';

export const Route = createRootRoute({
  beforeLoad: async () => {
    await ensureCatalogLoaded();
  },
  component: AppShell,
});
