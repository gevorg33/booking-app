import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import {
  E2E255_LIVE_CASES,
  E2E255_LOCK_SOURCE_RULES,
  E2E255_UNIT_CASES,
} from './e2e255-visit-status-concurrency.fixtures.js';
import {
  claimProviderVisitStatus,
  isSameProviderVisitStatusClaim,
  readProviderVisitStatus,
} from './provider-booking-visit-status.util.js';

function mockClaimBookingRepo(booking: Record<string, unknown> | null) {
  const save = jest.fn(
    async (_entity: unknown, row: Record<string, unknown>) => {
      if (booking) Object.assign(booking, row);
      return row;
    },
  );
  const findOne = jest.fn(
    async (
      _entity: unknown,
      opts?: { lock?: { mode?: string }; relations?: unknown },
    ) => {
      if (opts?.relations && booking) {
        return {
          ...booking,
          customer: { name: 'Jane' },
          service: { name: 'Haircut' },
          employee: { name: 'Gevorg' },
        };
      }
      return booking ? { ...booking } : null;
    },
  );
  const manager = { findOne, save };
  const bookingRepo = {
    manager: {
      transaction: jest.fn(
        async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager),
      ),
    },
  };
  return { bookingRepo, findOne, save };
}

describe('e2e-bug.255 visit-status concurrency lock shape', () => {
  const source = readFileSync(
    resolve(__dirname, 'provider-booking-visit-status.util.ts'),
    'utf8',
  );

  it.each(E2E255_LOCK_SOURCE_RULES)('$id', (rule) => {
    if ('mustContain' in rule && rule.mustContain) {
      expect(source).toContain(rule.mustContain);
    }
    if ('mustNotContain' in rule && rule.mustNotContain) {
      expect(source).not.toContain(rule.mustNotContain);
    }
  });

  it('documents every unit + live QA case id', () => {
    expect(E2E255_UNIT_CASES.map((c) => c.id)).toEqual([
      'claim-ready-now-under-lock',
      'claim-same-kind-idempotent',
      'claim-late-minutes-change-updates',
      'concurrent-serialize-single-writer',
      'not-checked-in-rejected',
    ]);
    expect(E2E255_LIVE_CASES.map((c) => c.id)).toEqual([
      'first-ready-now-succeeds',
      'sequential-same-ready-idempotent',
      'concurrent-five-ready-only-one-notifies',
      'first-running-late-succeeds',
      'sequential-late-minutes-change-renotifies',
      'ready-after-late-clears-and-notifies',
      'concurrent-five-late-same-minutes-one-notify',
      'no-for-update-outer-join-500',
      'not-checked-in-rejected',
      'cancelled-booking-rejected',
      'completed-booking-rejected',
    ]);
  });
});

describe('e2e-bug.255 claimProviderVisitStatus', () => {
  it('claim-ready-now-under-lock', async () => {
    const booking = {
      id: 'bk-1',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      checkedInAt: new Date('2026-06-09T09:55:00.000Z'),
      metadata: {} as Record<string, unknown>,
    };
    const { bookingRepo, findOne, save } = mockClaimBookingRepo(booking);

    const result = await claimProviderVisitStatus(bookingRepo as any, {
      bookingId: 'bk-1',
      businessId: 'biz-1',
      kind: 'ready_now',
      markedByUserId: 'user-1',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySet).toBe(false);
      expect(result.snapshot.kind).toBe('ready_now');
    }
    expect(findOne).toHaveBeenCalledWith(
      Booking,
      expect.objectContaining({
        where: { id: 'bk-1', businessId: 'biz-1' },
        lock: { mode: 'pessimistic_write' },
      }),
    );
    expect(findOne.mock.calls[0]?.[1]).not.toHaveProperty('relations');
    expect(save).toHaveBeenCalled();
  });

  it('claim-same-kind-idempotent', async () => {
    const booking = {
      id: 'bk-1',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      checkedInAt: new Date('2026-06-09T09:55:00.000Z'),
      metadata: {
        providerVisitStatus: {
          kind: 'ready_now',
          markedAt: '2026-06-09T09:56:00.000Z',
          markedByUserId: 'user-1',
        },
      },
    };
    const { bookingRepo, save } = mockClaimBookingRepo(booking);

    const result = await claimProviderVisitStatus(bookingRepo as any, {
      bookingId: 'bk-1',
      businessId: 'biz-1',
      kind: 'ready_now',
      markedByUserId: 'user-2',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySet).toBe(true);
      expect(result.snapshot.kind).toBe('ready_now');
    }
    expect(save).not.toHaveBeenCalled();
  });

  it('claim-late-minutes-change-updates', async () => {
    const booking = {
      id: 'bk-1',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      checkedInAt: new Date('2026-06-09T09:55:00.000Z'),
      metadata: {
        providerVisitStatus: {
          kind: 'running_late',
          minutesLate: 10,
          markedAt: '2026-06-09T09:56:00.000Z',
        },
      },
    };
    const { bookingRepo, save } = mockClaimBookingRepo(booking);

    expect(
      isSameProviderVisitStatusClaim(
        readProviderVisitStatus(booking.metadata),
        'running_late',
        15,
      ),
    ).toBe(false);

    const result = await claimProviderVisitStatus(bookingRepo as any, {
      bookingId: 'bk-1',
      businessId: 'biz-1',
      kind: 'running_late',
      minutesLate: 15,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySet).toBe(false);
      expect(result.snapshot.minutesLate).toBe(15);
    }
    expect(save).toHaveBeenCalled();
  });

  it('not-checked-in-rejected', async () => {
    const booking = {
      id: 'bk-1',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      checkedInAt: null,
      metadata: {},
    };
    const { bookingRepo, save } = mockClaimBookingRepo(booking);

    const result = await claimProviderVisitStatus(bookingRepo as any, {
      bookingId: 'bk-1',
      businessId: 'biz-1',
      kind: 'ready_now',
    });

    expect(result).toEqual({
      ok: false,
      code: 'not_allowed',
      reason: 'Check in the client before updating visit status',
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('concurrent-serialize-single-writer', async () => {
    const booking: {
      id: string;
      businessId: string;
      status: BookingStatus;
      checkedInAt: Date;
      metadata: Record<string, unknown>;
    } = {
      id: 'bk-race',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      checkedInAt: new Date('2026-06-09T09:55:00.000Z'),
      metadata: {},
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
            const manager = {
              findOne: async (
                _entity: unknown,
                opts?: { relations?: unknown },
              ) => {
                if (opts?.relations) {
                  return { ...booking, employee: { name: 'Gevorg' } };
                }
                return { ...booking, metadata: { ...booking.metadata } };
              },
              save: async (_entity: unknown, saved: typeof booking) => {
                Object.assign(booking, saved);
                return saved;
              },
            };
            return await cb(manager);
          } finally {
            release();
          }
        }),
      },
    };

    const [a, b] = await Promise.all([
      claimProviderVisitStatus(bookingRepo as any, {
        bookingId: 'bk-race',
        businessId: 'biz-1',
        kind: 'ready_now',
      }),
      claimProviderVisitStatus(bookingRepo as any, {
        bookingId: 'bk-race',
        businessId: 'biz-1',
        kind: 'ready_now',
      }),
    ]);

    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      const writers = [a, b].filter((r) => !r.alreadySet);
      const idempotent = [a, b].filter((r) => r.alreadySet);
      expect(writers).toHaveLength(1);
      expect(idempotent).toHaveLength(1);
    }
  });
});
