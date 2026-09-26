import { describe, expect, it } from 'vitest';

import {
  UNKNOWN_ALBUM,
  UNKNOWN_ARTIST,
  localizeAlbumName,
  localizeArtistName,
  resolveDisplayAlbum,
  resolveDisplayArtist,
} from '../displayLabels';

describe('resolveDisplayArtist', () => {
  it('returns the artist when present', () => {
    expect(resolveDisplayArtist('Artist 1')).toBe('Artist 1');
  });

  it('falls back to Unknown artist when missing or blank', () => {
    expect(resolveDisplayArtist(undefined)).toBe(UNKNOWN_ARTIST);
    expect(resolveDisplayArtist('')).toBe(UNKNOWN_ARTIST);
    expect(resolveDisplayArtist('   ')).toBe(UNKNOWN_ARTIST);
  });
});

describe('resolveDisplayAlbum', () => {
  it('returns the album when present', () => {
    expect(resolveDisplayAlbum('Album 1')).toBe('Album 1');
  });

  it('falls back to Unknown album when missing or blank', () => {
    expect(resolveDisplayAlbum(undefined)).toBe(UNKNOWN_ALBUM);
    expect(resolveDisplayAlbum('')).toBe(UNKNOWN_ALBUM);
  });
});

describe('localizeArtistName / localizeAlbumName', () => {
  const t = (key: string) => (key === 'player.unknownArtist' ? '未知歌手' : '未知专辑');

  it('localizes stable unknown labels', () => {
    expect(localizeArtistName(UNKNOWN_ARTIST, t)).toBe('未知歌手');
    expect(localizeAlbumName(UNKNOWN_ALBUM, t)).toBe('未知专辑');
  });

  it('passes through known names', () => {
    expect(localizeArtistName('Artist 1', t)).toBe('Artist 1');
    expect(localizeAlbumName('Album 1', t)).toBe('Album 1');
  });
});
