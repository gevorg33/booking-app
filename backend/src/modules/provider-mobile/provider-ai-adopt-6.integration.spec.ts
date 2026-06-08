import {
  PROVIDER_ADOPT_6_CLASSIFIER_RULES,
  PROVIDER_ADOPT_6_GROWTH_INTENTS,
  PROVIDER_ADOPT_6_PROMPT_SCENARIOS,
} from '../ai/ai-adopt-6-growth-loops.fixtures.js';
import {
  handleEnablePushNotificationsLogic,
  handleExplainPushSetupLogic,
} from '../ai/ai-adopt-6-growth-loops.logic.js';
import {
  rescueProviderAdopt6GrowthIntent,
} from '../ai/ai-adopt-6-growth-loops.util.js';
import { PROVIDER_INTENTS } from '../ai/ai-command-registry.build.js';

describe('ai-adopt-6-growth-loops provider integration (adopt-6.7)', () => {
  it('registers provider adopt-6 intents on the provider surface', () => {
    for (const intent of PROVIDER_ADOPT_6_GROWTH_INTENTS) {
      expect(PROVIDER_INTENTS).toContain(intent);
    }
  });

  it('includes provider classifier rules in PROVIDER_ADOPT_6_CLASSIFIER_RULES', () => {
    expect(PROVIDER_ADOPT_6_CLASSIFIER_RULES).toContain('explain_push_setup');
    expect(PROVIDER_ADOPT_6_CLASSIFIER_RULES).toContain('enable_push_notifications');
  });

  it.each(PROVIDER_ADOPT_6_PROMPT_SCENARIOS)(
    '$id rescues to $action on provider surface',
    ({ prompt, action }) => {
      const rescued = rescueProviderAdopt6GrowthIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(action);
    },
  );

  it('does not steal explain_last_push phrasing', () => {
    expect(
      rescueProviderAdopt6GrowthIntent('Explain last push', 'unknown')?.action,
    ).not.toBe('explain_push_setup');
  });

  it('returns push setup guidance for providers', () => {
    const result = handleExplainPushSetupLogic();
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_push_setup');
    expect(result.details?.steps).toEqual(expect.any(Array));
  });

  it('returns enable push navigation hint for providers', () => {
    const result = handleEnablePushNotificationsLogic();
    expect(result.success).toBe(true);
    expect(result.action).toBe('enable_push_notifications');
    expect(result.details?.navigationHint).toBe('settings/notifications');
  });
});
