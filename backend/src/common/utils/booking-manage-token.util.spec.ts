import {
  buildBookingManageUrl,
  ensureBookingManageToken,
  formatBookingManageLinkHtml,
  formatBookingManageLinkText,
  generateBookingManageToken,
  validateBookingManageToken,
} from './booking-manage-token.util.js';
import { Booking } from '../../modules/booking/entities/booking.entity.js';

function mockBookingRepo(booking: Record<string, unknown> | null) {
  const save = jest.fn(async (_entity: unknown, row: Record<string, unknown>) => {
    if (booking) Object.assign(booking, row);
    return row;
  });
  const getOne = jest.fn().mockResolvedValue(booking);
  const qb = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne,
  };
  const manager = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    save,
  };
  const bookingRepo = {
    manager: {
      transaction: jest.fn(async (cb: (m: typeof manager) => Promise<string>) =>
        cb(manager),
      ),
    },
  };
  return { bookingRepo, manager, qb, save, getOne };
}

describe('booking-manage-token.util', () => {
  it('buildBookingManageUrl encodes params on book path', () => {
    const url = buildBookingManageUrl(
      'https://app.test/',
      'salon',
      'book-1',
      'tok-abc',
      'test',
    );
    expect(url).toBe(
      'https://app.test/book/salon/manage?bookingId=book-1&token=tok-abc',
    );
  });

  it('formatBookingManageLinkHtml uses underlined here anchor', () => {
    const html = formatBookingManageLinkHtml(
      'Manage your booking (reschedule or cancel)',
      'https://app.test/book/salon/manage?bookingId=b1&token=tok',
    );
    expect(html).toBe(
      'Manage your booking (reschedule or cancel): <a href="https://app.test/book/salon/manage?bookingId=b1&amp;token=tok" style="text-decoration:underline">here</a>',
    );
  });

  it('formatBookingManageLinkText keeps URL for plain-text clients', () => {
    expect(
      formatBookingManageLinkText(
        'Manage your booking (cancel)',
        'https://app.test/manage',
      ),
    ).toBe('Manage your booking (cancel): https://app.test/manage');
  });

  it('validateBookingManageToken accepts matching token', () => {
    expect(
      validateBookingManageToken(
        { metadata: { manageToken: 'secret' } } as any,
        'secret',
      ),
    ).toBe(true);
  });

  it('validateBookingManageToken rejects missing or wrong token', () => {
    expect(validateBookingManageToken({ metadata: {} } as any, 'secret')).toBe(
      false,
    );
    expect(
      validateBookingManageToken(
        { metadata: { manageToken: 'a' } } as any,
        'b',
      ),
    ).toBe(false);
    expect(
      validateBookingManageToken(
        { metadata: { manageToken: 123 } } as any,
        '123',
      ),
    ).toBe(false);
  });

  it('generateBookingManageToken returns 48 hex chars', () => {
    expect(generateBookingManageToken()).toMatch(/^[a-f0-9]{48}$/);
  });

  it('ensureBookingManageToken returns existing token without saving', async () => {
    const booking = {
      id: 'book-1',
      metadata: { manageToken: 'existing-token' },
    };
    const { bookingRepo, qb, save } = mockBookingRepo(booking);

    const token = await ensureBookingManageToken(bookingRepo as any, 'book-1');
    expect(token).toBe('existing-token');
    expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(save).not.toHaveBeenCalled();
  });

  it('ensureBookingManageToken creates and persists new token under FOR UPDATE', async () => {
    const booking = {
      id: 'book-2',
      metadata: {},
    };
    const { bookingRepo, qb, save } = mockBookingRepo(booking);

    const token = await ensureBookingManageToken(bookingRepo as any, 'book-2');
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(booking.metadata?.manageToken).toBe(token);
    expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(save).toHaveBeenCalledWith(Booking, booking);
  });

  it('api-bug.6 / e2e-bug.120 — concurrent ensure callers serialize; second returns first token', async () => {
    const booking: { id: string; metadata: Record<string, unknown> } = {
      id: 'book-race',
      metadata: {},
    };
    let lockHeld = false;
    let waiters: Array<() => void> = [];

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
        transaction: jest.fn(async (cb: (m: unknown) => Promise<string>) => {
          await acquire();
          try {
            const manager = {
              createQueryBuilder: () => ({
                setLock: () => ({
                  where: () => ({
                    getOne: async () => ({
                      ...booking,
                      metadata: { ...booking.metadata },
                    }),
                  }),
                }),
              }),
              save: async (
                _entity: unknown,
                row: { id: string; metadata: Record<string, unknown> },
              ) => {
                booking.metadata = { ...row.metadata };
                return row;
              },
            };
            // Re-read under lock from shared store (simulates FOR UPDATE visibility).
            manager.createQueryBuilder = () => ({
              setLock: () => ({
                where: () => ({
                  getOne: async () => ({
                    id: booking.id,
                    metadata: { ...booking.metadata },
                  }),
                }),
              }),
            });
            return await cb(manager);
          } finally {
            release();
          }
        }),
      },
    };

    const [first, second] = await Promise.all([
      ensureBookingManageToken(bookingRepo as any, 'book-race'),
      ensureBookingManageToken(bookingRepo as any, 'book-race'),
    ]);

    expect(first).toMatch(/^[a-f0-9]{48}$/);
    expect(second).toBe(first);
    expect(booking.metadata.manageToken).toBe(first);
  });

  it('ensureBookingManageToken treats missing metadata as empty object', async () => {
    const booking = {
      id: 'book-3',
      metadata: null as unknown as Record<string, unknown>,
    };
    const { bookingRepo, save } = mockBookingRepo(booking);

    const token = await ensureBookingManageToken(bookingRepo as any, 'book-3');
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(booking.metadata?.manageToken).toBe(token);
    expect(save).toHaveBeenCalled();
  });

  it('ensureBookingManageToken throws when booking missing', async () => {
    const { bookingRepo } = mockBookingRepo(null);
    await expect(
      ensureBookingManageToken(bookingRepo as any, 'missing'),
    ).rejects.toThrow('Booking not found');
  });
});
