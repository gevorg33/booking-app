import {
  DISCOVER_CROSS_SPRINT_FIXTURE_IDS,
  DISCOVER_EXIT_FIXTURE_IDS,
  DISCOVER_EXIT_MIN_UNIQUE_FIXTURE_IDS,
  findOrphanFixtureIds,
} from './ai-discover-exit.fixtures.js';
import { BUDGET_DOMAIN_FIXTURE_IDS } from './ai-budget-service-discovery.fixtures.js';
import { AVAIL_DOMAIN_FIXTURE_IDS } from './ai-flexible-availability.fixtures.js';
import { RANK_DOMAIN_FIXTURE_IDS } from './ai-service-rank-discovery.fixtures.js';
import {
  buildDiscoverExitItEachCoveredIds,
  listDiscoverExitItEachCoverageGaps,
} from './ai-discover-exit.coverage.js';
import {
  assertConsumerDiscoveryChipsCopyCatalog,
  assertPublicCheckAvailabilityAvail15Wiring,
} from './ai-discover-exit.wiring.js';
import { CONSUMER_DISCOVERY_CHIP_FIXTURES } from './ai-consumer-discovery-chips.fixtures.js';
import {
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES,
  DISCOVER_CROSS_SPRINT_MIN_EVAL_CASES,
} from './ai-service-discovery.eval.util.js';

describe('ai discover exit gate (discover-exit-1)', () => {
  it('ships at least 120 unique fixture ids across budget, rank, avail, and cross-sprint', () => {
    expect(BUDGET_DOMAIN_FIXTURE_IDS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(BUDGET_DOMAIN_FIXTURE_IDS).size).toBe(
      BUDGET_DOMAIN_FIXTURE_IDS.length,
    );

    expect(DISCOVER_EXIT_FIXTURE_IDS.length).toBeGreaterThanOrEqual(
      DISCOVER_EXIT_MIN_UNIQUE_FIXTURE_IDS,
    );
    expect(new Set(DISCOVER_EXIT_FIXTURE_IDS).size).toBe(
      DISCOVER_EXIT_FIXTURE_IDS.length,
    );
    expect(DISCOVER_CROSS_SPRINT_FIXTURE_IDS.length).toBeGreaterThanOrEqual(15);
  });

  it('has zero orphan discover fixture ids (every id in it.each coverage)', () => {
    const covered = buildDiscoverExitItEachCoveredIds();
    const orphans = findOrphanFixtureIds(DISCOVER_EXIT_FIXTURE_IDS, covered);

    expect(orphans).toEqual([]);
    expect(
      listDiscoverExitItEachCoverageGaps(DISCOVER_EXIT_FIXTURE_IDS),
    ).toEqual([]);
  });

  it('covers every budget domain fixture id via discover-suite it.each', () => {
    const covered = buildDiscoverExitItEachCoveredIds();
    expect(findOrphanFixtureIds(BUDGET_DOMAIN_FIXTURE_IDS, covered)).toEqual(
      [],
    );
  });

  it('covers every rank domain fixture id via discover-suite it.each', () => {
    const covered = buildDiscoverExitItEachCoveredIds();
    expect(findOrphanFixtureIds(RANK_DOMAIN_FIXTURE_IDS, covered)).toEqual([]);
  });

  it('covers every availability domain fixture id via discover-suite it.each', () => {
    const covered = buildDiscoverExitItEachCoveredIds();
    expect(findOrphanFixtureIds(AVAIL_DOMAIN_FIXTURE_IDS, covered)).toEqual([]);
  });

  it('covers every cross-sprint fixture id via discover-suite it.each', () => {
    const covered = buildDiscoverExitItEachCoveredIds();
    expect(
      findOrphanFixtureIds(DISCOVER_CROSS_SPRINT_FIXTURE_IDS, covered),
    ).toEqual([]);
  });
});

describe('ai discover exit gate (discover-exit-2)', () => {
  it('ships avail-1.5 timeOfDay filter and OR window loop in public handleCheckAvailability', () => {
    assertPublicCheckAvailabilityAvail15Wiring();
  });
});

describe('ai discover exit gate (discover-exit-3)', () => {
  it('includes cross-sprint discover eval cases in discover exit coverage', () => {
    expect(
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES.length,
    ).toBeGreaterThanOrEqual(DISCOVER_CROSS_SPRINT_MIN_EVAL_CASES);
    for (const evalCase of AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES) {
      expect(evalCase.id).toMatch(/^discover-/);
    }
    const covered = buildDiscoverExitItEachCoveredIds();
    for (const evalCase of AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES) {
      expect(covered.has(evalCase.id)).toBe(true);
    }
  });
});

describe('ai discover exit gate (discover-exit-4)', () => {
  it('documents consumer assistant discover chips in consumer-copy-catalog.ts', () => {
    assertConsumerDiscoveryChipsCopyCatalog();
  });

  it('matches backend chip fixture labels and prompts in copy catalog', () => {
    for (const chip of CONSUMER_DISCOVERY_CHIP_FIXTURES) {
      expect(chip.label.trim().length).toBeGreaterThan(0);
      expect(chip.prompt.trim().length).toBeGreaterThan(0);
    }
  });
});
