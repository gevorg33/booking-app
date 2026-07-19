import {
  PROVIDER_CHECK_IN_ELIGIBILITY_SCENARIOS,
  PROVIDER_FLOOR_STATUS_SCENARIOS,
} from './provider-booking-check-in.fixtures.js';
import {
  Booking,
  BookingStatus,
} from '../booking/entities/booking.entity.js';
import {
  buildProviderCheckInEligibility,
  buildProviderCheckInPushMessage,
  claimProviderBookingCheckIn,
  DEFAULT_PROVIDER_MOBILE_SETTINGS,
  providerMobileNotifyCustomerOnVisitStatus,
  providerMobileNotifyReceptionOnCheckIn,
  readProviderMobileSettings,
  resolveProviderBookingFloorStatus,
} from './provider-booking-check-in.util.js';

function mockClaimBookingRepo(booking: Record<string, unknown> | null) {
  const save = jest.fn(
    async (_entity: unknown, row: Record<string, unknown>) => {
      if (booking) Object.assign(booking, row);
      return row;
    },
  );
  const getOne = jest.fn().mockResolvedValue(booking);
  const qb = {
    setLock: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne,
  };
  const manager = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    save,
  };
  const bookingRepo = {
    manager: {
      transaction: jest.fn(
        async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager),
      ),
    },
  };
  return { bookingRepo, manager, qb, save, getOne };
}

describe('provider-booking-check-in.util (prov-exp-3.1)', () => {
  it('defaults provider mobile settings', () => {
    expect(DEFAULT_PROVIDER_MOBILE_SETTINGS).toEqual({
      notifyReceptionOnCheckIn: false,
      notifyCustomerOnVisitStatus: false,
    });
    expect(readProviderMobileSettings(undefined)).toEqual({
      notifyReceptionOnCheckIn: false,
      notifyCustomerOnVisitStatus: false,
    });
    expect(
      readProviderMobileSettings({
        providerMobile: { notifyReceptionOnCheckIn: true },
      }),
    ).toEqual({
      notifyReceptionOnCheckIn: true,
      notifyCustomerOnVisitStatus: false,
    });
    expect(
      providerMobileNotifyReceptionOnCheckIn({
        providerMobile: { notifyReceptionOnCheckIn: true },
      }),
    ).toBe(true);
    expect(
      providerMobileNotifyCustomerOnVisitStatus({
        providerMobile: { notifyCustomerOnVisitStatus: true },
      }),
    ).toBe(true);
  });

  it.each(PROVIDER_FLOOR_STATUS_SCENARIOS)(
    'resolveProviderBookingFloorStatus — $id',
    ({ booking, expected }) => {
      expect(resolveProviderBookingFloorStatus(booking)).toBe(expected);
    },
  );

  it.each(PROVIDER_CHECK_IN_ELIGIBILITY_SCENARIOS)(
    'buildProviderCheckInEligibility — $id',
    ({ booking, allowed }) => {
      expect(buildProviderCheckInEligibility(booking).allowed).toBe(allowed);
    },
  );

  it('treats non-boolean notify flag as disabled', () => {
    expect(
      readProviderMobileSettings({
        providerMobile: { notifyReceptionOnCheckIn: 'yes' },
      }),
    ).toEqual({
      notifyReceptionOnCheckIn: false,
      notifyCustomerOnVisitStatus: false,
    });
  });

  it('ignores invalid checked-in timestamps when resolving floor status', () => {
    expect(
      resolveProviderBookingFloorStatus({
        status: BookingStatus.CONFIRMED,
        checkedInAt: 'not-a-date',
      }),
    ).toBe('waiting');
  });

  it('claimProviderBookingCheckIn sets checkedInAt under FOR UPDATE', async () => {
    const booking = {
      id: 'bk-1',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      checkedInAt: null as Date | null,
    };
    const { bookingRepo, qb, save } = mockClaimBookingRepo(booking);

    const result = await claimProviderBookingCheckIn(bookingRepo as any, {
      bookingId: 'bk-1',
      businessId: 'biz-1',
      checkedInAt: new Date('2026-06-09T10:05:00.000Z'),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.checkedInAt?.toISOString()).toBe(
        '2026-06-09T10:05:00.000Z',
      );
    }
    expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(save).toHaveBeenCalledWith(Booking, expect.objectContaining({
      id: 'bk-1',
      checkedInAt: expect.any(Date),
    }));
  });

  it('claimProviderBookingCheckIn rejects when already checked in', async () => {
    const booking = {
      id: 'bk-1',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      checkedInAt: new Date('2026-06-09T09:50:00.000Z'),
    };
    const { bookingRepo, save } = mockClaimBookingRepo(booking);

    const result = await claimProviderBookingCheckIn(bookingRepo as any, {
      bookingId: 'bk-1',
      businessId: 'biz-1',
    });

    expect(result).toEqual({
      ok: false,
      code: 'not_allowed',
      reason: 'Client is already checked in',
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('e2e-bug.74 — concurrent claim callers serialize; only one sets checkedInAt', async () => {
    const booking: {
      id: string;
      businessId: string;
      status: BookingStatus;
      checkedInAt: Date | null;
    } = {
      id: 'bk-race',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      checkedInAt: null,
    };
    let lockHeld = false;
    const waiters: Array<() => void> = [];

    const acquire = async () => {
      if (!lockHeld) {
        lockHeld = true;
        return;
      }
      await new Promise<void>((resolve) => waiters.push(resolve));
    };
    const release = () => {
      const next = waiters.shift();
      if (next) next();
      else lockHeld = false;
    };

    const bookingRepo = {
      manager: {
        transaction: jest.fn(async (cb: (m: unknown) => Promise<unknown>) => {
          await acquire();
          try {
            const qb: Record<string, unknown> = {};
            qb.setLock = jest.fn(() => qb);
            qb.leftJoinAndSelect = jest.fn(() => qb);
            qb.where = jest.fn(() => qb);
            qb.andWhere = jest.fn(() => qb);
            qb.getOne = jest.fn(async () => ({
              id: booking.id,
              businessId: booking.businessId,
              status: booking.status,
              checkedInAt: booking.checkedInAt,
            }));
            const manager = {
              createQueryBuilder: () => qb,
              save: async (
                _entity: unknown,
                row: {
                  id: string;
                  businessId: string;
                  status: BookingStatus;
                  checkedInAt: Date | null;
                },
              ) => {
                booking.checkedInAt = row.checkedInAt;
                return { ...row };
              },
            };
            return await cb(manager);
          } finally {
            release();
          }
        }),
      },
    };

    const outcomes = await Promise.all([
      claimProviderBookingCheckIn(bookingRepo as any, {
        bookingId: 'bk-race',
        businessId: 'biz-1',
        checkedInAt: new Date('2026-06-09T10:00:00.000Z'),
      }),
      claimProviderBookingCheckIn(bookingRepo as any, {
        bookingId: 'bk-race',
        businessId: 'biz-1',
        checkedInAt: new Date('2026-06-09T10:00:00.004Z'),
      }),
    ]);

    expect(outcomes.filter((r) => r.ok)).toHaveLength(1);
    expect(
      outcomes.filter((r) => !r.ok && r.code === 'not_allowed'),
    ).toHaveLength(1);
    expect(booking.checkedInAt).toEqual(expect.any(Date));
  });
});
