import { describe, expect, it } from 'vitest';

import { isRemotePath, isSiteAbsolutePath } from '../paths';

describe('isRemotePath', () => {
  it('accepts http and https URLs', () => {
    expect(isRemotePath('https://example.com/a.mp3')).toBe(true);
    expect(isRemotePath('http://file.example.com/x.mp3')).toBe(true);
  });

  it('rejects non-http paths', () => {
    expect(isRemotePath('/sample-1.mp3')).toBe(false);
    expect(isRemotePath('sample-1.mp3')).toBe(false);
    expect(isRemotePath('ftp://x/a.mp3')).toBe(false);
  });
});

describe('isSiteAbsolutePath', () => {
  it('accepts same-origin absolute paths', () => {
    expect(isSiteAbsolutePath('/sample-1.mp3')).toBe(true);
  });

  it('rejects relative and unsafe paths', () => {
    expect(isSiteAbsolutePath('sample-1.mp3')).toBe(false);
    expect(isSiteAbsolutePath('//evil.com/a')).toBe(false);
    expect(isSiteAbsolutePath('/../etc/passwd')).toBe(false);
  });
});
