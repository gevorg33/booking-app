import type { CommandSurface } from './ai-command-registry.types.js';
import {
  ENRICH_GUIDE_TOPIC_SCENARIOS,
  PRODUCT_GUIDE_RESCUE_SCENARIOS,
} from './ai-product-guide-rescue.fixtures.js';
import {
  enrichGuideTopicFromPrompt,
  matchSimilarAppGuideTopicFromPrompt,
  rescueProductGuideIntent,
} from './ai-product-guide-rescue.util.js';

describe('ai-product-guide-rescue.util (ai-guide-1.6.3)', () => {
  it.each(PRODUCT_GUIDE_RESCUE_SCENARIOS.map((row) => [row.id, row] as const))(
    'rescueProductGuideIntent for $id',
    (_id, scenario) => {
      const result = rescueProductGuideIntent(
        scenario.prompt,
        scenario.fromAction,
        {
          surface: scenario.surface,
        },
      );
      expect(result.action).toBe(scenario.expectedAction);
      if (scenario.expectedReason) {
        expect(result.rescueReason).toBe(scenario.expectedReason);
      }
    },
  );

  it.each(ENRICH_GUIDE_TOPIC_SCENARIOS.map((row) => [row.id, row] as const))(
    'enrichGuideTopicFromPrompt for $id',
    (_id, scenario) => {
      expect(
        enrichGuideTopicFromPrompt(scenario.prompt, {
          surface: scenario.surface,
          route: scenario.route,
          topicId: scenario.topicId,
          activationStep: scenario.activationStep,
        }),
      ).toBe(scenario.expectedTopicId);
    },
  );

  it('matchSimilarAppGuideTopicFromPrompt resolves dashboard schedule variant', () => {
    expect(
      matchSimilarAppGuideTopicFromPrompt(
        'How do I set up weekly schedule templates?',
        'dashboard',
      ),
    ).toBe('dashboard.core.schedule');
  });

  it('rescueProductGuideIntent routes multiturn navigation when guide session is active', () => {
    const result = rescueProductGuideIntent('next step', 'unknown', {
      surface: 'dashboard',
      context: {
        guideFlowId: 'dashboard.core.schedule',
        guideStepIndex: 0,
        completedSteps: [],
      },
    });
    expect(result.action).toBe('guide_user_flow');
    expect(result.rescueReason).toBe('guide_multiturn_navigation');
  });

  it('rescueProductGuideIntent is idempotent for app guide intents', () => {
    for (const intent of [
      'guide_user_flow',
      'explain_app_feature',
      'explain_current_screen',
      'booking_help',
    ] as const) {
      for (const surface of [
        'dashboard',
        'provider',
        'customer',
        'public',
      ] as CommandSurface[]) {
        expect(
          rescueProductGuideIntent('How do I use this feature?', intent, {
            surface,
          }).action,
        ).toBe(intent);
      }
    }
  });

  it('e2e-bug.195 — customer surface rescues booking funnel over Home tour', () => {
    const rescued = rescueProductGuideIntent(
      'How do I book an appointment step by step?',
      'explain_app_feature',
      { surface: 'customer' },
    );
    expect(rescued).toEqual({
      action: 'booking_help',
      rescueReason: 'public_booking_help',
    });
    expect(
      rescueProductGuideIntent('How do I use the Home tab?', 'explain_app_feature', {
        surface: 'customer',
      }).action,
    ).toBe('explain_app_feature');
  });
});
