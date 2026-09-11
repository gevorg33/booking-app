/**
 * AI-ROADMAP Phase 8 — detector retirement readiness.
 *
 * Measured against the real inventory and the §25 baseline: **318 of 555**
 * `legacy_paraphrase` detectors are retirement-ready, and four domains are
 * fully ready — `recommendation` (8), `tour` (8), `guide` (7), `appointment`
 * (5). The dominant blocker everywhere else is `not_evaluated`.
 *
 * The rule that matters most is that `not_evaluated` **blocks**. Treating "no
 * eval cases have failed" as "the planner handles this" is reading absence of
 * evidence as evidence, and it would delete the detector carrying a command
 * nobody has ever tested.
 */
import {
  assessDetector,
  buildRetirementReport,
  type InventoryDetector,
} from './ai-detector-retirement.util.js';
import { PROPOSE_ONLY_ACCURACY_BAR } from './ai-propose-only.util.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const spec = (
  id: string,
  domain: string,
  examples: string[] = ['do the thing'],
): CommandSpec => ({
  id,
  aliases: [id.split('.')[1] ?? id],
  domain,
  surfaces: ['dashboard'],
  tiers: { dashboard: ['owner'] },
  risk: 'T0',
  description: `${id} does something useful and specific`,
  variables: {},
  examples,
  confirm: 'never',
  handler: 'X',
});

const det = (over: Partial<InventoryDetector> = {}): InventoryDetector => ({
  symbol: 'isThingPrompt',
  file: 'modules/ai/x.util.ts',
  label: 'legacy_paraphrase',
  mapsToActions: ['thing'],
  reachableFromProduction: true,
  wiredInRescue: true,
  ...over,
});

const SPECS = [spec('domain.thing', 'domain'), spec('domain.other', 'domain')];
const GOOD = {
  thing: { passed: 100, total: 100 },
  other: { passed: 100, total: 100 },
};

describe('assessDetector', () => {
  it('is ready when the spec exists, has examples, and clears the bar', () => {
    expect(assessDetector(det(), SPECS, GOOD).ready).toBe(true);
  });

  it('blocks when no spec maps to the action', () => {
    const r = assessDetector(det({ mapsToActions: ['ghost'] }), SPECS, GOOD);
    expect(r.blockedBy).toEqual([{ action: 'ghost', reason: 'no_spec' }]);
  });

  it('blocks when the spec offers the planner no examples', () => {
    // The shortlist is descriptions plus examples. A command with none is one
    // the planner routes to by description alone.
    const r = assessDetector(det(), [spec('domain.thing', 'domain', [])], GOOD);
    expect(r.blockedBy[0].reason).toBe('no_examples');
  });

  it('blocks a command below the accuracy bar', () => {
    const r = assessDetector(det(), SPECS, {
      thing: { passed: 5, total: 100 },
    });
    expect(r.blockedBy[0].reason).toBe('below_accuracy_bar');
  });

  it('blocks a command with no eval cases rather than passing it', () => {
    // The rule this module exists to get right. Unknown accuracy is not good
    // accuracy, and this is the most common blocker in the real inventory.
    expect(assessDetector(det(), SPECS, {}).blockedBy[0].reason).toBe(
      'not_evaluated',
    );
    expect(
      assessDetector(det(), SPECS, { thing: { passed: 0, total: 0 } })
        .blockedBy[0].reason,
    ).toBe('not_evaluated');
  });

  it('accepts a command exactly at the bar', () => {
    const r = assessDetector(det(), SPECS, {
      thing: { passed: PROPOSE_ONLY_ACCURACY_BAR, total: 100 },
    });
    expect(r.ready).toBe(true);
  });

  it('needs EVERY mapped command ready, not just one', () => {
    // Deleting the detector removes the route for all of them.
    const r = assessDetector(
      det({ mapsToActions: ['thing', 'other'] }),
      SPECS,
      { thing: { passed: 100, total: 100 }, other: { passed: 1, total: 100 } },
    );
    expect(r.ready).toBe(false);
    expect(r.blockedBy.map((b) => b.action)).toEqual(['other']);
  });

  it('blocks a detector that maps to nothing', () => {
    const r = assessDetector(det({ mapsToActions: [] }), SPECS, GOOD);
    expect(r.blockedBy[0].reason).toBe('maps_to_nothing');
    expect(r.ready).toBe(false);
  });

  it('takes the domain from the spec, not the detector file', () => {
    expect(assessDetector(det(), SPECS, GOOD).domain).toBe('domain');
  });
});

describe('buildRetirementReport', () => {
  const detectors = [
    det({ symbol: 'aPrompt', mapsToActions: ['thing'] }),
    det({ symbol: 'bPrompt', mapsToActions: ['other'] }),
    det({
      symbol: 'cPrompt',
      label: 'structural_slot',
      mapsToActions: ['thing'],
    }),
  ];

  it('assesses only legacy_paraphrase detectors', () => {
    // Phase 8 retires paraphrase matchers. Structural extractors, confirm gates
    // and compound connectors do work the planner does not replace.
    const r = buildRetirementReport(detectors, SPECS, GOOD);
    expect(r.totalDetectors).toBe(2);
  });

  it('marks a domain slice-ready only when every detector in it can go', () => {
    const allGood = buildRetirementReport(detectors, SPECS, GOOD);
    expect(allGood.sliceReadyDomains).toEqual(['domain']);

    const oneBad = buildRetirementReport(detectors, SPECS, {
      thing: { passed: 100, total: 100 },
    });
    expect(oneBad.sliceReadyDomains).toEqual([]);
  });

  it('counts blockers so a slice can be planned', () => {
    const r = buildRetirementReport(detectors, SPECS, {});
    expect(r.byDomain[0].blockers[0]).toEqual({
      reason: 'not_evaluated',
      count: 2,
    });
  });

  it('reports readiness as a fraction, not a boolean', () => {
    // 318/555 is the useful number; "not ready" would hide that more than half
    // the work is already possible.
    const r = buildRetirementReport(detectors, SPECS, {
      thing: { passed: 100, total: 100 },
    });
    expect(r.readyDetectors).toBe(1);
    expect(r.totalDetectors).toBe(2);
  });
});
