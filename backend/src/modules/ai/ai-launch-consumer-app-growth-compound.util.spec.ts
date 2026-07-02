import {
  LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS,
  LAUNCH_CONSUMER_APP_GROWTH_RESCUE_SCENARIOS,
} from './ai-launch-consumer-app-growth-compound.fixtures.js';
import { AI_COMMAND_EVAL_LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  buildLaunchConsumerAppGrowthCompoundParams,
  decomposeLaunchConsumerAppGrowthCompoundPrompt,
  isLaunchConsumerAppGrowthCompoundPrompt,
  LAUNCH_CONSUMER_APP_GROWTH_STEP_ACTIONS,
  rescueLaunchConsumerAppGrowthCompoundIntent,
} from './ai-launch-consumer-app-growth-compound.util.js';

describe('ai-launch-consumer-app-growth-compound.util (ai-cmd-ext-4.9)', () => {
  it.each(LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS)(
    'isLaunchConsumerAppGrowthCompoundPrompt $id',
    ({ prompt }) => {
      expect(isLaunchConsumerAppGrowthCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS)(
    'decomposeLaunchConsumerAppGrowthCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeLaunchConsumerAppGrowthCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(
        LAUNCH_CONSUMER_APP_GROWTH_STEP_ACTIONS.length,
      );
      if (expectedParams?.emailOnNewCustomerRegistration === true) {
        expect(steps[2].params.emailOnNewCustomerRegistration).toBe(true);
      }
      if (expectedParams?.marketingTeamEmails) {
        expect(steps[2].params.marketingTeamEmails).toEqual(
          expectedParams.marketingTeamEmails,
        );
      }
    },
  );

  it.each(LAUNCH_CONSUMER_APP_GROWTH_RESCUE_SCENARIOS)(
    'rescueLaunchConsumerAppGrowthCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueLaunchConsumerAppGrowthCompoundIntent(
          prompt,
          misclassifiedAction,
        ),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'launch_consumer_app_growth_compound',
      });
    },
  );

  it('does not treat single explain_tenant_app_install as growth launch compound', () => {
    expect(
      isLaunchConsumerAppGrowthCompoundPrompt(
        'Explain our tenant app install QR',
      ),
    ).toBe(false);
    expect(
      decomposeLaunchConsumerAppGrowthCompoundPrompt(
        'Explain our tenant app install QR',
      ),
    ).toEqual([]);
  });

  it('does not treat explain + regenerate without marketing email as growth launch compound', () => {
    expect(
      isLaunchConsumerAppGrowthCompoundPrompt(
        'Explain tenant app install QR and regenerate growth QR',
      ),
    ).toBe(false);
  });

  it('does not treat customer how-to-download as growth launch compound', () => {
    expect(
      isLaunchConsumerAppGrowthCompoundPrompt(
        'How do I download the consumer app on my phone',
      ),
    ).toBe(false);
  });

  it('buildLaunchConsumerAppGrowthCompoundParams applies defaults', () => {
    const params = buildLaunchConsumerAppGrowthCompoundParams(
      LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS[0].prompt,
    );
    expect(params).toMatchObject({
      emailOnNewCustomerRegistration: true,
    });
  });

  it('eval compound cases pass deterministic runner', () => {
    const failures: string[] = [];
    for (const evalCase of AI_COMMAND_EVAL_LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      if (!result.passed) {
        failures.push(`${evalCase.id}: ${result.errors.join('; ')}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
