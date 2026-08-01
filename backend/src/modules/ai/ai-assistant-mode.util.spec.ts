import {
  parseAssistantMode,
  resolveAssistantMode,
  resolveAssistantModeFromSession,
} from './ai-assistant-mode.util.js';

describe('ai-assistant-mode.util (ai-guide-1.0.3)', () => {
  it('parses explicit assistantMode values', () => {
    expect(parseAssistantMode('guide')).toBe('guide');
    expect(parseAssistantMode('act')).toBe('act');
    expect(parseAssistantMode('action')).toBeUndefined();
  });

  it('prefers explicit assistantMode over prompt inference', () => {
    expect(
      resolveAssistantMode({
        prompt: 'How many appointments today?',
        surface: 'dashboard',
        explicit: 'guide',
      }),
    ).toBe('guide');
    expect(
      resolveAssistantMode({
        prompt: 'How do I set up a weekly schedule?',
        surface: 'dashboard',
        explicit: 'act',
      }),
    ).toBe('act');
  });

  it('infers guide mode from product-guide prompts when omitted', () => {
    expect(
      resolveAssistantMode({
        prompt: 'What can I do on this page?',
        surface: 'dashboard',
      }),
    ).toBe('guide');
    expect(
      resolveAssistantMode({
        prompt: 'How many appointments today?',
        surface: 'dashboard',
      }),
    ).toBe('act');
    expect(
      resolveAssistantMode({
        prompt: 'How do I book an appointment?',
        surface: 'customer',
      }),
    ).toBe('guide');
    expect(
      resolveAssistantMode({
        prompt: 'How do I mark a booking paid?',
        surface: 'provider',
      }),
    ).toBe('guide');
  });

  it('e2e-bug.233: loyalty/referral prompts stay act when assistantMode omitted', () => {
    expect(
      resolveAssistantMode({
        prompt: 'How do loyalty points work?',
        surface: 'customer',
      }),
    ).toBe('act');
    expect(
      resolveAssistantMode({
        prompt: "What's my loyalty points balance?",
        surface: 'customer',
      }),
    ).toBe('act');
    expect(
      resolveAssistantMode({
        prompt: 'Redeem referral code FRIEND10',
        surface: 'customer',
      }),
    ).toBe('act');
  });

  it('reads assistantMode from session context', () => {
    expect(
      resolveAssistantModeFromSession({
        prompt: 'Cancel all bookings tomorrow',
        surface: 'dashboard',
        sessionContext: { assistantMode: 'guide' },
      }),
    ).toBe('guide');
  });
});
