import { describe, expect, it } from 'vitest';
import {
  resolveAssistantModePayload,
  withAssistantModeContext,
} from './assistant-mode.util';

describe('assistant-mode.util (ai-guide-1.0.3)', () => {
  it('returns guide only when guide chip is active', () => {
    expect(resolveAssistantModePayload(true)).toBe('guide');
    expect(resolveAssistantModePayload(false)).toBeUndefined();
  });

  it('merges assistantMode into request context when guide chip is active', () => {
    expect(withAssistantModeContext({ screen: 'checkout' }, true)).toEqual({
      screen: 'checkout',
      assistantMode: 'guide',
    });
    expect(withAssistantModeContext({ screen: 'checkout' }, false)).toEqual({
      screen: 'checkout',
    });
  });
});
