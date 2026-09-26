export type PlayFromSessionHooks = {
  onReset: () => void;
  onHead: (headId: string, startIndex: number) => void;
  onChunk: (chunk: string[]) => void;
  onDone?: () => void;
};

export type QueueChunkCallback = (chunk: string[]) => void;

/** Play sourceIds[startIndex] immediately; fill the full list from 0 (prefix sync, rest chunked). */
export function buildQueueFrom(
  sourceIds: string[],
  startIndex: number,
  options: {
    chunkSize?: number;
    schedule?: (cb: () => void) => void;
    onHead: (headId: string) => void;
    onChunk: QueueChunkCallback;
    onDone?: () => void;
  },
): { cancel: () => void } {
  const chunkSize = options.chunkSize ?? 50;
  const schedule = options.schedule ?? ((cb) => setTimeout(cb, 0));
  let cancelled = false;

  if (startIndex < 0 || startIndex >= sourceIds.length) {
    options.onDone?.();
    return { cancel: () => {} };
  }

  const head = sourceIds[startIndex]!;
  options.onHead(head);

  // Deliver prefix through the play head synchronously so Previous works immediately.
  const prefix = sourceIds.slice(0, startIndex + 1);
  if (prefix.length) options.onChunk(prefix);

  let offset = startIndex + 1;

  const pump = () => {
    if (cancelled) return;
    if (offset >= sourceIds.length) {
      options.onDone?.();
      return;
    }
    const chunk = sourceIds.slice(offset, offset + chunkSize);
    offset += chunk.length;
    options.onChunk(chunk);
    schedule(pump);
  };

  schedule(pump);

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}

/** Owns the in-flight `buildQueueFrom` job for one player instance. */
export function createPlayFromSession() {
  let cancelFill: (() => void) | null = null;

  function cancel() {
    cancelFill?.();
    cancelFill = null;
  }

  function start(startIndex: number, sourceIds: string[], hooks: PlayFromSessionHooks) {
    cancel();
    if (startIndex < 0 || startIndex >= sourceIds.length) return;

    hooks.onReset();
    const job = buildQueueFrom(sourceIds, startIndex, {
      onHead: (headId) => {
        hooks.onHead(headId, startIndex);
      },
      onChunk: hooks.onChunk,
      onDone: () => {
        cancelFill = null;
        hooks.onDone?.();
      },
    });
    cancelFill = job.cancel;
  }

  return { start, cancel };
}
