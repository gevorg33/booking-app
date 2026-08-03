import {
  E2E267_SINGLE_RESCHEDULE_CASES,
  E2E267_TRUE_COMPOUND_CASES,
} from './ai-e2e267-reschedule-semicolon.fixtures.js';
import {
  isRescheduleExistingAppointmentPrompt,
  isSingleRescheduleNearestContinuationPrompt,
} from './ai-find-soonest-appointment.util.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.267 semicolon move+nearest stays single reschedule', () => {
  const rescue = new AiIntentRescueService();
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan' },
    { id: 'e2', name: 'Anna' },
    { id: 'e3', name: 'Sam' },
  ];

  it.each(
    E2E267_SINGLE_RESCHEDULE_CASES.map((row) => [row.id, row] as const),
  )('single-intent gate for %s', (_id, row) => {
    expect(isSingleRescheduleNearestContinuationPrompt(row.prompt)).toBe(
      row.expectSingleRescheduleContinuation,
    );
    expect(isCompoundPrompt(row.prompt)).toBe(row.expectCompound);
    expect(isRescheduleExistingAppointmentPrompt(row.prompt)).toBe(true);
  });

  it.each(
    E2E267_SINGLE_RESCHEDULE_CASES.filter((r) => r.expectRescue).map(
      (row) => [row.id, row] as const,
    ),
  )('rescues %s to reschedule_booking (not compound)', (_id, row) => {
    const result = rescue.rescue({
      prompt: row.prompt,
      action: 'unknown',
      params: {},
      employees,
      surface: 'dashboard',
    });
    expect(result?.action).toBe('reschedule_booking');
    expect(result?.params?.bookingFirstAvailable).toBe(true);
  });

  it.each(E2E267_TRUE_COMPOUND_CASES.map((row) => [row.id, row] as const))(
    'keeps true compound for %s',
    (_id, row) => {
      expect(isSingleRescheduleNearestContinuationPrompt(row.prompt)).toBe(
        row.expectSingleRescheduleContinuation,
      );
      expect(isCompoundPrompt(row.prompt)).toBe(row.expectCompound);
    },
  );
});
