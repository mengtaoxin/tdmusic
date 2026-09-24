import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { pwaOptions } from './src/lib/pwa/pwaOptions.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: '\\.(spec|test)\\.(ts|tsx)$',
    }),
    react(),
    // Unit tests load this config; skip service-worker generation there.
    ...(process.env.VITEST ? [] : [VitePWA(pwaOptions)]),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
})
