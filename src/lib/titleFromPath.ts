/** Derive a display title from a track path/URL when config and tags have none. */
export function titleFromPath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return ''

  let pathname = trimmed
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      pathname = new URL(trimmed).pathname
    } else {
      const q = pathname.indexOf('?')
      const h = pathname.indexOf('#')
      const cut = Math.min(q >= 0 ? q : pathname.length, h >= 0 ? h : pathname.length)
      pathname = pathname.slice(0, cut)
    }
  } catch {
    return ''
  }

  const segments = pathname.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  if (!last) return ''

  let decoded = last
  try {
    decoded = decodeURIComponent(last)
  } catch {
    decoded = last
  }

  return decoded.replace(/\.[^/.]+$/, '')
}
