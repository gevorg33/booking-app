import {
  SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES,
  RANK_SESSION_SCENARIOS,
  SERVICE_RANK_EXTRACTION_SCENARIOS,
  SERVICE_RANK_RECOMMEND_SPECIALISTS_RESCUE_SCENARIOS,
} from './ai-service-rank-discovery.fixtures.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';
import {
  enrichServiceRankFromPrompt,
  rescueServiceRankFromRecommendSpecialistsIntent,
} from './ai-service-rank-discovery.util.js';
import {
  enrichBudgetFromPrompt,
  rescueBudgetServiceDiscoveryIntent,
} from './ai-budget-service-discovery.util.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-assistant.service.js';

describe('ai service rank discovery classifier wiring (rank-1.2)', () => {
  it('includes serviceRank rules and param in public and customer schemas', () => {
    const publicSchema = buildPublicClassifierSchema();
    const customerSchema = buildCustomerClassifierSchema();
    const sampleRule = SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES.slice(0, 80);

    expect(publicSchema).toContain('"serviceRank"');
    expect(customerSchema).toContain('"serviceRank"');
    expect(publicSchema).toContain('highest_price');
    expect(publicSchema).toContain('lowest_price');
    expect(publicSchema).toContain('most_popular');
    expect(customerSchema).toContain('highest_price');
    expect(customerSchema).toContain('lowest_price');
    expect(customerSchema).toContain('most_popular');
    expect(publicSchema).toContain(sampleRule);
    expect(customerSchema).toContain(sampleRule);
    expect(publicSchema).toContain(
      'What is the best and premium haircut service?',
    );
    expect(customerSchema).toContain(
      "What's the cheapest haircut you offer?",
    );
    expect(publicSchema).toContain(
      'recommend_specialists, serviceCategory=massage — NO serviceRank',
    );
  });

  it('documents service vs specialist disambiguation in rank rules', () => {
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      'recommend_specialists',
    );
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      'serviceRank=highest_price',
    );
    expect(SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES).toContain(
      'serviceRank=lowest_price',
    );
  });
});

describe('ai service rank discovery post-LLM rescue (rank-1.3)', () => {
  it.each(SERVICE_RANK_EXTRACTION_SCENARIOS.filter((scenario) => scenario.serviceRank))(
    'enrichServiceRankFromPrompt sets serviceRank for $id',
    ({ prompt, serviceRank }) => {
      expect(enrichServiceRankFromPrompt({}, prompt).serviceRank).toBe(
        serviceRank,
      );
    },
  );

  it('enrichPublicAssistantParamsFromPrompt enriches premium rank on list_services', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      "What's your luxury massage option?",
      { serviceCategory: 'massage' },
      [{ id: 'm1', name: 'Swedish massage' }],
      'list_services',
    );
    expect(enriched.serviceRank).toBe('highest_price');
  });

  it('customer enrichServiceRankFromPrompt strips rank for specialist prompts', () => {
    expect(
      enrichServiceRankFromPrompt(
        { serviceRank: 'highest_price' },
        'Who is the best rated lash specialist this week?',
      ).serviceRank,
    ).toBeUndefined();
  });
});

describe('ai service rank recommend_specialists guard (rank-1.5)', () => {
  it.each(SERVICE_RANK_RECOMMEND_SPECIALISTS_RESCUE_SCENARIOS)(
    'rescue pipeline $id',
    ({ prompt, fromAction, expectedAction, rescueReason }) => {
      const budgetRescue = rescueBudgetServiceDiscoveryIntent(
        prompt,
        fromAction,
        'public',
      );
      const resolvedAction = budgetRescue?.action ?? fromAction;
      const rankRescue = rescueServiceRankFromRecommendSpecialistsIntent(
        prompt,
        resolvedAction,
      );
      const rescued = rankRescue ?? budgetRescue;

      expect(rescued?.action ?? fromAction).toBe(expectedAction);
      if (rescueReason) {
        expect(rescued?.rescueReason).toBe(rescueReason);
      } else {
        expect(rescued).toBeNull();
      }
    },
  );

  it('enriches serviceRank after rescuing recommend_specialists to list_services', () => {
    const prompt = "What's the best premium service for lashes?";
    const rescued = rescueServiceRankFromRecommendSpecialistsIntent(
      prompt,
      'recommend_specialists',
    );
    expect(rescued).toEqual({
      action: 'list_services',
      rescueReason: 'rank_recommend_specialists',
    });
    expect(enrichServiceRankFromPrompt({}, prompt).serviceRank).toBe(
      'highest_price',
    );
  });
});

describe('ai service rank discovery session flows (rank-1.12 / discover-exit-1)', () => {
  it.each(RANK_SESSION_SCENARIOS)(
    'merges session rank and budget params for $id',
    ({ id, turns }) => {
      let params: Record<string, unknown> = {};
      for (const turn of turns) {
        params = enrichServiceRankFromPrompt(
          enrichBudgetFromPrompt(params, turn.prompt),
          turn.prompt,
        );
        if (turn.expectedParams?.serviceRank != null) {
          expect(params.serviceRank).toBe(turn.expectedParams.serviceRank);
        }
        if (turn.expectedParams?.maxPrice != null) {
          expect(params.maxPrice).toBe(turn.expectedParams.maxPrice);
        }
      }
      expect(id).toBeTruthy();
    },
  );
});
