export type BackgroundPrefetchPorts = {
  prefetch: () => void;
  isPlaying: () => boolean;
  hasCurrentTrack: () => boolean;
};

/** Upcoming-track downloads. Page visibility does not start or stop them. */
export function createBackgroundPrefetch(ports: BackgroundPrefetchPorts) {
  return {
    schedule() {
      ports.prefetch();
    },
    onVisibilityChange() {
      if (ports.isPlaying() && ports.hasCurrentTrack()) ports.prefetch();
    },
  };
}
