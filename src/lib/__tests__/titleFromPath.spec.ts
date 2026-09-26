import { describe, expect, it } from 'vitest';

import { titleFromPath } from '../titleFromPath';

describe('titleFromPath', () => {
  it('extracts a decoded basename without extension from a remote URL', () => {
    expect(titleFromPath('http://ex.com/music/9277%20-%20%E5%B0%9A%E6%96%87%E5%A9%B7.mp3')).toBe(
      '9277 - 尚文婷',
    );
  });

  it('extracts basename from a site-absolute path', () => {
    expect(titleFromPath('/folder/sample-1.mp3')).toBe('sample-1');
  });

  it('strips query and hash before taking the basename', () => {
    expect(titleFromPath('https://cdn.example.com/a%20b.flac?x=1#frag')).toBe('a b');
  });

  it('returns empty string when no basename is available', () => {
    expect(titleFromPath('https://cdn.example.com/')).toBe('');
    expect(titleFromPath('')).toBe('');
  });
});
