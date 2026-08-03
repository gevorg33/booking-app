import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  E2E248_RESCHEDULE_NEAREST_SCENARIOS,
  E2E248_SOONEST_NEGATIVE_SCENARIOS,
} from './ai-e2e248-reschedule-nearest.fixtures.js';
import {
  isFindSoonestAppointmentPrompt,
  isRescheduleExistingAppointmentPrompt,
} from './ai-find-soonest-appointment.util.js';
import { resolveAvailabilityIntentFromPrompt } from './ai-intent-disambiguation.util.js';

describe('e2e-bug.248 reschedule nearest free time (not find_soonest)', () => {
  const rescue = new AiIntentRescueService();
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan' },
    { id: 'e2', name: 'Maria' },
  ];

  it.each(
    E2E248_RESCHEDULE_NEAREST_SCENARIOS.map((row) => [row.id, row] as const),
  )('detects reschedule (not soonest) for %s', (_id, row) => {
    expect(isRescheduleExistingAppointmentPrompt(row.prompt)).toBe(true);
    expect(isFindSoonestAppointmentPrompt(row.prompt)).toBe(false);
    expect(
      resolveAvailabilityIntentFromPrompt('dashboard', row.prompt)?.action,
    ).not.toBe('find_soonest_appointment');
    expect(
      resolveAvailabilityIntentFromPrompt('customer', row.prompt)?.action,
    ).not.toBe('find_soonest_appointment');
  });

  it.each(
    E2E248_RESCHEDULE_NEAREST_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues %s to reschedule_booking', (_id, row) => {
    const result = rescue.rescue({
      prompt: row.prompt,
      action: row.fromAction,
      params: {},
      employees,
      surface: row.surface,
    });
    expect(result?.action).toBe(row.expectedAction);
    if (row.expectBookingFirstAvailable) {
      expect(result?.params?.bookingFirstAvailable).toBe(true);
    }
  });

  it.each(
    E2E248_SOONEST_NEGATIVE_SCENARIOS.map((row) => [row.id, row] as const),
  )('keeps true soonest READ on %s', (_id, row) => {
    expect(isRescheduleExistingAppointmentPrompt(row.prompt)).toBe(false);
    expect(isFindSoonestAppointmentPrompt(row.prompt)).toBe(true);
    const result = rescue.rescue({
      prompt: row.prompt,
      action: 'unknown',
      params: {},
      surface: row.surface,
    });
    expect(result?.action).toBe('find_soonest_appointment');
  });
});
