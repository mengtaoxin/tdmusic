const EXT_TO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  webm: 'audio/webm',
};

/** MIME for `<audio>` from a track path/URL extension; undefined when unknown. */
export function audioMimeFromPath(path: string): string | undefined {
  const trimmed = path.trim();
  if (!trimmed) return undefined;

  let pathname = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      pathname = new URL(trimmed).pathname;
    } else {
      const q = pathname.indexOf('?');
      const h = pathname.indexOf('#');
      const cut = Math.min(q >= 0 ? q : pathname.length, h >= 0 ? h : pathname.length);
      pathname = pathname.slice(0, cut);
    }
  } catch {
    return undefined;
  }

  const match = /\.([^./]+)$/.exec(pathname);
  if (!match?.[1]) return undefined;
  let ext = match[1];
  try {
    ext = decodeURIComponent(ext);
  } catch {
    // keep raw extension
  }
  return EXT_TO_MIME[ext.toLowerCase()];
}

/**
 * For playback object URLs: if the path implies an audio MIME and the stored
 * blob type is missing or not that MIME, return a same-bytes Blob with the
 * derived type. Does not mutate IndexedDB.
 */
export function blobForPlayableObjectUrl(sourceUrl: string, blob: Blob): Blob {
  const mime = audioMimeFromPath(sourceUrl);
  if (!mime || blob.type === mime) return blob;
  return new Blob([blob], { type: mime });
}
