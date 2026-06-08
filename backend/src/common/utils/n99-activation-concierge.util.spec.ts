import { describe, expect, it } from '@jest/globals';
import {
  ACTIVATION_CONCIERGE_MILESTONE_SCENARIOS,
  ACTIVATION_CONCIERGE_RESUME_SCENARIOS,
} from './n99-activation-concierge.fixtures.js';
import {
  buildActivationConciergeResumePushUrl,
  buildActivationConciergeResumeWebUrl,
  listActivationConciergeCandidateInputs,
  resolveActivationConciergeMilestone,
  resolveActivationConciergeResumeTarget,
} from './n99-activation-concierge.util.js';

describe('n99-activation-concierge.util (n99-3.5)', () => {
  it.each(ACTIVATION_CONCIERGE_MILESTONE_SCENARIOS)(
    'resolveActivationConciergeMilestone $id',
    ({ installAt, now, sent, expect: expected }) => {
      const milestone = resolveActivationConciergeMilestone(
        new Date(installAt),
        new Date(now),
        new Set(sent),
      );
      expect(milestone).toBe(expected);
    },
  );

  it.each(ACTIVATION_CONCIERGE_RESUME_SCENARIOS)(
    'resolveActivationConciergeResumeTarget $id',
    ({ rows, anonId, expectServiceId, expectSlot }) => {
      const target = resolveActivationConciergeResumeTarget(rows, anonId);
      if (!expectServiceId) {
        expect(target).toBeNull();
        return;
      }
      expect(target?.serviceId).toBe(expectServiceId);
      expect(target?.slot ?? null).toBe(expectSlot);
    },
  );

  it('buildActivationConciergeResumePushUrl includes resume flag', () => {
    expect(
      buildActivationConciergeResumePushUrl({
        slug: 'salon-a',
        serviceId: 'svc-1',
        date: '2026-06-10',
        slot: '2026-06-10T14:00:00.000Z',
      }),
    ).toContain('resume=1');
  });

  it('buildActivationConciergeResumeWebUrl includes resume query', () => {
    expect(
      buildActivationConciergeResumeWebUrl({
        frontendBaseUrl: 'https://book.example.com',
        slug: 'salon-a',
        serviceId: 'svc-1',
        slot: '2026-06-10T14:00:00.000Z',
      }),
    ).toContain('resume=1');
  });

  it('lists qualified unactivated concierge candidates', () => {
    const rows = ACTIVATION_CONCIERGE_RESUME_SCENARIOS[0].rows;
    const candidates = listActivationConciergeCandidateInputs(
      rows,
      new Date('2026-06-09T02:00:00.000Z'),
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.milestone).toBe('24h');
    expect(candidates[0]?.resume?.serviceId).toBe('svc-1');
  });
});
