/** Rendered-row index for the playing queue slot (skips missing catalog ids). */
export function playingQueueRowIndex(
  rows: readonly { queueIndex: number }[],
  currentIndex: number,
): number | null {
  if (currentIndex < 0) return null;
  const rowIndex = rows.findIndex((row) => row.queueIndex === currentIndex);
  return rowIndex < 0 ? null : rowIndex;
}
