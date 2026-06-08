import {
  buildAccuracyLadderProgress,
  buildAccuracyRatchetStatus,
  proposeAccuracyFloorBump,
} from './ai-accuracy-ratchet.util.js';
import { ACCURACY_RATCHET_SCENARIOS } from './ai-accuracy-ratchet.fixtures.js';

describe('ai-accuracy-ratchet.util (acc-6.4)', () => {
  it.each(ACCURACY_RATCHET_SCENARIOS)('$id ratchet proposal', (scenario) => {
    const proposal = proposeAccuracyFloorBump({
      currentFloor: scenario.currentFloor,
      measuredAccuracy: scenario.measuredAccuracy,
    });
    expect(proposal.shouldBump).toBe(scenario.expectBump);
    expect(proposal.proposedFloor).toBeCloseTo(scenario.expectNextFloor, 5);
  });

  it('buildAccuracyLadderProgress tracks stage', () => {
    const ladder = buildAccuracyLadderProgress({
      ciFloor: 0.95,
      liveAccurateRate: 0.93,
    });
    expect(ladder.currentStage).toBeGreaterThanOrEqual(1);
    expect(ladder.stages).toHaveLength(4);
    expect(ladder.ciTarget).toBe(0.99);
    expect(ladder.floorProgressPct).toBeCloseTo((0.95 / 0.99) * 100, 1);
    expect(ladder.gapToTargetPts).toBeCloseTo(4, 1);
  });

  it('buildAccuracyRatchetStatus exposes ladder + ratchet eligibility', () => {
    const status = buildAccuracyRatchetStatus({
      baseline: {
        accuracyFloor: 0.95,
        updatedAt: '2026-06-07',
        lastAccuracy: 0.962,
        ratchetHistory: [
          { at: '2026-06-01', from: 0.945, to: 0.95, measuredAccuracy: 0.96 },
        ],
      },
      measuredAccuracy: 0.962,
      liveAccurateRate: 0.93,
    });
    expect(status.ciFloor).toBe(0.95);
    expect(status.ratchet.shouldBump).toBe(true);
    expect(status.ladder.stages).toHaveLength(4);
    expect(status.ratchetHistory).toHaveLength(1);
  });
});
