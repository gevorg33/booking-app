import {
  E2E254_EMPTY_REASON_ASSIGNED_UNSCHEDULED,
  E2E254_FACE_PILLING_SERVICE_ID,
  E2E254_SAMPLE_PAST_PATTERNS,
  E2E254_UNIT_CASES,
} from './e2e254-assigned-provider-hours.fixtures.js';
import {
  buildMicroSlotsForServiceBlock,
  diagnoseAssignedProvidersUnscheduled,
  extractServiceBlockPatterns,
  listFutureSameWeekdayDateKeys,
  periodAllowsService,
  projectPatternsOntoDateKeys,
} from './e2e254-assigned-provider-hours.util.js';

describe('e2e-bug.254 assigned provider hours util', () => {
  it('documents every unit scenario id', () => {
    expect(E2E254_UNIT_CASES.map((c) => c.id)).toEqual([
      'period-allows-explicit-service',
      'period-allows-open-null',
      'extract-patterns-filters-service',
      'project-same-weekday-forward',
      'build-micro-slots-10-min',
      'diagnose-assigned-unscheduled',
      'diagnose-null-when-dates-exist',
    ]);
  });

  it('period-allows-explicit-service + period-allows-open-null', () => {
    expect(
      periodAllowsService([E2E254_FACE_PILLING_SERVICE_ID], E2E254_FACE_PILLING_SERVICE_ID),
    ).toBe(true);
    expect(periodAllowsService(['other'], E2E254_FACE_PILLING_SERVICE_ID)).toBe(
      false,
    );
    expect(periodAllowsService(null, E2E254_FACE_PILLING_SERVICE_ID)).toBe(true);
    expect(periodAllowsService([], E2E254_FACE_PILLING_SERVICE_ID)).toBe(true);
  });

  it('extract-patterns-filters-service', () => {
    const patterns = extractServiceBlockPatterns(
      [
        {
          type: 'service_block',
          startTime: new Date('2026-07-29T09:00:00.000Z'),
          endTime: new Date('2026-07-29T13:00:00.000Z'),
          serviceIds: [E2E254_FACE_PILLING_SERVICE_ID],
          maxAppointmentCount: 1,
        },
        {
          type: 'unavailable_block',
          startTime: new Date('2026-07-29T13:00:00.000Z'),
          endTime: new Date('2026-07-29T14:00:00.000Z'),
          serviceIds: null,
        },
        {
          type: 'service_block',
          startTime: new Date('2026-07-29T14:00:00.000Z'),
          endTime: new Date('2026-07-29T18:00:00.000Z'),
          serviceIds: ['other-svc'],
        },
      ],
      E2E254_FACE_PILLING_SERVICE_ID,
    );
    expect(patterns).toHaveLength(1);
    expect(patterns[0].startMinute).toBe(9 * 60);
    expect(patterns[0].utcDayOfWeek).toBe(3);
  });

  it('project-same-weekday-forward', () => {
    const keys = listFutureSameWeekdayDateKeys(
      3,
      '2026-07-30',
      '2026-08-20',
      '2026-07-30',
    );
    expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(keys.every((k) => new Date(`${k}T00:00:00.000Z`).getUTCDay() === 3)).toBe(
      true,
    );

    const projected = projectPatternsOntoDateKeys(
      E2E254_SAMPLE_PAST_PATTERNS,
      keys.slice(0, 1),
    );
    expect(projected).toHaveLength(1);
    expect(projected[0].patterns).toHaveLength(2);
    expect(projected[0].patterns[0].startTime.toISOString()).toContain('T09:00:00');
  });

  it('build-micro-slots-10-min', () => {
    const slots = buildMicroSlotsForServiceBlock({
      businessId: 'biz',
      employeeId: 'emp',
      startTime: new Date('2026-08-05T09:00:00.000Z'),
      endTime: new Date('2026-08-05T09:30:00.000Z'),
      serviceIds: [E2E254_FACE_PILLING_SERVICE_ID],
      maxAppointmentCount: 1,
    });
    expect(slots).toHaveLength(3);
    expect(slots[0].status).toBe('available');
    expect(slots[0].serviceIds).toEqual([E2E254_FACE_PILLING_SERVICE_ID]);
  });

  it('diagnose-assigned-unscheduled + diagnose-null-when-dates-exist', () => {
    expect(
      diagnoseAssignedProvidersUnscheduled({
        assignedEmployeeCount: 1,
        assignedWithFutureSlots: 0,
        datesFound: 0,
      }),
    ).toBe(E2E254_EMPTY_REASON_ASSIGNED_UNSCHEDULED);
    expect(
      diagnoseAssignedProvidersUnscheduled({
        assignedEmployeeCount: 1,
        assignedWithFutureSlots: 0,
        datesFound: 2,
      }),
    ).toBeNull();
    expect(
      diagnoseAssignedProvidersUnscheduled({
        assignedEmployeeCount: 0,
        assignedWithFutureSlots: 0,
        datesFound: 0,
      }),
    ).toBeNull();
  });

  it.each(E2E254_UNIT_CASES.map((c) => [c.id, c.description] as const))(
    'fixture case registered: %s — %s',
    (id) => {
      expect(typeof id).toBe('string');
    },
  );
});
