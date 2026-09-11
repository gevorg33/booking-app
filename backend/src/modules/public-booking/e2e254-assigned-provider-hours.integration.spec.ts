import { PrepaymentMode } from '../service/entities/service.entity.js';
import { SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import {
  createEmptyBookingPopularityRepoMock,
  createPublicBookingServiceHarness,
} from './public-booking-test.harness.js';
import { E2E254_EMPTY_REASON_ASSIGNED_UNSCHEDULED } from './e2e254-assigned-provider-hours.fixtures.js';

/**
 * e2e-bug.482 — this suite used to hardcode its pattern day (2026-07-29) and a
 * fixed window (2026-07-31 → 2026-08-20). Materialization only fills *future*
 * days, so the test passed exactly while a matching weekday fell strictly
 * inside that window. Jul 29 + 21 days is 2026-08-19: future on the 18th,
 * "today" on the 19th, and the suite went red overnight with no code change.
 *
 * Anchoring to today instead. A weekly pattern seeded 21 days back always has
 * future occurrences inside a 21-day forward window, whatever day it is run.
 */
const DAY_MS = 86_400_000;

function utcMidnightToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function dayOffset(days: number): Date {
  return new Date(utcMidnightToday().getTime() + days * DAY_MS);
}

/** The pattern day, at a given UTC hour. */
function patternAt(hour: number): Date {
  const d = dayOffset(-21);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

describe('e2e-bug.254 assigned provider hours roll-forward', () => {
  function createHarness() {
    const business = {
      id: 'biz-1',
      name: 'Studio',
      slug: 'studio',
      timezone: 'UTC',
      isActive: true,
      settings: {
        locale: 'en',
        publicBooking: { enabled: true },
      },
    } as unknown as Business;

    const service = {
      id: 'svc-face',
      businessId: 'biz-1',
      name: 'Face Pilling',
      isActive: true,
      prepaymentMode: PrepaymentMode.FULL,
      price: 80,
      durationMinutes: 60,
      bufferMinutes: 0,
      currency: 'USD',
      metadata: {},
    };

    const employee = {
      id: 'emp-karo',
      name: 'Karo',
      isActive: true,
      serviceIds: ['svc-face'],
    };

    const savedSlots: unknown[] = [];
    const savedPeriods: unknown[] = [];

    const slotRepo = {
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn(async (rows: unknown[]) => {
        savedSlots.push(...rows);
        return rows;
      }),
      find: jest.fn().mockResolvedValue([]),
    };

    const schedulingPeriodRepo = {
      find: jest.fn().mockResolvedValue([
        {
          type: TemplatePeriodType.SERVICE_BLOCK,
          startTime: patternAt(9),
          endTime: patternAt(13),
          serviceIds: ['svc-face'],
          maxAppointmentCount: 1,
        },
        {
          type: TemplatePeriodType.SERVICE_BLOCK,
          startTime: patternAt(14),
          endTime: patternAt(18),
          serviceIds: ['svc-face'],
          maxAppointmentCount: 1,
        },
      ]),
      save: jest.fn(async (rows: unknown[]) => {
        savedPeriods.push(...rows);
        return rows;
      }),
    };

    const businessService = {
      findBySlug: jest.fn().mockResolvedValue(business),
      findOne: jest.fn().mockResolvedValue(business),
    };

    const serviceRepo = {
      findOne: jest.fn().mockResolvedValue(service),
      find: jest.fn().mockResolvedValue([service]),
    };

    const employeeRepo = {
      find: jest.fn().mockResolvedValue([employee]),
    };

    const serviceInstance = createPublicBookingServiceHarness({
      businessService,
      serviceRepo,
      employeeRepo,
      slotRepo,
      schedulingPeriodRepo,
      bookingRepo: createEmptyBookingPopularityRepoMock(),
    });
    (serviceInstance as any).serviceRepo = serviceRepo;
    (serviceInstance as any).employeeRepo = employeeRepo;
    (serviceInstance as any).slotRepo = slotRepo;
    (serviceInstance as any).schedulingPeriodRepo = schedulingPeriodRepo;

    return {
      service: serviceInstance,
      slotRepo,
      schedulingPeriodRepo,
      savedSlots,
      savedPeriods,
      employee,
    };
  }

  it('rolls forward past SERVICE_BLOCK pattern into future micro-slots (materialize path)', async () => {
    const harness = createHarness();
    // e2e-bug.273 — public GET no longer persists; materialize is for booking POST
    await (harness.service as any).materializeAssignedProvidersUpcomingHours(
      'biz-1',
      { id: 'svc-face' },
      [harness.employee],
      isoDay(dayOffset(1)),
      isoDay(dayOffset(21)),
    );

    expect(harness.savedPeriods.length).toBeGreaterThan(0);
    expect(harness.savedSlots.length).toBeGreaterThan(0);
    expect(
      harness.savedSlots.every(
        (s: any) => s.status === SlotStatus.AVAILABLE && s.employeeId === 'emp-karo',
      ),
    ).toBe(true);
  });

  it('getServiceBookableDates returns emptyReason when still unscheduled', async () => {
    const harness = createHarness();
    harness.schedulingPeriodRepo.find.mockResolvedValue([]);
    jest
      .spyOn(harness.service as any, 'serviceDayHasBookableSlots')
      .mockResolvedValue(false);

    const result = await harness.service.getServiceBookableDates(
      'studio',
      'svc-face',
      '2026-08-01',
      '2026-08-07',
    );

    expect(result.dates).toEqual([]);
    expect(result.emptyReason).toBe(E2E254_EMPTY_REASON_ASSIGNED_UNSCHEDULED);
  });
});
