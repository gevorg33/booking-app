/**
 * AI-ROADMAP Phase 7 — post-execution assertion.
 *
 * `success: true` from a handler is a claim, not evidence. Three bugs on this
 * programme were that claim being false (e2e-bug.136, .348, .256). §34 stops the
 * *response* inventing success; this checks the *result* it is built from.
 */
import {
  assertPlanEffects,
  assertStepEffect,
  ASSERTED_TIERS,
} from './ai-post-exec-assert.util.js';
import type { CommandRiskTier } from './ai-command-spec.types.js';

const check = (
  variables: Record<string, unknown>,
  output: Record<string, unknown> | null,
  risk: CommandRiskTier = 'T2',
) =>
  assertStepEffect({
    step: { command: 'appointment.mark_paid', variables },
    spec: { risk },
    output,
  });

describe('assertStepEffect', () => {
  describe('verified', () => {
    it('accepts an output that mentions the identifier it was given', () => {
      const result = check(
        { appointmentId: 'apt-9' },
        { id: 'apt-9', paid: true },
      );
      expect(result.status).toBe('verified');
      expect(result.shouldFail).toBe(false);
    });

    it('finds the identifier nested inside the output', () => {
      // Handlers return all sorts of shapes; the evidence just has to be there.
      const result = check(
        { appointmentId: 'apt-9' },
        { updated: [{ booking: { id: 'apt-9' } }] },
      );
      expect(result.status).toBe('verified');
    });

    it('accepts when a declared value is echoed back unchanged', () => {
      const result = check(
        { appointmentId: 'apt-9', status: 'no_show' },
        { id: 'apt-9', status: 'no_show' },
      );
      expect(result.status).toBe('verified');
    });
  });

  describe('contradicted — the wrong write reported as success', () => {
    it('catches a declared value coming back different', () => {
      // Asked for no_show, the row says confirmed. The handler said success.
      const result = check(
        { appointmentId: 'apt-9', status: 'no_show' },
        { id: 'apt-9', status: 'confirmed' },
      );
      expect(result.status).toBe('contradicted');
      expect(result.shouldFail).toBe(true);
      expect(result.reasons[0]).toContain('no_show');
      expect(result.reasons[0]).toContain('confirmed');
    });

    it('fails a contradiction even at a low tier', () => {
      // "Unverified" is tier-dependent; "contradicted" never is — the platform
      // has positive evidence it did the wrong thing.
      const result = check(
        { status: 'no_show' },
        { status: 'confirmed' },
        'T1',
      );
      expect(result.shouldFail).toBe(true);
    });
  });

  describe('unverified — no evidence either way', () => {
    it('fails a T2 whose result does not mention the row it touched', () => {
      // Unverified money is not verified money.
      const result = check({ appointmentId: 'apt-9' }, { ok: true }, 'T2');
      expect(result.status).toBe('unverified');
      expect(result.shouldFail).toBe(true);
      expect(result.reasons[0]).toContain('apt-9');
    });

    it('fails a T3 the same way', () => {
      expect(check({ appointmentId: 'a' }, {}, 'T3').shouldFail).toBe(true);
    });

    it('does not fail a T1 for the same gap', () => {
      // Requiring evidence from every single-entity mutation would fail the
      // many handlers that return only a summary string.
      const result = check({ appointmentId: 'apt-9' }, { ok: true }, 'T1');
      expect(result.status).toBe('unverified');
      expect(result.shouldFail).toBe(false);
    });

    it('treats a handler that returned nothing as unverified', () => {
      // Deliberate pressure: a T2 handler that reports nothing cannot be
      // trusted to have done anything.
      expect(check({ appointmentId: 'apt-9' }, null, 'T2').shouldFail).toBe(
        true,
      );
    });

    it('reports a step with no identifier to check against', () => {
      const result = check({ note: 'hello' }, { ok: true }, 'T2');
      expect(result.status).toBe('unverified');
      expect(result.reasons[0]).toContain('no identifier');
    });
  });

  describe('what it deliberately does not check', () => {
    it('ignores structured drafts rather than guessing at them', () => {
      // `catalog.create_with_services` takes a nested draft; asserting its
      // shape generically would produce confident nonsense.
      const result = assertStepEffect({
        step: {
          command: 'catalog.create_with_services',
          variables: { catalogDraft: { categoryName: 'Wellness' } },
        },
        spec: { risk: 'T3' },
        output: { created: true },
      });
      expect(result.status).toBe('unverified');
    });

    it('ignores empty variables', () => {
      const result = check(
        { appointmentId: 'apt-9', note: '' },
        { id: 'apt-9' },
      );
      expect(result.status).toBe('verified');
    });
  });

  it('asserts exactly the tiers §3.3 names', () => {
    expect([...ASSERTED_TIERS].sort()).toEqual(['T2', 'T3']);
  });
});

describe('assertPlanEffects', () => {
  const specFor = (command: string) =>
    command === 'appointment.mark_paid'
      ? ({ risk: 'T2' } as const)
      : command === 'catalog.list_packages'
        ? ({ risk: 'T0' } as const)
        : undefined;

  const step = (overrides: Record<string, unknown> = {}) => ({
    stepId: 's1',
    command: 'appointment.mark_paid',
    status: 'executed',
    output: { id: 'apt-9' } as Record<string, unknown> | null,
    variables: { appointmentId: 'apt-9' },
    ...overrides,
  });

  it('verifies a clean plan', () => {
    const summary = assertPlanEffects([step()], specFor);
    expect(summary.allVerified).toBe(true);
    expect(summary.failedStepIds).toEqual([]);
  });

  it('flags a step that reported success without evidence', () => {
    const summary = assertPlanEffects(
      [step({ output: { ok: true } })],
      specFor,
    );
    expect(summary.allVerified).toBe(false);
    expect(summary.failedStepIds).toEqual(['s1']);
  });

  it('does not assert steps that already failed', () => {
    // A failed step does not need a second opinion, and asserting against its
    // empty output would report the same event as two failures.
    const summary = assertPlanEffects(
      [step({ status: 'failed', output: null })],
      specFor,
    );
    expect(summary.perStep).toEqual([]);
  });

  it('does not assert skipped steps', () => {
    const summary = assertPlanEffects(
      [step({ status: 'skipped', output: null })],
      specFor,
    );
    expect(summary.perStep).toEqual([]);
  });

  it('records an unknown spec without escalating it to a failure', () => {
    // The write already happened; calling it a failure now would be a second
    // false report rather than a correction.
    const summary = assertPlanEffects(
      [step({ command: 'mystery.command' })],
      specFor,
    );
    expect(summary.failedStepIds).toEqual([]);
    expect(summary.perStep[0].result.status).toBe('unverified');
  });

  it('checks each step against its own tier', () => {
    const summary = assertPlanEffects(
      [
        step({ stepId: 's1', output: { ok: true } }),
        step({
          stepId: 's2',
          command: 'catalog.list_packages',
          output: { ok: true },
          variables: { categoryId: 'c1' },
        }),
      ],
      specFor,
    );
    // T2 without evidence fails; T0 without evidence does not.
    expect(summary.failedStepIds).toEqual(['s1']);
  });
});
