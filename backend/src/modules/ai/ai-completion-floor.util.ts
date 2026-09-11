/**
 * AI-ROADMAP Phase 9 — ratcheting completion floors.
 *
 * §25 ratchets accuracy against a fixed corpus. §28 measures completion but
 * nothing holds it: the north star could slide from 64% to 50% and no gate
 * would notice, because the only thing watching it was a view somebody had to
 * remember to query.
 *
 * The two ratchets are not the same shape, and conflating them would produce a
 * gate that fires constantly:
 *
 * | | accuracy (§25) | completion (here) |
 * |---|---|---|
 * | measured against | a fixed corpus | live traffic |
 * | varies run to run | no | **yes** |
 * | runs in | CI | a scheduled job with DB access |
 *
 * Because the input moves, a floor pinned exactly at the current value would
 * fail on ordinary week-to-week variance and be switched off within a month.
 * Floors therefore sit a documented margin below the measurement, and only
 * ever move up.
 */
/**
 * The slice of a report a floor actually needs.
 *
 * Narrower than `CompletionRateReport`, which `buildCompletionRateReport`
 * produces and which satisfies this structurally. The scheduled job reads the
 * §28 aggregate views rather than 5,362 raw rows, and this lets it pass what it
 * has instead of fabricating per-action fields nobody checks.
 */
export interface CompletionMeasurement {
  overall: { calls: number; completionRate: number };
  bySurface: readonly {
    surface: string;
    calls: number;
    completionRate: number;
  }[];
}

/**
 * How far below the measured rate a floor sits.
 *
 * Two points. At the current 5,362-trace volume that is roughly a hundred
 * commands — big enough to absorb a quiet week, small enough that a real
 * regression still trips it. Exported so it can be argued with; the right value
 * comes from watching the variance, not from first principles.
 */
export const COMPLETION_FLOOR_MARGIN = 2;

/**
 * Below this many calls a rate is noise.
 *
 * A surface with 12 commands in the window can swing twenty points on two
 * failures. Checking it would produce alerts nobody can act on.
 */
export const COMPLETION_FLOOR_MIN_CALLS = 200;

export interface CompletionFloors {
  generatedAt: string;
  /** Floor for the platform-wide completion rate. */
  overall: number;
  /** Per-surface floors — §28 found customer 22 points below provider. */
  bySurface: Record<string, number>;
  marginUsed: number;
}

export type FloorBreachScope = 'overall' | `surface:${string}`;

export interface FloorBreach {
  scope: FloorBreachScope;
  floor: number;
  measured: number;
  calls: number;
  message: string;
}

export interface FloorCheckResult {
  passed: boolean;
  breaches: FloorBreach[];
  /** Scopes skipped for low volume, so a silent pass is explainable. */
  skipped: { scope: FloorBreachScope; calls: number }[];
}

function floorFrom(rate: number, margin: number): number {
  // Round down to one decimal so a floor is never fractionally above the value
  // it was derived from.
  return Math.max(0, Math.floor((rate - margin) * 10) / 10);
}

/** Derive floors from a measurement. Used to seed and to raise. */
export function buildCompletionFloors(
  report: CompletionMeasurement,
  options: { margin?: number; minCalls?: number } = {},
): CompletionFloors {
  const margin = options.margin ?? COMPLETION_FLOOR_MARGIN;
  const minCalls = options.minCalls ?? COMPLETION_FLOOR_MIN_CALLS;

  const bySurface: Record<string, number> = {};
  for (const surface of report.bySurface) {
    if (surface.calls < minCalls) continue;
    bySurface[surface.surface] = floorFrom(surface.completionRate, margin);
  }

  return {
    generatedAt: new Date().toISOString(),
    overall: floorFrom(report.overall.completionRate, margin),
    bySurface,
    marginUsed: margin,
  };
}

/**
 * Check a measurement against committed floors.
 *
 * Skips any scope below the volume threshold rather than passing it silently —
 * "no breach" and "not enough data to tell" are different answers, and a gate
 * that conflates them is one that goes quiet exactly when traffic drops.
 */
export function checkCompletionFloors(
  report: CompletionMeasurement,
  floors: CompletionFloors,
  options: { minCalls?: number } = {},
): FloorCheckResult {
  const minCalls = options.minCalls ?? COMPLETION_FLOOR_MIN_CALLS;
  const breaches: FloorBreach[] = [];
  const skipped: { scope: FloorBreachScope; calls: number }[] = [];

  if (report.overall.calls < minCalls) {
    skipped.push({ scope: 'overall', calls: report.overall.calls });
  } else if (report.overall.completionRate < floors.overall) {
    breaches.push({
      scope: 'overall',
      floor: floors.overall,
      measured: report.overall.completionRate,
      calls: report.overall.calls,
      message:
        `Overall completion ${report.overall.completionRate}% is below the ` +
        `${floors.overall}% floor (${report.overall.calls} calls).`,
    });
  }

  for (const [surface, floor] of Object.entries(floors.bySurface)) {
    const measured = report.bySurface.find((s) => s.surface === surface);
    if (!measured) continue;
    const scope: FloorBreachScope = `surface:${surface}`;
    if (measured.calls < minCalls) {
      skipped.push({ scope, calls: measured.calls });
      continue;
    }
    if (measured.completionRate < floor) {
      breaches.push({
        scope,
        floor,
        measured: measured.completionRate,
        calls: measured.calls,
        message:
          `${surface} completion ${measured.completionRate}% is below the ` +
          `${floor}% floor (${measured.calls} calls).`,
      });
    }
  }

  return { passed: breaches.length === 0, breaches, skipped };
}

export interface FloorRaise {
  scope: FloorBreachScope;
  from: number;
  to: number;
}

/**
 * Raise floors to match an improved measurement — never lower them.
 *
 * The ratchet. A surface that improved gets a higher floor so the gain is held;
 * one that dipped keeps its existing floor, so the next measurement still has
 * to clear the level already reached. Lowering a floor is possible only by
 * editing the committed file, which is a visible, reviewable act rather than a
 * side effect of running a script.
 */
export function raiseCompletionFloors(
  current: CompletionFloors,
  report: CompletionMeasurement,
  options: { margin?: number; minCalls?: number } = {},
): { floors: CompletionFloors; raised: FloorRaise[] } {
  const proposed = buildCompletionFloors(report, options);
  const raised: FloorRaise[] = [];

  const overall = Math.max(current.overall, proposed.overall);
  if (overall > current.overall) {
    raised.push({ scope: 'overall', from: current.overall, to: overall });
  }

  const bySurface: Record<string, number> = { ...current.bySurface };
  for (const [surface, value] of Object.entries(proposed.bySurface)) {
    const existing = current.bySurface[surface];
    const next = existing === undefined ? value : Math.max(existing, value);
    if (existing === undefined || next > existing) {
      raised.push({
        scope: `surface:${surface}`,
        from: existing ?? 0,
        to: next,
      });
    }
    bySurface[surface] = next;
  }

  return {
    floors: {
      generatedAt: new Date().toISOString(),
      overall,
      bySurface,
      marginUsed: options.margin ?? COMPLETION_FLOOR_MARGIN,
    },
    raised,
  };
}
