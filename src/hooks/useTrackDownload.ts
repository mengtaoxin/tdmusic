import { useEffect, useState } from 'react'

import {
  isTrackDownloading,
  subscribeCacheDownloads,
  trackDownloadPercent,
} from '@/lib/cache/musicCache'
import type { DisplayTrack } from '@/stores/catalog'

export function useTrackDownload(track: DisplayTrack | null | undefined) {
  const [downloading, setDownloading] = useState(() => (track ? isTrackDownloading(track) : false))
  const [percent, setPercent] = useState(() => (track ? (trackDownloadPercent(track) ?? 0) : 0))

  useEffect(() => {
    if (!track) {
      setDownloading(false)
      setPercent(0)
      return
    }
    const sync = () => {
      setDownloading(isTrackDownloading(track))
      setPercent(trackDownloadPercent(track) ?? 0)
    }
    sync()
    return subscribeCacheDownloads(sync)
  }, [track])

  return { downloading, percent }
}
