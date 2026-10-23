import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';

import { useTrackListPlayback } from '@/hooks/useTrackListPlayback';
import { usePlayerStore } from '@/stores/player';

type Api = ReturnType<typeof useTrackListPlayback>;

function Harness({ ids, onReady }: { ids: string[]; onReady: (api: Api) => void }) {
  const api = useTrackListPlayback(ids);
  useEffect(() => {
    onReady(api);
  }, [api, onReady]);
  return null;
}

describe('useTrackListPlayback', () => {
  afterEach(() => {
    usePlayerStore.getState().clearNowPlaying();
  });

  it('wires playAt / playNext / addToQueue to the player store', async () => {
    let api!: Api;

    render(
      <Harness
        ids={['a', 'b', 'c']}
        onReady={(value) => {
          api = value;
        }}
      />,
    );

    await waitFor(() => {
      expect(api).toBeDefined();
    });

    const playFrom = vi.spyOn(usePlayerStore.getState(), 'playFrom').mockImplementation(() => {});
    const playNext = vi.spyOn(usePlayerStore.getState(), 'playNext');
    const addToQueue = vi.spyOn(usePlayerStore.getState(), 'addToQueue');

    api.playAt(1);
    expect(playFrom).toHaveBeenCalledWith(1, ['a', 'b', 'c'], undefined);

    api.playAt(0, { shuffle: true });
    expect(playFrom).toHaveBeenCalledWith(0, ['a', 'b', 'c'], { shuffle: true });

    api.playNextTrack('b');
    expect(playNext).toHaveBeenCalledWith('b');

    api.addTrackToQueue('c');
    expect(addToQueue).toHaveBeenCalledWith('c');

    api.playById('b');
    expect(playFrom).toHaveBeenCalledWith(1, ['a', 'b', 'c']);

    api.playTrackAt(2);
    expect(playFrom).toHaveBeenCalledWith(2, ['a', 'b', 'c']);
  });

  it('inserts a clicked track after the current one when a queue already exists', async () => {
    usePlayerStore.setState({
      queue: ['a', 'c'],
      originalQueue: ['a', 'c'],
      currentId: 'a',
      currentIndex: 0,
      playing: true,
      pendingPlay: true,
    });

    let api!: Api;

    render(
      <Harness
        ids={['a', 'b', 'c']}
        onReady={(value) => {
          api = value;
        }}
      />,
    );

    await waitFor(() => {
      expect(api).toBeDefined();
    });

    api.playById('b');

    expect(usePlayerStore.getState()).toMatchObject({
      queue: ['a', 'b', 'c'],
      originalQueue: ['a', 'b', 'c'],
      currentId: 'a',
      currentIndex: 0,
      playing: true,
      pendingPlay: true,
    });

    usePlayerStore.setState({ playing: false, pendingPlay: false });
    api.playTrackAt(2);

    expect(usePlayerStore.getState()).toMatchObject({
      queue: ['a', 'c', 'b', 'c'],
      originalQueue: ['a', 'c', 'b', 'c'],
      currentId: 'a',
      currentIndex: 0,
      playing: false,
      pendingPlay: false,
    });
  });

  it('playAt still replaces the queue when one already exists', async () => {
    usePlayerStore.setState({
      queue: ['a', 'c'],
      originalQueue: ['a', 'c'],
      currentId: 'a',
      currentIndex: 0,
      playing: true,
    });

    let api!: Api;

    render(
      <Harness
        ids={['a', 'b', 'c']}
        onReady={(value) => {
          api = value;
        }}
      />,
    );

    await waitFor(() => {
      expect(api).toBeDefined();
    });

    const playFrom = vi.spyOn(usePlayerStore.getState(), 'playFrom').mockImplementation(() => {});
    const playNext = vi.spyOn(usePlayerStore.getState(), 'playNext');

    api.playAt(0, { shuffle: false });

    expect(playFrom).toHaveBeenCalledWith(0, ['a', 'b', 'c'], { shuffle: false });
    expect(playNext).not.toHaveBeenCalled();
  });
});
