import { existsSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { pwaOptions } from '../pwaOptions'

describe('pwaOptions', () => {
  it('exposes an installable manifest and an app-shell service worker that skips audio', () => {
    expect(pwaOptions.registerType).toBe('autoUpdate')
    expect(pwaOptions.manifest).toMatchObject({
      name: 'tdmusic',
      short_name: 'tdmusic',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0b1c22',
      theme_color: '#0b1c22',
    })

    const icons = pwaOptions.manifest.icons
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/pwa-192.png', sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ src: '/pwa-512.png', sizes: '512x512', type: 'image/png' }),
      ]),
    )
    expect(existsSync('public/pwa-192.png')).toBe(true)
    expect(existsSync('public/pwa-512.png')).toBe(true)

    expect(pwaOptions.workbox.navigateFallback).toBe('index.html')
    expect(pwaOptions.workbox.globIgnores).toEqual(
      expect.arrayContaining(['**/*.{mp3,flac,wav,ogg,m4a,aac}']),
    )
    const denylist = pwaOptions.workbox.navigateFallbackDenylist.map((pattern) => pattern.source)
    expect(denylist.join(' ')).toMatch(/configs\\.json/)
    expect(denylist.join(' ')).toMatch(/mp3/)
    expect(pwaOptions.includeAssets).not.toContain('configs.json')
  })
})
