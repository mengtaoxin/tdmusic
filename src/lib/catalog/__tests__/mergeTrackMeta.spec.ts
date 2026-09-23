import { describe, expect, it } from 'vitest'

import { mergeTrackDisplay, type ParsedAudioMeta } from '../mergeTrackMeta'
import type { MusicTrack } from '../normalizeCatalog'

describe('mergeTrackDisplay', () => {
  it('prefers config fields over extracted metadata', () => {
    const track: MusicTrack = {
      id: '1',
      path: 'https://ex.com/a.mp3',
      title: 'Config Title',
      artist: 'Config Artist',
      volumeRatio: 100,
    }
    const parsed: ParsedAudioMeta = {
      title: 'Tag Title',
      artist: 'Tag Artist',
      album: 'Tag Album',
      coverUrl: 'blob:cover',
    }
    expect(mergeTrackDisplay(track, parsed)).toEqual({
      title: 'Config Title',
      artist: 'Config Artist',
      album: 'Tag Album',
      cover: 'blob:cover',
    })
  })

  it('fills missing fields from extracted metadata', () => {
    const track: MusicTrack = { id: '1', path: '/a.mp3', volumeRatio: 100 }
    const parsed: ParsedAudioMeta = {
      title: 'Tag Title',
      artist: 'Tag Artist',
      album: 'Tag Album',
    }
    expect(mergeTrackDisplay(track, parsed)).toEqual({
      title: 'Tag Title',
      artist: 'Tag Artist',
      album: 'Tag Album',
      cover: undefined,
    })
  })

  it('falls back to the path filename when title is missing from config and metadata', () => {
    const track: MusicTrack = {
      id: '1',
      path: 'http://ex.com/music/9277%20-%20%E5%B0%9A%E6%96%87%E5%A9%B7.mp3',
      volumeRatio: 100,
    }
    expect(mergeTrackDisplay(track, null)).toEqual({
      title: '9277 - 尚文婷',
      artist: undefined,
      album: undefined,
      cover: undefined,
    })
  })

  it('falls back to site-absolute path basename without extension', () => {
    const track: MusicTrack = { id: '1', path: '/folder/sample-1.mp3', volumeRatio: 100 }
    expect(mergeTrackDisplay(track, undefined).title).toBe('sample-1')
  })
})
