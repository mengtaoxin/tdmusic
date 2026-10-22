export type BackgroundPrefetchPorts = {
  isDocumentHidden: () => boolean;
  abortPrefetchDownloads: () => void;
  prefetch: () => void;
  isPlaying: () => boolean;
  hasCurrentTrack: () => boolean;
};

/** Gate upcoming-track downloads on page visibility. */
export function createBackgroundPrefetch(ports: BackgroundPrefetchPorts) {
  return {
    schedule() {
      if (ports.isDocumentHidden()) {
        ports.abortPrefetchDownloads();
        return;
      }
      ports.prefetch();
    },
    onVisibilityChange() {
      if (ports.isDocumentHidden()) {
        ports.abortPrefetchDownloads();
        return;
      }
      if (ports.isPlaying() && ports.hasCurrentTrack()) ports.prefetch();
    },
  };
}
