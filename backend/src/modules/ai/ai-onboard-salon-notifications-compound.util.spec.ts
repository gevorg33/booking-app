import {
  ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS,
  ONBOARD_SALON_NOTIFICATIONS_RESCUE_SCENARIOS,
} from './ai-onboard-salon-notifications-compound.fixtures.js';
import {
  AI_COMMAND_EVAL_ONBOARD_SALON_NOTIFICATIONS_COMPOUND_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  buildOnboardSalonNotificationsCompoundParams,
  decomposeOnboardSalonNotificationsCompoundPrompt,
  isOnboardSalonNotificationsCompoundPrompt,
  ONBOARD_SALON_NOTIFICATIONS_STEP_ACTIONS,
  rescueOnboardSalonNotificationsCompoundIntent,
} from './ai-onboard-salon-notifications-compound.util.js';

describe('ai-onboard-salon-notifications-compound.util (ai-cmd-ext-4.8)', () => {
  it.each(ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS)(
    'isOnboardSalonNotificationsCompoundPrompt $id',
    ({ prompt }) => {
      expect(isOnboardSalonNotificationsCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS)(
    'decomposeOnboardSalonNotificationsCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeOnboardSalonNotificationsCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(ONBOARD_SALON_NOTIFICATIONS_STEP_ACTIONS.length);
      if (expectedParams?.emailEnabled === true) {
        expect(steps[0].params.emailEnabled).toBe(true);
      }
      if (expectedParams?.whatsappEnabled === true) {
        expect(steps[0].params.whatsappEnabled).toBe(true);
      }
      if (expectedParams?.reminder24hEmail === true) {
        expect(steps[0].params.reminder24hEmail).toBe(true);
      }
      if (expectedParams?.reminder24hWhatsapp === true) {
        expect(steps[0].params.reminder24hWhatsapp).toBe(true);
      }
      if (expectedParams?.usePlatformDefault === true) {
        expect(steps[1].params.usePlatformDefault).toBe(true);
      }
    },
  );

  it.each(ONBOARD_SALON_NOTIFICATIONS_RESCUE_SCENARIOS)(
    'rescueOnboardSalonNotificationsCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueOnboardSalonNotificationsCompoundIntent(
          prompt,
          misclassifiedAction!,
        ),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'onboard_salon_notifications_compound',
      });
    },
  );

  it('does not treat single configure_notification_settings as onboarding compound', () => {
    expect(
      isOnboardSalonNotificationsCompoundPrompt(
        'Turn on email notifications for the salon',
      ),
    ).toBe(false);
    expect(
      decomposeOnboardSalonNotificationsCompoundPrompt(
        'Turn on email notifications for the salon',
      ),
    ).toEqual([]);
  });

  it('does not treat configure_push_recipients as onboarding compound', () => {
    expect(
      isOnboardSalonNotificationsCompoundPrompt(
        'Configure push recipients for provider mobile notifications',
      ),
    ).toBe(false);
  });

  it('does not treat notification settings + test push without WhatsApp as onboarding compound', () => {
    expect(
      isOnboardSalonNotificationsCompoundPrompt(
        'Configure notification settings with email on and send test push',
      ),
    ).toBe(false);
  });

  it('buildOnboardSalonNotificationsCompoundParams applies defaults', () => {
    const params = buildOnboardSalonNotificationsCompoundParams(
      ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS[0].prompt,
    );
    expect(params).toMatchObject({
      emailEnabled: true,
      whatsappEnabled: true,
      reminder24hEmail: true,
      reminder24hWhatsapp: true,
      usePlatformDefault: true,
    });
  });

  it('eval compound cases pass deterministic runner', () => {
    const failures: string[] = [];
    for (const evalCase of AI_COMMAND_EVAL_ONBOARD_SALON_NOTIFICATIONS_COMPOUND_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      if (!result.passed) {
        failures.push(`${evalCase.id}: ${result.errors.join('; ')}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
