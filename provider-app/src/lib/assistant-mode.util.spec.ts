import { describe, expect, it } from 'vitest';
import { resolveAssistantModePayload } from './assistant-mode.util';

describe('assistant-mode.util (ai-guide-1.0.3)', () => {
  it('returns guide only when help chip is active', () => {
    expect(resolveAssistantModePayload(true)).toBe('guide');
    expect(resolveAssistantModePayload(false)).toBeUndefined();
  });
});
