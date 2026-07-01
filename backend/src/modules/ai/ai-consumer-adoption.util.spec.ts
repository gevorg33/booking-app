import { describe, expect, it } from '@jest/globals';
import { FIND_MY_SAVED_SALONS_PROMPTS } from './ai-find-my-saved-salons.fixtures.js';
import { SWITCH_SALON_TENANT_PROMPTS } from './ai-switch-salon-tenant.fixtures.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('ai-consumer-adoption.util', () => {
  it.each(
    [...FIND_MY_SAVED_SALONS_PROMPTS, ...SWITCH_SALON_TENANT_PROMPTS].map(
      (scenario) => [scenario.id, scenario] as const,
    ),
  )('rescues $0', (_id, scenario) => {
    const rescued = rescueConsumerAdoptionIntent(scenario.prompt, 'unknown');
    expect(rescued?.action).toBe(scenario.expectedAction);
  });

  it('prefers explain over manage for overview questions', () => {
    expect(
      rescueConsumerAdoptionIntent(
        'What notifications will I get after booking?',
        'enable_notifications',
      )?.action,
    ).toBe('explain_my_notifications');
  });

  it('prefers switch over find for named salon', () => {
    expect(
      rescueConsumerAdoptionIntent(
        'Go back to Glow Nails',
        'find_my_saved_salons',
      )?.action,
    ).toBe('switch_salon_tenant');
  });
});
