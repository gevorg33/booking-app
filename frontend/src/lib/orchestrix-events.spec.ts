import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  ORCHESTRIX_OPEN,
  ORCHESTRIX_PROMPT,
  ORCHESTRIX_RUN,
  fireOrchestrixEdit,
  fireOrchestrixOpen,
  fireOrchestrixPrompt,
  fireOrchestrixRun,
} from './orchestrix-events';

describe('orchestrix-events', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
    } as unknown as Window & typeof globalThis);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fires run with autoSubmit and opens the bar', () => {
    fireOrchestrixRun('Book haircut tomorrow', true);
    const calls = (window.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][0].type).toBe(ORCHESTRIX_RUN);
    expect(calls[0][0].detail).toEqual({ prompt: 'Book haircut tomorrow', autoSubmit: true });
    expect(calls[1][0].type).toBe(ORCHESTRIX_OPEN);
  });

  it('fires edit as prompt without autoSubmit flag', () => {
    fireOrchestrixEdit('Fill gaps today');
    const calls = (window.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0].type).toBe(ORCHESTRIX_PROMPT);
    expect(calls[0][0].detail).toEqual({ prompt: 'Fill gaps today' });
    expect(calls[1][0].type).toBe(ORCHESTRIX_OPEN);
  });

  it('fires open and prompt without duplicate open on prompt helper', () => {
    fireOrchestrixOpen();
    fireOrchestrixPrompt('Only prompt');
    const calls = (window.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0].type).toBe(ORCHESTRIX_OPEN);
    expect(calls[1][0].type).toBe(ORCHESTRIX_PROMPT);
    expect(calls[2][0].type).toBe(ORCHESTRIX_OPEN);
  });

  it('defaults autoSubmit to true on run', () => {
    fireOrchestrixRun('Default run');
    const runEvent = (window.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(runEvent.detail.autoSubmit).toBe(true);
  });
});
