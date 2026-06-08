import { describe, expect, it } from '@jest/globals';
import {
  CONSUMER_ADOPTION_PROMPT_SCENARIOS,
  rescueConsumerAdoptionIntent,
} from './ai-consumer-adoption.util.js';

describe('ai-consumer-adoption.util', () => {
  it.each(CONSUMER_ADOPTION_PROMPT_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'rescues $0',
    (_id, scenario) => {
      const rescued = rescueConsumerAdoptionIntent(scenario.prompt, 'unknown');
      expect(rescued?.action).toBe(scenario.expectedAction);
    },
  );

  it('prefers explain over manage for overview questions', () => {
    expect(
      rescueConsumerAdoptionIntent(
        'What notifications will I get after booking?',
        'enable_notifications',
      )?.action,
    ).toBe('explain_my_notifications');
  });
});
