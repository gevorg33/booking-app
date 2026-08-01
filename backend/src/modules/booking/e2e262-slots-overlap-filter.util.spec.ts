import { ConflictException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { BookingService } from './booking.service.js';
import {
  E2E262_LIVE_SCENARIOS,
  E2E262_SOURCE_RULES,
  E2E262_VALIDATE_WINDOW_CASES,
} from './e2e262-slots-overlap-filter.fixtures.js';

function chainQb(overrides: Record<string, unknown> = {}) {
  const qb: Record<string, jest.Mock> = {};
  const self = () => qb;
  qb.where = jest.fn(self);
  qb.andWhere = jest.fn(self);
  qb.orderBy = jest.fn(self);
  qb.addOrderBy = jest.fn(self);
  qb.setLock = jest.fn(self);
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getCount = jest.fn().mockResolvedValue(0);
  Object.assign(qb, overrides);
  return qb;
}

function buildMicroSlots(start: Date, count: number, serviceId: string) {
  return Array.from({ length: count }, (_, i) => {
    const slotStart = new Date(start.getTime() + i * 10 * 60 * 1000);
    return {
      id: `slot-${i}`,
      status: SlotStatus.AVAILABLE,
      startTime: slotStart,
      endTime: new Date(slotStart.getTime() + 10 * 60 * 1000),
      appointmentCount: 0,
      maxAppointmentCount: 2,
      serviceIds: [serviceId],
    };
  });
}

describe('e2e-bug.262: public slots filter employee booking overlap', () => {
  const bookingServiceSource = readFileSync(
    resolve(__dirname, 'booking.service.ts'),
    'utf8',
  );

  it.each(E2E262_SOURCE_RULES)('$id', ({ mustContain }) => {
    expect(bookingServiceSource).toContain(mustContain);
  });

  it('validateBookingWindow success path calls hasActiveBookingOverlap after duration fit', () => {
    const windowFn = bookingServiceSource.indexOf(
      'private async validateBookingWindow(',
    );
    const nextFn = bookingServiceSource.indexOf(
      'private async validateAgainstServicePeriods(',
      windowFn + 1,
    );
    const windowBody = bookingServiceSource.slice(windowFn, nextFn);
    const durationGuard = windowBody.lastIndexOf(
      'dedupedSlots.length < slotsNeeded',
    );
    const overlapAfter = windowBody.indexOf(
      'hasActiveBookingOverlap(',
      durationGuard,
    );
    expect(durationGuard).toBeGreaterThan(-1);
    expect(overlapAfter).toBeGreaterThan(durationGuard);
    expect(windowBody).toContain('e2e-bug.262');
  });

  it('live scenario inventory covers phantom-free list + cancel + neighbor overlap', () => {
    const ids = E2E262_LIVE_SCENARIOS.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'e2e262-live-zero-phantom-listed',
        'e2e262-live-listed-slot-books',
        'e2e262-live-winner-absent-from-slots',
        'e2e262-live-duration-overlap-neighbors-hidden',
        'e2e262-live-cancelled-does-not-block',
        'e2e262-live-other-employee-same-time-ok',
        'e2e262-live-provider-slots-parity',
      ]),
    );
    expect(E2E262_LIVE_SCENARIOS).toHaveLength(7);
  });

  describe('validateServiceFitsWindow', () => {
    const bookingRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn(async (b: unknown) => b),
      manager: { findOne: jest.fn() },
    };
    const slotRepo = {
      createQueryBuilder: jest.fn(),
      save: jest.fn(async (s: unknown) => s),
    };
    const schedulingPeriodRepo = { find: jest.fn() };
    const serviceRepo = { findOne: jest.fn(), findOneOrFail: jest.fn() };
    const customerRepo = { findOne: jest.fn() };
    const businessRepo = { findOne: jest.fn() };
    const employeeRepo = { findOne: jest.fn() };
    const multiServiceGroupRepo = { findOne: jest.fn() };

    let service: BookingService;
    let overlapGetCount: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      overlapGetCount = jest.fn().mockResolvedValue(0);

      service = new BookingService(
        bookingRepo as any,
        slotRepo as any,
        schedulingPeriodRepo as any,
        serviceRepo as any,
        customerRepo as any,
        businessRepo as any,
        employeeRepo as any,
        multiServiceGroupRepo as any,
        {} as any,
        { publish: jest.fn() } as any,
        { transaction: jest.fn() } as any,
        {} as any,
        { getRequiredResourceIds: jest.fn().mockResolvedValue([]) } as any,
        {} as any,
        {
          encryptBookingForStorage: jest.fn(async (_b, x) => x),
          decryptBookingForStaff: jest.fn(async (_b, x) => x),
          auditBookingPhiWrite: jest.fn(),
        } as any,
        { ensureMember: jest.fn() } as any,
        { refundBookingPayment: jest.fn().mockResolvedValue('skipped') } as any,
        {
          restoreRedemptionForBooking: jest.fn().mockResolvedValue(false),
        } as any,
      );

      jest
        .spyOn(service as any, 'validateAgainstServicePeriods')
        .mockResolvedValue(undefined);

      const start = new Date('2026-08-01T09:00:00.000Z');
      const microSlots = buildMicroSlots(start, 6, 'svc-1');

      let slotCall = 0;
      slotRepo.createQueryBuilder.mockImplementation(() => {
        slotCall += 1;
        if (slotCall === 1) {
          // blockingSlots count
          return chainQb({ getCount: jest.fn().mockResolvedValue(0) });
        }
        // microSlotsInWindow
        return chainQb({ getMany: jest.fn().mockResolvedValue(microSlots) });
      });

      bookingRepo.createQueryBuilder.mockImplementation(() =>
        chainQb({ getCount: overlapGetCount }),
      );
    });

    it.each(E2E262_VALIDATE_WINDOW_CASES)(
      '$id — $description',
      async ({ overlapCount, expectConflict }) => {
        overlapGetCount.mockResolvedValue(overlapCount);
        const start = new Date('2026-08-01T09:00:00.000Z');
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        if (expectConflict) {
          await expect(
            service.validateServiceFitsWindow(
              'biz-1',
              'emp-1',
              start,
              end,
              'svc-1',
            ),
          ).rejects.toBeInstanceOf(ConflictException);
        } else {
          await expect(
            service.validateServiceFitsWindow(
              'biz-1',
              'emp-1',
              start,
              end,
              'svc-1',
            ),
          ).resolves.toBeUndefined();
        }
        expect(overlapGetCount).toHaveBeenCalled();
      },
    );
  });
});
