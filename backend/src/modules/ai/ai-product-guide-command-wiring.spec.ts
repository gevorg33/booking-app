import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  APP_GUIDE_INTENTS,
  isProductGuideDashboardIntent,
  resolveProductGuideSessionContext,
} from './ai-product-guide.util.js';
import { PRODUCT_GUIDE_CLASSIFIER_SCENARIOS } from './ai-product-guide.fixtures.js';
import {
  DASHBOARD_CLASSIFIER_ACTION_UNION,
  DASHBOARD_INTENT_SCHEMA,
} from './ai-command-intent-schema.build.js';
import { APP_GUIDE_CLASSIFIER_RULES } from './ai-product-guide.fixtures.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

describe('ai-product-guide command wiring (ai-guide-1.2.6)', () => {
  it('includes guide intents in dashboard classifier action union', () => {
    for (const intent of APP_GUIDE_INTENTS) {
      expect(DASHBOARD_CLASSIFIER_ACTION_UNION).toContain(`"${intent}"`);
    }
  });

  it('wires APP_GUIDE_CLASSIFIER_RULES into INTENT_SCHEMA appendix', () => {
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      APP_GUIDE_CLASSIFIER_RULES.trim(),
    );
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      'explain_app_feature: READ — explain what a dashboard feature',
    );
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      'guide_user_flow: READ — numbered walkthrough',
    );
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      'explain_current_screen: READ — explain capabilities',
    );
  });

  it('documents guide intents in DASHBOARD_INTENT_SCHEMA appendix', () => {
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      'explain_app_feature: READ — explain what a dashboard feature',
    );
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      'guide_user_flow: READ — numbered walkthrough',
    );
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      'explain_current_screen: READ — explain capabilities',
    );
  });

  it('declares optional topicId classifier param', () => {
    expect(DASHBOARD_INTENT_SCHEMA).toContain('"topicId"');
  });

  it('routes dashboard guide intents through AiProductGuideService dispatch', () => {
    for (const intent of APP_GUIDE_INTENTS) {
      expect(resolveHandlerForSurface(intent, 'dashboard')).toBe(
        'AiProductGuideService',
      );
      expect(AI_COMMAND_SERVICE_SOURCE).toContain(`case '${intent}':`);
    }
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('dispatchProductGuideIntent');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('rescueProductGuideIntent');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('enrichGuideTopicFromPrompt');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'resolveProductGuideSessionContext',
    );
  });

  it('dispatches guide handoffs directly without classifier hop (ai-guide-1.2.5)', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'readGuideHandoffDispatch(session)',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('validateGuideHandoffDispatch');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('isGuideHandoffMutatingAction');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('directGuideHandoff: true');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain("stage: 'guide_handoff'");
  });

  it('covers classifier scenarios for guide vs mutate disambiguation', () => {
    expect(PRODUCT_GUIDE_CLASSIFIER_SCENARIOS.length).toBeGreaterThanOrEqual(
      10,
    );
    for (const intent of APP_GUIDE_INTENTS) {
      expect(
        PRODUCT_GUIDE_CLASSIFIER_SCENARIOS.some(
          (row) => row.expectedAction === intent,
        ),
      ).toBe(true);
    }
  });

  it('exports product guide intent guard helper', () => {
    expect(isProductGuideDashboardIntent('guide_user_flow')).toBe(true);
    expect(isProductGuideDashboardIntent('cancel_bookings')).toBe(false);
    expect(
      resolveProductGuideSessionContext({
        context: {
          route: '/dashboard/schedule',
          locale: 'hy',
          vertical: 'clinic',
        },
      }),
    ).toEqual({
      route: '/dashboard/schedule',
      locale: 'hy',
      vertical: 'clinic',
      businessType: undefined,
      role: undefined,
      roleProfile: undefined,
      retailPosEnabled: undefined,
      enabledModules: undefined,
      planTierId: 'solo',
      mobileRoute: undefined,
      screenTab: undefined,
      surface: 'dashboard',
    });
  });
});
