import { describe, expect, it } from '@jest/globals';
import { PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS } from './ai-provider-push-setup.fixtures.js';
import {
  isEnablePushNotificationsPrompt,
  isExplainPushSetupPrompt,
  rescueProviderPushSetupIntent,
} from './ai-provider-push-setup.util.js';

describe('ai-provider-push-setup.util', () => {
  it.each(PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'rescues $0',
    (_id, scenario) => {
      const rescued = rescueProviderPushSetupIntent(scenario.prompt, 'unknown');
      expect(rescued?.action).toBe(scenario.expectedAction);
    },
  );

  it('prefers enable over explain for mutate phrasing', () => {
    expect(
      rescueProviderPushSetupIntent(
        'Enable push notifications for new bookings',
        'explain_last_push',
      )?.action,
    ).toBe('enable_push_notifications');
  });

  it('does not rescue configure push date format prompts', () => {
    expect(
      isExplainPushSetupPrompt(
        'Enable 24-hour times in provider push notifications',
      ),
    ).toBe(false);
    expect(
      isEnablePushNotificationsPrompt(
        'Configure push notifications to use our business time format',
      ),
    ).toBe(false);
  });
});
