import { afterEach, describe, expect, it, vi } from 'vitest';

import { bindUnloadConfirm, confirmUnloadIfPlaying } from '@/lib/playback/unloadConfirm';

function makeBeforeUnloadEvent(): BeforeUnloadEvent {
  const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
  Object.defineProperty(event, 'returnValue', {
    writable: true,
    configurable: true,
    value: undefined as unknown as string,
  });
  return event;
}

describe('confirmUnloadIfPlaying', () => {
  it('prompts when music is playing', () => {
    const event = makeBeforeUnloadEvent();
    const preventDefault = vi.spyOn(event, 'preventDefault');

    confirmUnloadIfPlaying(event, true);

    expect(preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe('');
  });

  it('does not prompt when music is not playing', () => {
    const event = makeBeforeUnloadEvent();
    const preventDefault = vi.spyOn(event, 'preventDefault');

    confirmUnloadIfPlaying(event, false);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(event.returnValue).toBeUndefined();
  });
});

describe('bindUnloadConfirm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers beforeunload and cleans up on unsubscribe', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const getPlaying = vi.fn(() => true);

    const unsubscribe = bindUnloadConfirm(getPlaying);

    expect(add).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    const handler = add.mock.calls.find(([type]) => type === 'beforeunload')?.[1];
    expect(typeof handler).toBe('function');

    const event = makeBeforeUnloadEvent();
    const preventDefault = vi.spyOn(event, 'preventDefault');
    (handler as EventListener)(event);
    expect(getPlaying).toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();

    unsubscribe();
    expect(remove).toHaveBeenCalledWith('beforeunload', handler);
  });
});
