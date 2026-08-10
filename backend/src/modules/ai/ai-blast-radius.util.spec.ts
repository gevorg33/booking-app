/**
 * AI-ROADMAP Phase 5 — blast-radius caps.
 *
 * The exposure: `appointment.cancel_bulk` is T3 because it is filter-matched
 * and therefore unbounded. "Cancel everything next week" resolves to whatever
 * happens to match, and until now nothing asked whether that count was
 * plausible before writing.
 */
import {
  BLAST_RADIUS_CAPS,
  checkBlastRadius,
  isBulkCommand,
} from './ai-blast-radius.util.js';
import type { CommandRiskTier } from './ai-command-spec.types.js';

const spec = (risk: CommandRiskTier, bulkOf?: string) => ({
  id: 'appointment.cancel_bulk',
  risk,
  bulkOf,
});

describe('BLAST_RADIUS_CAPS', () => {
  it('refuses above the point it starts confirming, for every tier that confirms', () => {
    // T0 is excluded deliberately: reads never ask for confirmation, so its
    // `confirmAbove` is Infinity and it goes straight from allow to refuse.
    // Stating the invariant over all four tiers was wrong, not the caps.
    for (const tier of ['T1', 'T2', 'T3'] as const) {
      const { confirmAbove, refuseAbove } = BLAST_RADIUS_CAPS[tier];
      expect(refuseAbove).toBeGreaterThan(confirmAbove);
    }
  });

  it('takes reads straight from allow to refuse, never through confirm', () => {
    const caps = BLAST_RADIUS_CAPS.T0;
    expect(caps.confirmAbove).toBe(Number.POSITIVE_INFINITY);
    expect(Number.isFinite(caps.refuseAbove)).toBe(true);
    // A read just under the ceiling is allowed outright...
    expect(checkBlastRadius(spec('T0'), caps.refuseAbove).verdict).toBe(
      'allow',
    );
    // ...and one over it is refused without ever asking.
    expect(checkBlastRadius(spec('T0'), caps.refuseAbove + 1).verdict).toBe(
      'refuse',
    );
  });

  it('is strictest where a mistake is most expensive to undo', () => {
    // T2 is money and PII: a wrong count there costs refunds and a privacy
    // incident, not a rescheduling exercise.
    expect(BLAST_RADIUS_CAPS.T2.refuseAbove).toBeLessThan(
      BLAST_RADIUS_CAPS.T3.refuseAbove,
    );
    expect(BLAST_RADIUS_CAPS.T2.confirmAbove).toBeLessThan(
      BLAST_RADIUS_CAPS.T1.confirmAbove,
    );
  });

  it('does not gate reads behind confirmation', () => {
    expect(BLAST_RADIUS_CAPS.T0.confirmAbove).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('checkBlastRadius', () => {
  describe('within the cap', () => {
    it('allows a small bulk operation outright', () => {
      const check = checkBlastRadius(spec('T3'), 3);
      expect(check.verdict).toBe('allow');
      expect(check.message).toBeNull();
    });

    it('allows a T1 single-entity mutation', () => {
      expect(checkBlastRadius(spec('T1'), 1).verdict).toBe('allow');
    });
  });

  describe('above the confirm threshold', () => {
    it('asks for confirmation and names the count', () => {
      // "Are you sure?" is a prompt people learn to dismiss; "this affects 47
      // appointments" is not.
      const check = checkBlastRadius(spec('T3'), 47);
      expect(check.verdict).toBe('confirm');
      expect(check.message).toContain('47');
    });

    it('proceeds once confirmed', () => {
      expect(
        checkBlastRadius(spec('T3'), 47, { confirmed: true }).verdict,
      ).toBe('allow');
    });

    it('confirms far sooner for money and PII', () => {
      // Four refunds is unremarkable in count and expensive in consequence.
      expect(checkBlastRadius(spec('T2'), 4).verdict).toBe('confirm');
      expect(checkBlastRadius(spec('T3'), 4).verdict).toBe('allow');
    });
  });

  describe('above the refusal threshold', () => {
    it('refuses even when the user confirmed', () => {
      // The whole point: confirmation cannot authorise a filter that has
      // obviously matched the wrong set.
      const check = checkBlastRadius(spec('T3'), 900, { confirmed: true });
      expect(check.verdict).toBe('refuse');
    });

    it('explains that the filter is the likely cause', () => {
      const check = checkBlastRadius(spec('T3'), 900);
      expect(check.message).toContain('900');
      expect(check.message).toContain('filter');
    });

    it('can be raised deliberately, but not removed', () => {
      const raised = checkBlastRadius(spec('T3'), 900, {
        overrideRefuseAbove: 1000,
      });
      expect(raised.verdict).toBe('confirm');
      // Still bounded: the override is a higher bar, not the absence of one.
      expect(
        checkBlastRadius(spec('T3'), 2000, { overrideRefuseAbove: 1000 })
          .verdict,
      ).toBe('refuse');
    });
  });

  describe('counts it cannot trust', () => {
    it.each([-1, 1.5, Number.NaN])('refuses a count of %p', (affected) => {
      // Treating an unusable count as zero would wave the command through,
      // which is the failure mode this check exists to prevent.
      const check = checkBlastRadius(spec('T3'), affected);
      expect(check.verdict).toBe('refuse');
      expect(check.message).toContain('how many');
    });
  });

  it('allows a no-op rather than refusing it', () => {
    // Nothing to do is not a cap problem. The caller still has to report it
    // honestly rather than as a successful change (§3.3).
    const check = checkBlastRadius(spec('T3'), 0);
    expect(check.verdict).toBe('allow');
  });

  it('reports the thresholds it applied, so a refusal is arguable', () => {
    const check = checkBlastRadius(spec('T2'), 100);
    expect(check).toMatchObject({
      tier: 'T2',
      affected: 100,
      confirmAbove: BLAST_RADIUS_CAPS.T2.confirmAbove,
      refuseAbove: BLAST_RADIUS_CAPS.T2.refuseAbove,
    });
  });
});

describe('isBulkCommand', () => {
  it('recognises a declared bulkOf', () => {
    expect(isBulkCommand({ risk: 'T1', bulkOf: 'appointment.cancel' })).toBe(
      true,
    );
  });

  it('treats T3 as bulk, because that is what T3 means', () => {
    expect(isBulkCommand({ risk: 'T3' })).toBe(true);
  });

  it('does not treat an ordinary mutation as bulk', () => {
    expect(isBulkCommand({ risk: 'T1' })).toBe(false);
  });
});
