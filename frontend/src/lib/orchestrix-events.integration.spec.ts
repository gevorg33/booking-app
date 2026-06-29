import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ORCHESTRIX_OPEN,
  ORCHESTRIX_PROMPT,
  ORCHESTRIX_RUN,
  fireOrchestrixOpen,
  fireOrchestrixPrompt,
  fireOrchestrixRun,
  handleOrchestrixPromptEvent,
  handleOrchestrixRunEvent,
  subscribeOrchestrixEvents,
} from './orchestrix-events';

describe('orchestrix-events integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribeOrchestrixEvents wires prompt, run, and open', () => {
    const onPrompt = vi.fn();
    const onRun = vi.fn();
    const onOpen = vi.fn();
    const unsubscribe = subscribeOrchestrixEvents({ onPrompt, onRun, onOpen });

    fireOrchestrixPrompt('Edit me');
    expect(onPrompt).toHaveBeenCalledWith('Edit me');
    expect(onOpen).toHaveBeenCalled();

    onPrompt.mockClear();
    onOpen.mockClear();
    fireOrchestrixRun('Run now', true);
    expect(onRun).toHaveBeenCalledWith({
      prompt: 'Run now',
      autoSubmit: true,
    });
    expect(onOpen).toHaveBeenCalled();
    expect(onPrompt).not.toHaveBeenCalled();

    onOpen.mockClear();
    fireOrchestrixOpen();
    expect(onOpen).toHaveBeenCalledTimes(1);

    unsubscribe();
    onRun.mockClear();
    window.dispatchEvent(
      new CustomEvent(ORCHESTRIX_RUN, { detail: { prompt: 'After unsub', autoSubmit: true } }),
    );
    expect(onRun).not.toHaveBeenCalled();
  });

  it('run falls back to onPrompt when onRun is omitted', () => {
    const onPrompt = vi.fn();
    const unsubscribe = subscribeOrchestrixEvents({ onPrompt });
    fireOrchestrixRun('Fallback prompt', false);
    expect(onPrompt).toHaveBeenCalledWith('Fallback prompt');
    unsubscribe();
  });

  it('handleOrchestrixRunEvent respects autoSubmit false', () => {
    const onRun = vi.fn();
    handleOrchestrixRunEvent(
      new CustomEvent(ORCHESTRIX_RUN, {
        detail: { prompt: 'Slow', autoSubmit: false },
      }),
      { onRun },
    );
    expect(onRun).toHaveBeenCalledWith({
      prompt: 'Slow',
      autoSubmit: false,
    });
  });

  it('ignores empty prompt and missing handlers', () => {
    const onPrompt = vi.fn();
    handleOrchestrixPromptEvent(new CustomEvent(ORCHESTRIX_PROMPT, { detail: {} }), {
      onPrompt,
    });
    handleOrchestrixRunEvent(new CustomEvent(ORCHESTRIX_RUN, { detail: {} }), { onRun: vi.fn() });
    expect(onPrompt).not.toHaveBeenCalled();
  });
});
