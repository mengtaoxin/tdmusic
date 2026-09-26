export function isRemotePath(path: string) {
  return /^https?:\/\//i.test(path.trim());
}

/** Same-origin absolute path (`/foo.mp3`); rejects `//…`, `..`, and relative paths. */
export function isSiteAbsolutePath(path: string) {
  const trimmed = path.trim();
  return (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('..') &&
    !trimmed.includes('\\') &&
    !trimmed.includes('\0')
  );
}

export function isPlayablePath(path: string) {
  const trimmed = path.trim();
  return isRemotePath(trimmed) || isSiteAbsolutePath(trimmed);
}
