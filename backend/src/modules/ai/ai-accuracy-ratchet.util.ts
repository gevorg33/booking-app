import {
  ACCURACY_RATCHET_MIN_BUMP_GAP,
  ACCURACY_RATCHET_STEP,
  ACCURACY_RATCHET_TARGET,
  ACCURACY_LADDER_STAGES,
  ACCURACY_RATCHET_SCENARIOS,
} from './ai-accuracy-ratchet.fixtures.js';

export {
  ACCURACY_LADDER_STAGES,
  ACCURACY_RATCHET_SCENARIOS,
  ACCURACY_RATCHET_STEP,
  ACCURACY_RATCHET_TARGET,
} from './ai-accuracy-ratchet.fixtures.js';

export interface AccuracyRatchetProposal {
  shouldBump: boolean;
  currentFloor: number;
  measuredAccuracy: number;
  proposedFloor: number;
  reason: string;
}

export interface AccuracyLadderProgress {
  currentStage: number;
  targetStage: number;
  ciFloor: number;
  ciTarget: number;
  floorProgressPct: number;
  gapToTargetPts: number;
  liveNoClarifyRate?: number;
  liveAccurateRate?: number;
  stages: Array<(typeof ACCURACY_LADDER_STAGES)[number] & { reached: boolean }>;
}

export interface AccuracyRatchetStatus {
  ciTarget: number;
  ciFloor: number;
  measuredAccuracy: number;
  floorProgressPct: number;
  gapToTargetPts: number;
  ratchet: AccuracyRatchetProposal;
  ladder: AccuracyLadderProgress;
  baselineUpdatedAt: string;
  ratchetHistory: Array<{
    at: string;
    from: number;
    to: number;
    measuredAccuracy: number;
  }>;
}

/** acc-6.4 — propose raising CI floor after a green eval run. */
export function proposeAccuracyFloorBump(input: {
  currentFloor: number;
  measuredAccuracy: number;
  step?: number;
  target?: number;
}): AccuracyRatchetProposal {
  const step = input.step ?? ACCURACY_RATCHET_STEP;
  const target = input.target ?? ACCURACY_RATCHET_TARGET;
  const gap = input.measuredAccuracy - input.currentFloor;

  if (input.currentFloor >= target - 1e-9) {
    return {
      shouldBump: false,
      currentFloor: input.currentFloor,
      measuredAccuracy: input.measuredAccuracy,
      proposedFloor: input.currentFloor,
      reason: 'Already at target floor',
    };
  }

  if (gap < ACCURACY_RATCHET_MIN_BUMP_GAP) {
    return {
      shouldBump: false,
      currentFloor: input.currentFloor,
      measuredAccuracy: input.measuredAccuracy,
      proposedFloor: input.currentFloor,
      reason: 'Measured accuracy too close to current floor',
    };
  }

  const proposedFloor = Math.min(
    target,
    Math.round((input.currentFloor + step) * 1000) / 1000,
  );

  return {
    shouldBump: proposedFloor > input.currentFloor,
    currentFloor: input.currentFloor,
    measuredAccuracy: input.measuredAccuracy,
    proposedFloor,
    reason: `Ratchet +${(step * 100).toFixed(1)} pts toward ${(target * 100).toFixed(0)}%`,
  };
}

export function buildAccuracyLadderProgress(input: {
  ciFloor: number;
  ciTarget?: number;
  liveNoClarifyRate?: number;
  liveAccurateRate?: number;
}): AccuracyLadderProgress {
  const ciTarget = input.ciTarget ?? ACCURACY_RATCHET_TARGET;
  const live = input.liveAccurateRate ?? input.liveNoClarifyRate ?? 0;
  const stages = ACCURACY_LADDER_STAGES.map((stage) => ({
    ...stage,
    reached: live + 1e-9 >= stage.targetNoClarify,
  }));
  const currentStage =
    stages.filter((stage) => stage.reached).at(-1)?.stage ?? 0;
  const targetStage = ACCURACY_LADDER_STAGES.at(-1)?.stage ?? 4;
  const floorProgressPct = ciTarget
    ? Math.min(100, (input.ciFloor / ciTarget) * 100)
    : 0;

  return {
    currentStage,
    targetStage,
    ciFloor: input.ciFloor,
    ciTarget,
    floorProgressPct,
    gapToTargetPts: Math.max(0, (ciTarget - input.ciFloor) * 100),
    liveNoClarifyRate: input.liveNoClarifyRate,
    liveAccurateRate: input.liveAccurateRate,
    stages,
  };
}

/** acc-6.4 — CI floor ratchet status + live ladder for dashboard. */
export function buildAccuracyRatchetStatus(input: {
  baseline: {
    accuracyFloor: number;
    updatedAt: string;
    lastAccuracy?: number;
    ratchetHistory?: AccuracyRatchetStatus['ratchetHistory'];
  };
  measuredAccuracy?: number;
  liveNoClarifyRate?: number;
  liveAccurateRate?: number;
}): AccuracyRatchetStatus {
  const measuredAccuracy =
    input.measuredAccuracy ??
    input.baseline.lastAccuracy ??
    input.baseline.accuracyFloor;
  const ratchet = proposeAccuracyFloorBump({
    currentFloor: input.baseline.accuracyFloor,
    measuredAccuracy,
  });
  const ladder = buildAccuracyLadderProgress({
    ciFloor: input.baseline.accuracyFloor,
    liveNoClarifyRate: input.liveNoClarifyRate,
    liveAccurateRate: input.liveAccurateRate,
  });

  return {
    ciTarget: ACCURACY_RATCHET_TARGET,
    ciFloor: input.baseline.accuracyFloor,
    measuredAccuracy,
    floorProgressPct: ladder.floorProgressPct,
    gapToTargetPts: ladder.gapToTargetPts,
    ratchet,
    ladder,
    baselineUpdatedAt: input.baseline.updatedAt,
    ratchetHistory: input.baseline.ratchetHistory ?? [],
  };
}
