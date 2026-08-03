import { describe, expect, it } from 'vitest';
import {
  resolveAssistantModePayload,
  withAssistantModeContext,
} from './assistant-mode.util';

describe('assistant-mode.util (ai-guide-1.0.3 / e2e-bug.233)', () => {
  it('returns guide when Help chip is on, act when off (never omit)', () => {
    expect(resolveAssistantModePayload(true)).toBe('guide');
    expect(resolveAssistantModePayload(false)).toBe('act');
  });

  it('always merges assistantMode into request context', () => {
    expect(withAssistantModeContext({ screen: 'checkout' }, true)).toEqual({
      screen: 'checkout',
      assistantMode: 'guide',
    });
    expect(withAssistantModeContext({ screen: 'checkout' }, false)).toEqual({
      screen: 'checkout',
      assistantMode: 'act',
    });
  });
});
