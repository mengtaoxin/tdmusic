import { Outlet } from '@tanstack/react-router'

import { AppHeader } from '@/components/AppHeader'
import { AudioHost } from '@/components/AudioHost'
import { NowPlayingFooter } from '@/components/NowPlayingFooter'
import '@/styles/app.css'

export function AppShell() {
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
