import { SIMILAR_BUDGET_SERVICE_PROMPTS } from './ai-budget-service-discovery.fixtures.js';
import { CONSUMER_DISCOVERY_CHIP_FIXTURES } from './ai-consumer-discovery-chips.fixtures.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS } from './ai-flexible-availability.fixtures.js';
import { SIMILAR_SERVICE_RANK_PROMPTS } from './ai-service-rank-discovery.fixtures.js';

function promptByFixtureId(
  fixtureId: string,
  catalogs: Array<{ id: string; prompt: string }>[],
): string | undefined {
  for (const catalog of catalogs) {
    const match = catalog.find((row) => row.id === fixtureId);
    if (match) return match.prompt;
  }
  return undefined;
}

describe('ai-consumer-discovery-chips.fixtures (discover-1.4)', () => {
  it('ships three discover chips wired to budget, rank, and availability fixtures', () => {
    expect(CONSUMER_DISCOVERY_CHIP_FIXTURES.map((chip) => chip.id)).toEqual([
      'discover-chip-under-50-en',
      'discover-chip-premium-en',
      'discover-chip-evening-weekend-en',
    ]);
  });

  it.each(CONSUMER_DISCOVERY_CHIP_FIXTURES)(
    'chip $id prompt matches fixture $fixtureId',
    ({ fixtureId, prompt }) => {
      const fixturePrompt = promptByFixtureId(fixtureId, [
        SIMILAR_BUDGET_SERVICE_PROMPTS,
        SIMILAR_SERVICE_RANK_PROMPTS,
        SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
      ]);
      expect(fixturePrompt).toBe(prompt);
    },
  );

  it('budget chip enriches maxPrice from fixture prompt', () => {
    const chip = CONSUMER_DISCOVERY_CHIP_FIXTURES.find(
      (row) => row.id === 'discover-chip-under-50-en',
    )!;
    expect(enrichDiscoveryParamsFromPrompt({}, chip.prompt)).toEqual({
      maxPrice: 50,
    });
  });

  it('rank chip enriches serviceRank from fixture prompt', () => {
    const chip = CONSUMER_DISCOVERY_CHIP_FIXTURES.find(
      (row) => row.id === 'discover-chip-premium-en',
    )!;
    expect(enrichDiscoveryParamsFromPrompt({}, chip.prompt)).toMatchObject({
      serviceRank: 'highest_price',
    });
  });

  it('availability chip references avail-voice-chip-en fixture prompt and OR windows', () => {
    const chip = CONSUMER_DISCOVERY_CHIP_FIXTURES.find(
      (row) => row.id === 'discover-chip-evening-weekend-en',
    )!;
    const fixture = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (row) => row.id === chip.fixtureId,
    );
    expect(fixture?.prompt).toBe(chip.prompt);
    expect(fixture?.phase2).toBeUndefined();
    expect(fixture?.expectedParams?.availabilityWindows).toEqual([
      { timeOfDay: 'evening' },
      { weekdays: ['saturday', 'sunday'] },
    ]);
    expect(enrichDiscoveryParamsFromPrompt({}, chip.prompt)).toMatchObject(
      fixture?.expectedParams ?? {},
    );
  });
});
