/**
 * AI-ROADMAP Phase 9 — ratcheting completion floors.
 *
 * The property under test is the ratchet itself: a gain, once made, cannot be
 * given back silently. Everything else here exists to stop the gate being so
 * noisy that someone switches it off — which is the usual way a floor dies.
 */
import {
  buildCompletionFloors,
  checkCompletionFloors,
  COMPLETION_FLOOR_MARGIN,
  COMPLETION_FLOOR_MIN_CALLS,
  raiseCompletionFloors,
  type CompletionFloors,
} from './ai-completion-floor.util.js';
import {
  buildCompletionRateReport,
  type CompletionCountable,
} from './ai-completion-rate.util.js';
import type { AiCommandTraceSurface } from './entities/ai-command-trace.entity.js';

/** Build a report with an exact executed/total split on one surface. */
const report = (
  parts: { surface: AiCommandTraceSurface; executed: number; failed: number }[],
) => {
  const rows: CompletionCountable[] = [];
  for (const part of parts) {
    for (let i = 0; i < part.executed; i += 1) {
      rows.push({ action: 'a', surface: part.surface, outcome: 'executed' });
    }
    for (let i = 0; i < part.failed; i += 1) {
      rows.push({ action: 'a', surface: part.surface, outcome: 'failed' });
    }
  }
  return buildCompletionRateReport(rows);
};

/** 640/1000 executed → 64.0%, the real platform number when this was written. */
const atProductionRates = () =>
  report([
    { surface: 'customer', executed: 606, failed: 394 },
    { surface: 'dashboard', executed: 671, failed: 329 },
  ]);

describe('buildCompletionFloors', () => {
  it('sets the floor a margin below the measurement', () => {
    // Not AT the measurement: this is live traffic, and a floor pinned exactly
    // at today's rate fails on ordinary variance.
    const measured = atProductionRates().overall.completionRate;
    const floors = buildCompletionFloors(atProductionRates());
    expect(measured).toBe(63.9);
    expect(floors.overall).toBe(61.9);
    expect(floors.overall).toBeCloseTo(measured - COMPLETION_FLOOR_MARGIN, 1);
  });

  it('records the margin it used, so a floor can be explained later', () => {
    expect(buildCompletionFloors(atProductionRates()).marginUsed).toBe(
      COMPLETION_FLOOR_MARGIN,
    );
  });

  it('gives each surface its own floor', () => {
    // §28 found customer 22 points below provider. One global floor would let
    // the worst surface rot under cover of the average.
    const floors = buildCompletionFloors(atProductionRates());
    expect(Object.keys(floors.bySurface).sort()).toEqual([
      'customer',
      'dashboard',
    ]);
    expect(floors.bySurface.dashboard).toBeGreaterThan(
      floors.bySurface.customer,
    );
  });

  it('refuses to set a floor for a low-volume surface', () => {
    // A surface with a handful of calls swings twenty points on two failures.
    const floors = buildCompletionFloors(
      report([
        { surface: 'customer', executed: 606, failed: 394 },
        { surface: 'public', executed: 8, failed: 2 },
      ]),
    );
    expect(floors.bySurface).not.toHaveProperty('public');
  });

  it('never produces a negative floor', () => {
    const floors = buildCompletionFloors(
      report([{ surface: 'customer', executed: 1, failed: 999 }]),
    );
    expect(floors.overall).toBe(0);
  });
});

describe('checkCompletionFloors', () => {
  const floors = (): CompletionFloors =>
    buildCompletionFloors(atProductionRates());

  it('passes when the rate holds', () => {
    expect(checkCompletionFloors(atProductionRates(), floors()).passed).toBe(
      true,
    );
  });

  it('passes when the rate improves', () => {
    const better = report([
      { surface: 'customer', executed: 800, failed: 200 },
      { surface: 'dashboard', executed: 800, failed: 200 },
    ]);
    expect(checkCompletionFloors(better, floors()).passed).toBe(true);
  });

  it('passes on a dip inside the margin', () => {
    // The margin exists precisely so a quiet week is not an incident.
    const dipped = report([
      { surface: 'customer', executed: 596, failed: 404 },
      { surface: 'dashboard', executed: 661, failed: 339 },
    ]);
    expect(checkCompletionFloors(dipped, floors()).passed).toBe(true);
  });

  it('fails on a real regression', () => {
    const regressed = report([
      { surface: 'customer', executed: 400, failed: 600 },
      { surface: 'dashboard', executed: 400, failed: 600 },
    ]);
    const result = checkCompletionFloors(regressed, floors());
    expect(result.passed).toBe(false);
    expect(result.breaches.map((b) => b.scope)).toEqual(
      expect.arrayContaining(['overall', 'surface:customer']),
    );
  });

  it('catches one surface rotting while the average holds', () => {
    // The reason per-surface floors exist. Customer collapses, dashboard
    // improves enough to mask it in the overall number.
    const masked = report([
      { surface: 'customer', executed: 300, failed: 700 },
      { surface: 'dashboard', executed: 980, failed: 20 },
    ]);
    const result = checkCompletionFloors(masked, floors());
    expect(result.passed).toBe(false);
    expect(result.breaches.map((b) => b.scope)).toEqual(['surface:customer']);
  });

  it('says what broke, by how much, and on what volume', () => {
    // A breach nobody can act on is a breach nobody acts on.
    const regressed = report([
      { surface: 'customer', executed: 400, failed: 600 },
      { surface: 'dashboard', executed: 400, failed: 600 },
    ]);
    const breach = checkCompletionFloors(regressed, floors()).breaches[0];
    expect(breach.message).toContain('%');
    expect(breach.measured).toBeLessThan(breach.floor);
    expect(breach.calls).toBeGreaterThan(0);
  });

  it('skips a low-volume window instead of passing it silently', () => {
    // "No breach" and "not enough data to tell" are different answers. A gate
    // that conflates them goes quiet exactly when traffic drops.
    const quiet = report([{ surface: 'customer', executed: 6, failed: 4 }]);
    const result = checkCompletionFloors(quiet, floors());
    expect(result.passed).toBe(true);
    expect(result.skipped.map((s) => s.scope)).toContain('overall');
  });

  it('ignores a surface that has no floor yet', () => {
    const withNewSurface = report([
      { surface: 'customer', executed: 606, failed: 394 },
      { surface: 'dashboard', executed: 671, failed: 329 },
      { surface: 'provider', executed: 100, failed: 900 },
    ]);
    const result = checkCompletionFloors(withNewSurface, floors());
    expect(result.breaches.map((b) => b.scope)).not.toContain(
      'surface:provider',
    );
  });

  it('does not breach on a surface that vanished from the window', () => {
    // No traffic is not a regression.
    const onlyCustomer = report([
      { surface: 'customer', executed: 606, failed: 394 },
    ]);
    const result = checkCompletionFloors(onlyCustomer, floors());
    expect(result.breaches.map((b) => b.scope)).not.toContain(
      'surface:dashboard',
    );
  });

  it('uses the documented volume threshold', () => {
    const justUnder = report([
      {
        surface: 'customer',
        executed: 0,
        failed: COMPLETION_FLOOR_MIN_CALLS - 1,
      },
    ]);
    expect(checkCompletionFloors(justUnder, floors()).passed).toBe(true);
  });
});

