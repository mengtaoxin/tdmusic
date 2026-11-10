/** Convert a Blob to bytes for SQLite BLOB columns. */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/** Rebuild a Blob from SQLite bytes, preserving mime when present. */
export function uint8ArrayToBlob(bytes: Uint8Array, mimeType: string | null | undefined): Blob {
  // Copy into a fresh ArrayBuffer-backed view so Blob always gets a plain ArrayBuffer.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], mimeType ? { type: mimeType } : undefined);
}
