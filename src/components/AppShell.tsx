import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'

import { AppHeader } from '@/components/AppHeader'
import { AudioHost } from '@/components/AudioHost'
import { NowPlayingFooter } from '@/components/NowPlayingFooter'
import { loadCatalogAndHydratePlayer } from '@/lib/catalog/catalogBootstrap'
import '@/styles/app.css'

export function AppShell() {
  useEffect(() => {
    void loadCatalogAndHydratePlayer()
  }, [])

  return (
    <div className="tdmusic-app">
      <AppHeader />
      <main className="main-scroller" data-testid="main-scroller">
        <Outlet />
      </main>
      <NowPlayingFooter />
      <AudioHost />
    </div>
  )
}
