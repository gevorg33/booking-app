import { describe, expect, it } from '@jest/globals';
import {
  PROVIDER_EXPLAIN_BOOKING_STATUS_BADGE_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_FLOOR_STATUS_PROMPT_SCENARIOS,
} from './ai-provider-visit-status-explainers.fixtures.js';
import {
  buildExplainBookingStatusBadgeSummary,
  buildExplainFloorStatusSummary,
  isExplainBookingStatusBadgePrompt,
  isExplainFloorStatusPrompt,
  rescueVisitStatusExplainersIntent,
} from './ai-provider-visit-status-explainers.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';

describe('ai-provider-visit-status-explainers.util (e2e-bug.244 / ai-cmd-provider-5.16.5–5.16.6)', () => {
  it('registers both explainers on provider surface', () => {
    expect(
      isIntentAllowedOnSurface('explain_booking_status_badge', 'provider'),
    ).toBe(true);
    expect(isIntentAllowedOnSurface('explain_floor_status', 'provider')).toBe(
      true,
    );
  });

  it.each(
    PROVIDER_EXPLAIN_BOOKING_STATUS_BADGE_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects badge explainer %s', (_id, prompt) => {
    expect(isExplainBookingStatusBadgePrompt(prompt as string)).toBe(true);
    expect(isExplainFloorStatusPrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_EXPLAIN_FLOOR_STATUS_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('detects floor explainer %s', (_id, prompt) => {
    expect(isExplainFloorStatusPrompt(prompt as string)).toBe(true);
    expect(isExplainBookingStatusBadgePrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_EXPLAIN_BOOKING_STATUS_BADGE_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues %s to explain_booking_status_badge', (_id, prompt) => {
    expect(
      rescueVisitStatusExplainersIntent(prompt as string, 'unknown'),
    ).toEqual({
      action: 'explain_booking_status_badge',
      rescueReason: 'explain_booking_status_badge',
    });
  });

  it.each(
    PROVIDER_EXPLAIN_FLOOR_STATUS_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('rescues %s to explain_floor_status', (_id, prompt) => {
    expect(
      rescueVisitStatusExplainersIntent(prompt as string, 'unknown'),
    ).toEqual({
      action: 'explain_floor_status',
      rescueReason: 'explain_floor_status',
    });
  });

  it.each([
    ['confirm-pending', 'Confirm all pending today'],
    ['mark-in-progress', 'Mark in progress'],
    ['check-in', 'Check in client'],
    ['team-floor-live', "Who's next on the floor?"],
  ])('rejects negative %s', (_id, prompt) => {
    expect(isExplainBookingStatusBadgePrompt(prompt)).toBe(false);
    expect(isExplainFloorStatusPrompt(prompt)).toBe(false);
    expect(rescueVisitStatusExplainersIntent(prompt, 'unknown')).toBeNull();
  });

  it('builds summaries with required status vocabulary', () => {
    const badge = buildExplainBookingStatusBadgeSummary();
    for (const word of [
      'Pending',
      'Confirmed',
      'In progress',
      'Completed',
      'No-show',
    ]) {
      expect(badge).toContain(word);
    }
    const floor = buildExplainFloorStatusSummary();
    for (const word of ['Waiting', 'In service', 'Done', 'floor strip']) {
      expect(floor.toLowerCase()).toContain(word.toLowerCase());
    }
  });
});
