import {
  CUSTOMER_ADOPT_6_PROMPT_SCENARIOS,
  PROVIDER_ADOPT_6_PROMPT_SCENARIOS,
  buildReferralShareUrl,
  deriveReferralCodeFromCustomerId,
  isExplainMyNotificationsPrompt,
  isReferAFriendPrompt,
  isRebookLastAppointmentPrompt,
  rescueAdopt6GrowthIntent,
  rescueCustomerAdopt6GrowthIntent,
  rescueProviderAdopt6GrowthIntent,
} from './ai-adopt-6-growth-loops.util.js';

describe('ai-adopt-6-growth-loops.util', () => {
  it.each(PROVIDER_ADOPT_6_PROMPT_SCENARIOS)('$id rescues $action', ({ prompt, action }) => {
    const rescued = rescueProviderAdopt6GrowthIntent(prompt, 'unknown');
    expect(rescued?.action).toBe(action);
  });

  it.each(CUSTOMER_ADOPT_6_PROMPT_SCENARIOS)('$id rescues $action', ({ prompt, action }) => {
    const rescued = rescueCustomerAdopt6GrowthIntent(prompt, 'unknown');
    expect(rescued?.action).toBe(action);
  });

  it('detects notification explain vs manage prompts', () => {
    expect(isExplainMyNotificationsPrompt('What notifications do I get?')).toBe(true);
    expect(isReferAFriendPrompt('Refer a friend for a reward')).toBe(true);
    expect(isReferAFriendPrompt('How do I get referral rewards?')).toBe(true);
    expect(isRebookLastAppointmentPrompt('Book my last appointment again')).toBe(true);
  });

  it('builds referral share url', () => {
    const url = buildReferralShareUrl('https://app.test', 'demo-salon', 'ABC12345');
    expect(url).toContain('ref=ABC12345');
    expect(deriveReferralCodeFromCustomerId('abc12345-0000')).toBe('ABC12345');
  });

  it('does not steal provider push date-format configure prompts', () => {
    const prompt = 'Enable 24-hour times in provider push notifications';
    expect(rescueProviderAdopt6GrowthIntent(prompt, 'unknown')).toBeNull();
  });
});
