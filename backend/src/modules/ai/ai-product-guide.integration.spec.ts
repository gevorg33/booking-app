import { isIntentAllowed } from './ai-capability.matrix.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { PRODUCT_GUIDE_MISROUTE_SCENARIOS } from './ai-product-guide.fixtures.js';
import { AiProductGuideService } from './ai-product-guide.service.js';
import { createMockGuideTelemetryService } from './guide/guide-telemetry.mock.js';
import { APP_GUIDE_INTENTS } from './ai-product-guide.util.js';
import {
  COMMAND_REGISTRY_BY_ID,
  REGISTRY_VALIDATION_ERRORS,
} from './ai-command-registry.js';

describe('ai-product-guide integration (ai-guide-1.0.5)', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    PRODUCT_GUIDE_MISROUTE_SCENARIOS.filter(
      (scenario) => scenario.expectedAction !== null,
    ),
  )(
    'AiIntentRescueService rescues bulk misroute for $id',
    ({ prompt, classifiedAction, surface, expectedAction, expectedReason }) => {
      const result = rescue.rescue({
        prompt,
        action: classifiedAction,
        params: {},
        surface,
      });
      expect(result?.rescued).toBe(true);
      expect(result?.action).toBe(expectedAction);
      expect(result?.rescueReason).toBe(expectedReason);
    },
  );

  it.each(
    PRODUCT_GUIDE_MISROUTE_SCENARIOS.filter(
      (scenario) => scenario.expectedAction === null,
    ),
  )(
    'AiIntentRescueService keeps imperative bulk mutate for $id',
    ({ prompt, classifiedAction, surface }) => {
      const result = rescue.rescue({
        prompt,
        action: classifiedAction,
        params: {},
        surface,
      });
      expect(result?.action).not.toBe('guide_user_flow');
      expect(result?.action).not.toBe('explain_app_feature');
      expect(result?.action).not.toBe('explain_current_screen');
    },
  );
});

describe('ai-product-guide integration (ai-guide-1.2.1–1.2.3)', () => {
  const llm = {
    isAvailableForBusiness: jest.fn(async () => false),
    completeJson: jest.fn(async () => null),
  };
  const openAi = {
    isAvailableForBusiness: jest.fn(async () => false),
    embedText: jest.fn(async () => null),
  };
  const guide = new AiProductGuideService(
    llm as any,
    openAi as any,
    createMockGuideTelemetryService(),
  );

  it('registers app guide intents on AiProductGuideService (dashboard + customer + public + provider)', () => {
    expect(REGISTRY_VALIDATION_ERRORS).toEqual([]);
    for (const intent of APP_GUIDE_INTENTS) {
      const entry = COMMAND_REGISTRY_BY_ID.get(intent);
      expect(entry?.surfaces).toEqual([
        'dashboard',
        'customer',
        'public',
        'provider',
      ]);
      expect(entry?.handler).toBe('AiProductGuideService');
      expect(entry?.mutating).toBe(false);
      // e2e-bug.355 — `entry.tiers` was the dead flat permission model and has
      // been deleted. The live answer is per-surface and comes from
      // `CommandSpec.tiers` via `isIntentAllowed`, so assert that instead of a
      // field that could never express "staff on dashboard, client on customer".
      expect(isIntentAllowed('dashboard', 'staff', intent)).toBe(true);
      expect(isIntentAllowed('dashboard', 'owner', intent)).toBe(true);
      expect(isIntentAllowed('customer', 'client', intent)).toBe(true);
    }
  });

  it('returns GuideResponse for schedule walkthrough prompts', async () => {
    const result = await guide.handleGuideUserFlowAsync(
      'biz-1',
      {},
      'How do I set up weekly schedule templates?',
      { route: '/dashboard/schedule', locale: 'en' },
    );
    expect(result.success).toBe(true);
    expect(result.guide?.steps.length).toBeGreaterThan(0);
  });
});
