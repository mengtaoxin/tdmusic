import 'fake-indexeddb/auto'
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'
import { beforeAll, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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

beforeEach(() => {
  setActivePinia(createPinia())
})

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Vuetify overlays read visualViewport in jsdom
  Object.defineProperty(window, 'visualViewport', {
    writable: true,
    value: {
      width: 1024,
      height: 768,
      offsetLeft: 0,
      offsetTop: 0,
      pageLeft: 0,
      pageTop: 0,
      scale: 1,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  })

  // Vuetify layout checks matchMedia in jsdom
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
