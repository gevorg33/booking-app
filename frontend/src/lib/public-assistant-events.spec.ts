import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PUBLIC_ASSISTANT_OPEN,
  PUBLIC_ASSISTANT_RUN,
  firePublicAssistantRun,
  subscribePublicAssistantEvents,
} from './public-assistant-events';

describe('public-assistant-events (ai-cmd-customer-4.9.2)', () => {
  beforeEach(() => {
    const listeners = new Map<string, Set<(event: Event) => void>>();
    vi.stubGlobal('window', {
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((handler) => handler(event));
        return true;
      },
      addEventListener: (type: string, handler: (event: Event) => void) => {
        const set = listeners.get(type) ?? new Set();
        set.add(handler);
        listeners.set(type, set);
      },
      removeEventListener: (type: string, handler: (event: Event) => void) => {
        listeners.get(type)?.delete(handler);
      },
    } as unknown as Window & typeof globalThis);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('firePublicAssistantRun dispatches run + open events', () => {
    const onRun = vi.fn();
    const onOpen = vi.fn();
    const unsubscribe = subscribePublicAssistantEvents({ onRun, onOpen });

    firePublicAssistantRun('How much do I pay today?');

    expect(onRun).toHaveBeenCalledWith({
      prompt: 'How much do I pay today?',
      autoSubmit: true,
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('subscribePublicAssistantEvents unsubscribes cleanly', () => {
    const onOpen = vi.fn();
    const unsubscribe = subscribePublicAssistantEvents({ onOpen });
    unsubscribe();

    window.dispatchEvent(new CustomEvent(PUBLIC_ASSISTANT_OPEN));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('run event defaults autoSubmit to true', () => {
    const onRun = vi.fn();
    const unsubscribe = subscribePublicAssistantEvents({ onRun });

    window.dispatchEvent(
      new CustomEvent(PUBLIC_ASSISTANT_RUN, {
        detail: { prompt: 'Pay cash at visit' },
      }),
    );

    expect(onRun).toHaveBeenCalledWith({
      prompt: 'Pay cash at visit',
      autoSubmit: true,
    });
    unsubscribe();
  });
});
