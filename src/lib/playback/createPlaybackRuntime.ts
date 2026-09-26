import {
  createPlaybackTransport,
  type PlaybackTransportDeps,
} from '@/lib/playback/playbackTransport';
import type { PlaybackAudioElement } from '@/lib/playback/playbackSession';

export type PlaybackRuntimePorts = Omit<PlaybackTransportDeps, 'getAudio'>;

/**
 * Framework-agnostic playback composition: bind player/catalog/cache ports to one
 * transport. The React host only supplies the `<audio>` element.
 */
export function createPlaybackRuntime(
  getAudio: () => PlaybackAudioElement | null,
  ports: PlaybackRuntimePorts,
) {
  return createPlaybackTransport({ getAudio, ...ports });
}
