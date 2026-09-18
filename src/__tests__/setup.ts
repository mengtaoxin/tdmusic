import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'
import { afterEach, beforeAll, beforeEach } from 'vitest'

import '@/i18n'
import { useCatalogStore } from '@/stores/catalog'
import { usePlayerStore } from '@/stores/player'
import { useSettingsStore } from '@/stores/settings'
import { buildCatalogSnapshot } from '@/lib/catalog/catalogIndex'
import { readStoredConfigUrl } from '@/lib/catalog/configUrl'

// jsdom Blob is not structured-cloneable into fake-indexeddb reliably.
globalThis.Blob = NodeBlob as unknown as typeof globalThis.Blob
globalThis.File = NodeFile as unknown as typeof globalThis.File

// jsdom's createObjectURL expects browser Blobs; Node Blob needs a stub.
let blobUrlSeq = 0
URL.createObjectURL = () => {
  blobUrlSeq += 1
  return `blob:http://tdmusic.test/${blobUrlSeq}`
}
URL.revokeObjectURL = () => {}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  useCatalogStore.setState({
    snapshot: buildCatalogSnapshot([]),
    playlists: [],
    errors: [],
    loading: false,
    loadError: null,
  })
  usePlayerStore.setState({
    queue: [],
    originalQueue: [],
    currentId: null,
    currentIndex: -1,
    currentTime: 0,
    duration: 0,
    playing: false,
    repeatMode: 'off',
    shuffle: false,
    loadToken: 0,
    seekTo: null,
    pendingPlay: false,
  })
  useSettingsStore.setState({
    configUrl: readStoredConfigUrl(),
  })
})

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})
