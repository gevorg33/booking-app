import {
  E2E263_LIVE_SCENARIOS,
  E2E263_TARGET_GATE_CASES,
} from './ai-e2e263-visit-status-target.fixtures.js';
import {
  buildVisitStatusTargetClarifyDetails,
  buildVisitStatusTargetClarifySummary,
  shouldClarifyVisitStatusTarget,
} from './ai-e2e263-visit-status-target.util.js';

describe('e2e-bug.263: visit-status single-target gate', () => {
  it.each(E2E263_TARGET_GATE_CASES)(
    '$id — shouldClarifyVisitStatusTarget',
    ({ matchedCount, expectClarify }) => {
      expect(shouldClarifyVisitStatusTarget(matchedCount)).toBe(expectClarify);
    },
  );

  it('clarify summary names the match count for multi-target', () => {
    expect(buildVisitStatusTargetClarifySummary(5)).toMatch(/5 appointments/);
    expect(buildVisitStatusTargetClarifySummary(5)).toMatch(/Which client/i);
  });

  it('clarify details mark clarify + missing anchors', () => {
    expect(
      buildVisitStatusTargetClarifyDetails('mark_visit_in_progress', 3),
    ).toMatchObject({
      clarify: true,
      action: 'mark_visit_in_progress',
      matchedCount: 3,
      missing: ['customerName', 'bookingId'],
    });
  });

  it('live scenario inventory covers untargeted clarify + named/session single update', () => {
    const ids = E2E263_LIVE_SCENARIOS.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'e2e263-live-untargeted-in-progress-clarify',
        'e2e263-live-untargeted-complete-clarify',
        'e2e263-live-named-client-updates-one',
        'e2e263-live-session-bookingId-updates-one',
        'e2e263-live-single-match-may-update',
      ]),
    );
    expect(E2E263_LIVE_SCENARIOS).toHaveLength(9);
  });
});
