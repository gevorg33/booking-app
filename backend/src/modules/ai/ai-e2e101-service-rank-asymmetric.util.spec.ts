import {
  E2E101_SERVICE_RANK_ASYMMETRIC_SCENARIOS,
} from './ai-e2e101-service-rank-asymmetric.fixtures.js';
import {
  buildServiceRankDiscoveryRescueParams,
  extractServiceRankFromPrompt,
  extractServiceRankServiceCategoryFromPrompt,
  stripLeadingServiceRankAdjectives,
} from './ai-service-rank-discovery.util.js';
import { enrichServiceDiscoveryFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  buildRankCompoundSharedParams,
  isServiceRankDiscoveryCompoundPrompt,
} from './ai-service-rank-discovery-compound.util.js';
import { applyPromptMentionedServiceOverrideToParams } from './ai-booking-param-hints.util.js';

describe('e2e-bug.101 service rank high-end vocabulary', () => {
  it.each(
    E2E101_SERVICE_RANK_ASYMMETRIC_SCENARIOS.map((row) => [row.id, row] as const),
  )('extracts rank+category for %s', (_id, row) => {
    expect(extractServiceRankFromPrompt(row.prompt)).toBe(row.expectedRank);
    expect(extractServiceRankServiceCategoryFromPrompt(row.prompt)).toBe(
      row.expectedCategory,
    );

    const rescued = buildServiceRankDiscoveryRescueParams(row.prompt);
    expect(rescued.serviceRank).toBe(row.expectedRank);
    expect(rescued.serviceCategory).toBe(row.expectedCategory);
    expect(rescued.serviceName ?? null).toBeNull();

    const discovered = enrichServiceDiscoveryFromPrompt(
      { serviceName: `most expensive ${row.expectedCategory}` },
      row.prompt,
    );
    expect(discovered.serviceRank).toBe(row.expectedRank);
    expect(discovered.serviceCategory).toBe(row.expectedCategory);
    expect(discovered.serviceName ?? null).toBeNull();
  });

  it.each(
    E2E101_SERVICE_RANK_ASYMMETRIC_SCENARIOS.filter((row) => 'compound' in row && row.compound).map(
      (row) => [row.id, row] as const,
    ),
  )('compound shared params for %s', (_id, row) => {
    expect(isServiceRankDiscoveryCompoundPrompt(row.prompt)).toBe(true);
    const shared = buildRankCompoundSharedParams(row.prompt, 'customer');
    expect(shared.serviceRank).toBe(row.expectedRank);
    expect(shared.serviceCategory).toBe(row.expectedCategory);
    expect(shared.serviceName).toBeFalsy();
  });

  it('strips most expensive / your most premium like cheapest', () => {
    expect(stripLeadingServiceRankAdjectives('most expensive massage')).toBe(
      'massage',
    );
    expect(
      stripLeadingServiceRankAdjectives('your most premium facial'),
    ).toBe('facial');
    expect(stripLeadingServiceRankAdjectives('cheapest haircut')).toBe(
      'haircut',
    );
  });

  it('aliases bare "style"/"styles"/"styling" to "haircut" for both rank directions (e2e-bug.101)', () => {
    expect(
      extractServiceRankServiceCategoryFromPrompt(
        'What is the cheapest styling?',
      ),
    ).toBe('haircut');
    expect(
      extractServiceRankServiceCategoryFromPrompt(
        'Show me the most premium style',
      ),
    ).toBe('haircut');
    expect(
      extractServiceRankServiceCategoryFromPrompt(
        "What's the cheapest styles?",
      ),
    ).toBe('haircut');
    // trim still aliases to haircut; bare "cut" stays unaliased as of
    // e2e-bug.323 (prefers literal "* cut" catalog rows like Men's cut over
    // the hairstyle synonym, still falls back to haircut/hairstyle otherwise).
    expect(
      extractServiceRankServiceCategoryFromPrompt("What's the cheapest cut?"),
    ).toBe('cut');
    expect(
      extractServiceRankServiceCategoryFromPrompt('most expensive trim'),
    ).toBe('haircut');
  });

  it('override path does not keep most expensive as serviceName', () => {
    const next = applyPromptMentionedServiceOverrideToParams(
      'Book the most expensive massage tomorrow, nearest slot',
      {},
    );
    const scrubbed = enrichServiceDiscoveryFromPrompt(next, 
      'Book the most expensive massage tomorrow, nearest slot',
    );
    expect(scrubbed.serviceCategory).toBe('massage');
    expect(scrubbed.serviceRank).toBe('highest_price');
    expect(scrubbed.serviceName).toBeFalsy();
  });
});