describe('raiseCompletionFloors — the ratchet', () => {
  const seeded = () => buildCompletionFloors(atProductionRates());

  it('raises the floor when the rate improves', () => {
    const better = report([
      { surface: 'customer', executed: 800, failed: 200 },
      { surface: 'dashboard', executed: 800, failed: 200 },
    ]);
    const { floors, raised } = raiseCompletionFloors(seeded(), better);
    expect(floors.overall).toBeCloseTo(80 - COMPLETION_FLOOR_MARGIN, 1);
    expect(raised.map((r) => r.scope)).toContain('overall');
  });

  it('never lowers a floor', () => {
    // The whole point. A dip must not hand back ground already won, or the
    // "ratchet" is just a thermometer.
    const before = seeded();
    const worse = report([
      { surface: 'customer', executed: 200, failed: 800 },
      { surface: 'dashboard', executed: 200, failed: 800 },
    ]);
    const { floors, raised } = raiseCompletionFloors(before, worse);
    expect(floors.overall).toBe(before.overall);
    expect(floors.bySurface.customer).toBe(before.bySurface.customer);
    expect(raised).toEqual([]);
  });

  it('holds a dipped surface while raising an improved one', () => {
    const before = seeded();
    const mixed = report([
      { surface: 'customer', executed: 300, failed: 700 },
      { surface: 'dashboard', executed: 900, failed: 100 },
    ]);
    const { floors } = raiseCompletionFloors(before, mixed);
    expect(floors.bySurface.customer).toBe(before.bySurface.customer);
    expect(floors.bySurface.dashboard).toBeGreaterThan(
      before.bySurface.dashboard,
    );
  });

  it('adopts a surface that has crossed the volume threshold', () => {
    const before = seeded();
    const withProvider = report([
      { surface: 'customer', executed: 606, failed: 394 },
      { surface: 'dashboard', executed: 671, failed: 329 },
      { surface: 'provider', executed: 825, failed: 175 },
    ]);
    const { floors, raised } = raiseCompletionFloors(before, withProvider);
    expect(floors.bySurface.provider).toBeCloseTo(
      82.5 - COMPLETION_FLOOR_MARGIN,
      1,
    );
    expect(raised.map((r) => r.scope)).toContain('surface:provider');
  });

  it('keeps a floor for a surface missing from the new measurement', () => {
    // Losing traffic must not delete the standard that surface already met.
    const before = seeded();
    const onlyCustomer = report([
      { surface: 'customer', executed: 606, failed: 394 },
    ]);
    const { floors } = raiseCompletionFloors(before, onlyCustomer);
    expect(floors.bySurface.dashboard).toBe(before.bySurface.dashboard);
  });

  it('reports every raise, so a moved floor is never a surprise', () => {
    const better = report([
      { surface: 'customer', executed: 900, failed: 100 },
      { surface: 'dashboard', executed: 900, failed: 100 },
    ]);
    const { raised } = raiseCompletionFloors(seeded(), better);
    for (const r of raised) expect(r.to).toBeGreaterThan(r.from);
  });

  it('closes the loop: a raised floor then rejects the old rate', () => {
    // Ratchet end to end — improve, lock in, and the previous level is now a
    // regression rather than the status quo.
    const better = report([
      { surface: 'customer', executed: 800, failed: 200 },
      { surface: 'dashboard', executed: 800, failed: 200 },
    ]);
    const { floors } = raiseCompletionFloors(seeded(), better);
    expect(checkCompletionFloors(atProductionRates(), floors).passed).toBe(
      false,
    );
  });
});
