import {
  E2E76_SHOULD_NOT_BE_WHY_SIGN_IN,
  E2E76_STILL_WHY_SIGN_IN,
} from './ai-e2e76-explain-why-sign-in-steal.fixtures.js';
import {
  CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES,
  isExplainWhySignInPrompt,
  rescueExplainWhySignInIntent,
} from './ai-explain-why-sign-in.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';

describe('e2e-bug.76 explain_why_sign_in must not steal cancel/locale questions', () => {
  const rescue = new AiIntentRescueService();

  it('classifier rules document NOT cancel/reschedule/locale steals', () => {
    const schema = buildCustomerClassifierSchema();
    expect(CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES).toContain(
      'NOT cancel_my_booking|reschedule_my_booking',
    );
    expect(CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES).toContain(
      'NOT get_my_locale|update_my_locale',
    );
    expect(schema).toContain('can I cancel/reschedule my appointment?');
  });

  it.each(E2E76_SHOULD_NOT_BE_WHY_SIGN_IN)(
    '$id: detector rejects explain_why_sign_in',
    ({ prompt }) => {
      expect(isExplainWhySignInPrompt(prompt)).toBe(false);
      expect(rescueExplainWhySignInIntent(prompt, 'unknown')).toBeNull();
    },
  );

  it.each(E2E76_SHOULD_NOT_BE_WHY_SIGN_IN)(
    '$id: AiIntentRescueService reaches $expectedAction',
    ({ prompt, expectedAction }) => {
      const result = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        surface: 'customer',
      });
      expect(result?.action).toBe(expectedAction);
      expect(result?.action).not.toBe('explain_why_sign_in');
    },
  );

  it.each(E2E76_STILL_WHY_SIGN_IN)(
    '$id: genuine sign-in FAQ still matches',
    ({ prompt }) => {
      expect(isExplainWhySignInPrompt(prompt)).toBe(true);
      expect(rescueExplainWhySignInIntent(prompt, 'unknown')?.action).toBe(
        'explain_why_sign_in',
      );
    },
  );
});
