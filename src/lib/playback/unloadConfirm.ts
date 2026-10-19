/** Ask the browser to confirm leaving when playback is active. */
export function confirmUnloadIfPlaying(event: BeforeUnloadEvent, playing: boolean): void {
  if (!playing) return;
  event.preventDefault();
  // Chromium still requires a non-empty returnValue to show the leave dialog.
  event.returnValue = '';
}

/** Subscribe to `beforeunload` while `getPlaying()` is true; returns unsubscribe. */
export function bindUnloadConfirm(getPlaying: () => boolean): () => void {
  function onBeforeUnload(event: BeforeUnloadEvent) {
    confirmUnloadIfPlaying(event, getPlaying());
  }

  window.addEventListener('beforeunload', onBeforeUnload);
  return () => {
    window.removeEventListener('beforeunload', onBeforeUnload);
  };
}
