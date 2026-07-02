import { GUIDE_PLAN_GATE_SCENARIOS } from './ai-product-guide-plan-gate.fixtures.js';
import {
  GUIDE_PLAN_GATE_PIPE_MARKER,
  buildGuideFlowListContextFromInput,
  buildPlanGatedGuideCommandResult,
  describeGuidePlaybookGate,
  findGuideFlowPlaybookByTopicId,
  tryResolvePlanGatedGuideResult,
} from './ai-product-guide-plan-gate.util.js';
import { handleProductGuideIntentLogic } from './ai-product-guide.logic.js';
import type { ProductGuideLogicInput } from './ai-product-guide.logic.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';

function buildPlanGateInput(
  scenario: (typeof GUIDE_PLAN_GATE_SCENARIOS)[number],
): ProductGuideLogicInput {
  const surface = scenario.route.startsWith('/dashboard')
    ? 'dashboard'
    : scenario.route.startsWith('/tabs')
      ? 'provider'
      : 'customer';
  return {
    businessId: 'biz-plan-gate',
    prompt: `How do I use ${scenario.topicId}?`,
    route: scenario.route,
    surface,
    roleProfile: surface === 'dashboard' ? 'owner' : 'provider',
    params: { topicId: scenario.topicId },
    session: {
      context: {
        _planTierId: scenario.planTierId,
        ...(scenario.enabledModules
          ? { enabledModules: scenario.enabledModules }
          : {}),
      },
    },
  };
}

describe('ai-product-guide-plan-gate.util (ai-guide-1.8.4)', () => {
  it.each(GUIDE_PLAN_GATE_SCENARIOS.map((row) => [row.id, row] as const))(
    'describeGuidePlaybookGate for $id',
    (_id, scenario) => {
      const playbook = findGuideFlowPlaybookByTopicId(scenario.topicId);
      expect(playbook).toBeDefined();

      const input = buildPlanGateInput(scenario);
      const ctx = buildGuideFlowListContextFromInput(input);
      const gate = describeGuidePlaybookGate(
        playbook!,
        ctx,
        'en',
        getFrontendGuideCorpusMessages('en'),
      );

      if (scenario.expectGated) {
        expect(gate.allowed).toBe(false);
        if (scenario.requiredPlan) {
          expect(gate.requiredPlan).toBe(scenario.requiredPlan);
        }
        expect(gate.summary).toMatch(/not available on your/i);
      } else {
        expect(gate.allowed).toBe(true);
      }
    },
  );

  it.each(
    GUIDE_PLAN_GATE_SCENARIOS.filter((row) => row.expectGated).map(
      (row) => [row.id, row] as const,
    ),
  )(
    'tryResolvePlanGatedGuideResult returns upgrade guide for $id',
    (_id, scenario) => {
      const result = tryResolvePlanGatedGuideResult(
        'guide_user_flow',
        buildPlanGateInput(scenario),
        'en',
      );
      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);
      expect(result!.guide?.summary).toMatch(/not available on your/i);
      expect(result!.guide?.steps?.[0]?.navigate?.path).toBe(
        '/dashboard/billing',
      );
      expect(result!.details?.guidePlanGated).toBe(true);
      expect(result!.details?.pipeMarker).toBe(GUIDE_PLAN_GATE_PIPE_MARKER);
    },
  );

  it.each(
    GUIDE_PLAN_GATE_SCENARIOS.filter((row) => !row.expectGated).map(
      (row) => [row.id, row] as const,
    ),
  )(
    'tryResolvePlanGatedGuideResult passes through allowed plan for $id',
    (_id, scenario) => {
      expect(
        tryResolvePlanGatedGuideResult(
          'guide_user_flow',
          buildPlanGateInput(scenario),
          'en',
        ),
      ).toBeNull();
    },
  );

  it('buildPlanGatedGuideCommandResult includes upgrade and preview steps', () => {
    const scenario = GUIDE_PLAN_GATE_SCENARIOS.find(
      (row) => row.id === 'ai-ops-solo-blocked',
    )!;
    const playbook = findGuideFlowPlaybookByTopicId(scenario.topicId)!;
    const input = buildPlanGateInput(scenario);
    const ctx = buildGuideFlowListContextFromInput(input);
    const gate = describeGuidePlaybookGate(
      playbook,
      ctx,
      'en',
      getFrontendGuideCorpusMessages('en'),
    );
    const result = buildPlanGatedGuideCommandResult(
      'guide_user_flow',
      playbook,
      gate,
      input,
      'en',
    );
    expect(result.guide?.steps).toHaveLength(2);
    expect(result.guide?.steps?.[0]?.title).toBe('Upgrade your plan');
    expect(result.details?.upgradePlanId).toBe('starter');
  });

  it('handleProductGuideIntentLogic returns plan gate before keyword match', () => {
    const scenario = GUIDE_PLAN_GATE_SCENARIOS.find(
      (row) => row.id === 'gift-cards-solo-blocked',
    )!;
    const result = handleProductGuideIntentLogic(
      'guide_user_flow',
      buildPlanGateInput(scenario),
    );
    expect(result.success).toBe(true);
    expect(result.details?.retrievalPath).toBe('guide-plan-gate');
    expect(result.guide?.summary).toMatch(/not available on your/i);
  });
});
