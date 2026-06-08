import { describe, expect, it } from '@jest/globals';
import { AiAccuracyRatchetService } from './ai-accuracy-ratchet.service.js';

describe('AiAccuracyRatchetService (acc-6.4)', () => {
  const service = new AiAccuracyRatchetService();

  it('getStatus returns ladder and ratchet proposal from baseline', () => {
    const status = service.getStatus({ liveAccurateRate: 0.93 });
    expect(status.ciTarget).toBe(0.99);
    expect(status.ladder.stages).toHaveLength(4);
    expect(status.ratchet).toMatchObject({
      currentFloor: expect.any(Number),
      measuredAccuracy: expect.any(Number),
      proposedFloor: expect.any(Number),
      shouldBump: expect.any(Boolean),
    });
  });

  it('applyRatchetIfEligible returns baseline + status without throwing', () => {
    const result = service.applyRatchetIfEligible();
    expect(result).toMatchObject({
      applied: expect.any(Boolean),
      baseline: expect.objectContaining({
        accuracyFloor: expect.any(Number),
      }),
      status: expect.objectContaining({
        ladder: expect.objectContaining({ stages: expect.any(Array) }),
      }),
    });
  });
});
