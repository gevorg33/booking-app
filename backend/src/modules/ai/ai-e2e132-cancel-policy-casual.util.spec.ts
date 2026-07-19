import {
  E2E132_CANCEL_POLICY_CASUAL_SCENARIOS,
  E2E132_PACKAGE_SAVINGS_STILL_MATCH,
} from './ai-e2e132-cancel-policy-casual.fixtures.js';
import {
  isExplainCancelPolicyPrompt,
  rescueExplainCancelPolicyIntent,
} from './ai-explain-cancel-policy.util.js';
import { isExplainPackageSavingsPrompt } from './ai-explain-package-savings.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.132 casual cancel policy vs package savings', () => {
  const rescue = new AiIntentRescueService();

  it.each(E2E132_CANCEL_POLICY_CASUAL_SCENARIOS.map((s) => [s.id, s]))(
    'detects cancel policy and rejects package savings for %s',
    (_id, row) => {
      expect(isExplainCancelPolicyPrompt(row.prompt)).toBe(true);
      expect(isExplainPackageSavingsPrompt(row.prompt)).toBe(false);
      expect(
        rescueExplainCancelPolicyIntent(row.prompt, row.misclassifiedAction)
          ?.action,
      ).toBe('explain_cancel_policy');
    },
  );

  it.each(E2E132_CANCEL_POLICY_CASUAL_SCENARIOS.map((s) => [s.id, s]))(
    'self-service and AiIntentRescueService rescue %s',
    (_id, row) => {
      expect(
        rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
          ?.action,
      ).toBe('explain_cancel_policy');
      for (const fromAction of [
        row.misclassifiedAction,
        'explain_package_savings',
        'unknown',
      ] as const) {
        const result = rescue.rescue({
          prompt: row.prompt,
          action: fromAction,
          params: {},
          surface: row.surface,
        });
        expect(result?.action).toBe(row.expectedAction);
        expect(result?.action).not.toBe('explain_package_savings');
      }
    },
  );

  it.each(E2E132_PACKAGE_SAVINGS_STILL_MATCH.map((s) => [s.id, s.prompt]))(
    'package savings still matches real package deal phrasing %s',
    (_id, prompt) => {
      expect(isExplainPackageSavingsPrompt(prompt)).toBe(true);
      expect(isExplainCancelPolicyPrompt(prompt)).toBe(false);
    },
  );
});
