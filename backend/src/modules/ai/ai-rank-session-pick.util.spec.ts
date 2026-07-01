import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';
import { RANK_SESSION_PICK_CATALOG } from './ai-rank-list-services.fixtures.js';
import { RANK_SESSION_SCENARIOS } from './ai-service-rank-discovery.fixtures.js';
import { enrichRankSessionParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { filterActiveCatalogServices } from './ai-service-catalog-rank.util.js';
import {
  buildRankedServicesFromSessionContext,
  enrichRankSessionPickFromPrompt,
  extractRankSessionListPickIndexFromPrompt,
  isRankSessionListPickPrompt,
  parseRankedServiceIdsFromSession,
  resolveRankSessionListPickService,
  serializeRankedServiceIds,
} from './ai-rank-session-pick.util.js';
import {
  composePublicListServicesRankResponse,
  resolveListServicesRankLimitFromPrompt,
} from './ai-rank-list-services.logic.js';

describe('ai-rank-session-pick.util (rank-session-pick-one-en)', () => {
  const scenario = RANK_SESSION_SCENARIOS.find(
    (entry) => entry.id === 'rank-session-pick-one-en',
  )!;

  it('detects list pick index from ordinal prompt', () => {
    expect(
      extractRankSessionListPickIndexFromPrompt('book the second one tomorrow'),
    ).toBe(2);
    expect(isRankSessionListPickPrompt('book the third one')).toBe(true);
    expect(isRankSessionListPickPrompt('premium massage tomorrow')).toBe(false);
  });

  it('builds top-3 premium massage rank list on turn 1', () => {
    const turn1 = enrichRankSessionParamsFromPrompt(
      {},
      scenario.turns[0].prompt,
    );
    expect(turn1).toMatchObject({
      serviceCategory: 'massage',
      serviceRank: 'highest_price',
    });
    expect(
      resolveListServicesRankLimitFromPrompt(scenario.turns[0].prompt, turn1),
    ).toBe(3);

    const ranked = buildRankedServicesFromSessionContext(
      turn1,
      RANK_SESSION_PICK_CATALOG,
      scenario.turns[0].prompt,
    );
    expect(ranked.map((service) => service.id)).toEqual([
      'massage-120',
      'massage-90',
      'massage-60',
    ]);
  });

  it('resolves second ranked service on turn 2 with persisted ids', () => {
    const turn1 = enrichRankSessionParamsFromPrompt(
      {},
      scenario.turns[0].prompt,
    );
    const ranked = buildRankedServicesFromSessionContext(
      turn1,
      RANK_SESSION_PICK_CATALOG,
      scenario.turns[0].prompt,
    );
    const session = {
      ...turn1,
      rankedServiceIds: ranked.map((service) => service.id),
    };
    const catalog = RANK_SESSION_PICK_CATALOG.map((service) => ({
      id: service.id,
      name: service.name,
    }));

    const picked = enrichRankSessionPickFromPrompt(
      scenario.turns[1].prompt,
      session,
      catalog,
    );
    expect(picked).toMatchObject({
      serviceCategory: 'massage',
      serviceName: 'Relax massage',
      serviceId: 'massage-90',
    });
    expect(resolveRankSessionListPickService(ranked, 2)?.name).toBe(
      'Relax massage',
    );
  });

  it('enrichPublicAssistantParamsFromPrompt maps pick prompt to booked service', () => {
    const turn1 = enrichRankSessionParamsFromPrompt(
      {},
      scenario.turns[0].prompt,
    );
    const ranked = buildRankedServicesFromSessionContext(
      turn1,
      RANK_SESSION_PICK_CATALOG,
      scenario.turns[0].prompt,
    );
    const session = {
      ...turn1,
      rankedServiceIds: serializeRankedServiceIds(
        ranked.map((service) => service.id),
      ),
    };
    const catalog = RANK_SESSION_PICK_CATALOG.map((service) => ({
      id: service.id,
      name: service.name,
    }));

    const turn2 = enrichPublicAssistantParamsFromPrompt(
      scenario.turns[1].prompt,
      session,
      catalog,
      'book_appointment',
    );
    expect(turn2).toMatchObject(scenario.turns[1].expectedParams);
  });

  it('parseRankedServiceIdsFromSession accepts JSON and comma-separated ids', () => {
    expect(
      parseRankedServiceIdsFromSession('["massage-120","massage-90"]'),
    ).toEqual(['massage-120', 'massage-90']);
    expect(parseRankedServiceIdsFromSession('massage-120,massage-90')).toEqual([
      'massage-120',
      'massage-90',
    ]);
  });
});

describe('ai-rank-session-pick.util inactive catalog filter (rank-inactive-excluded)', () => {
  it('composePublicListServicesRankResponse skips inactive highest-price row', () => {
    const services = [
      {
        id: 'massage-150',
        name: 'Deluxe massage',
        price: 150,
        durationMinutes: 90,
        serviceCategory: 'massage',
        isActive: false,
        currency: 'USD',
      },
      {
        id: 'massage-90',
        name: 'Relax massage',
        price: 90,
        durationMinutes: 60,
        serviceCategory: 'massage',
        currency: 'USD',
      },
      {
        id: 'massage-60',
        name: 'Basic massage',
        price: 60,
        durationMinutes: 45,
        serviceCategory: 'massage',
        currency: 'USD',
      },
    ];

    expect(
      filterActiveCatalogServices(services).map((service) => service.id),
    ).toEqual(['massage-90', 'massage-60']);

    const result = composePublicListServicesRankResponse({
      matchedServices: services,
      serviceCategory: 'massage',
      serviceRank: 'highest_price',
      limit: 1,
      allCatalogServices: services,
    });

    expect(result.services.map((service) => service.id)).toEqual([
      'massage-90',
    ]);
  });
});
