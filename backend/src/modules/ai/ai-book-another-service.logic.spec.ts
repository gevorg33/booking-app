import { handleBookAnotherServiceLogic } from './ai-book-another-service.logic.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  FRESH_BOOK_QUERY_KEY,
  FRESH_BOOK_QUERY_VALUE,
} from '../../common/utils/book-another-service.util.js';

function makeDeps(
  overrides: Partial<SelfServiceBookingLogicDeps> = {},
): SelfServiceBookingLogicDeps {
  return {
    bookingRepo: {
      findOne: jest.fn(async () => ({
        id: 'book-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-07-15T14:00:00Z'),
        service: { id: 'svc-haircut', name: 'Haircut' },
      })),
      find: jest.fn(),
    } as unknown as SelfServiceBookingLogicDeps['bookingRepo'],
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        name: 'Glow Salon',
      })),
    } as unknown as SelfServiceBookingLogicDeps['businessRepo'],
    serviceRepo: {
      find: jest.fn(async () => [
        { id: 'svc-massage', name: 'Massage', isActive: true },
      ]),
    } as unknown as SelfServiceBookingLogicDeps['serviceRepo'],
    ...overrides,
  } as SelfServiceBookingLogicDeps;
}

describe('ai-book-another-service.logic (ai-cmd-customer-4.3.6)', () => {
  it('returns services navigate with freshBook and same-day date', async () => {
    const result = await handleBookAnotherServiceLogic(
      makeDeps(),
      'biz-1',
      { bookingId: 'book-1', sessionCustomerId: 'cust-1' },
      'Book another service same day',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('book_another_service');
    expect(result.details.navigate).toEqual({
      path: 'services',
      query: {
        [FRESH_BOOK_QUERY_KEY]: FRESH_BOOK_QUERY_VALUE,
        date: '2026-07-15',
      },
    });
    expect(result.details.resetSuccess).toBe(true);
  });

  it('returns checkout navigate when service name is provided', async () => {
    const result = await handleBookAnotherServiceLogic(
      makeDeps(),
      'biz-1',
      { bookingId: 'book-1', sessionCustomerId: 'cust-1' },
      'Book another massage same day',
    );

    expect(result.success).toBe(true);
    expect(result.details.navigate).toEqual({
      path: 'checkout',
      query: {
        [FRESH_BOOK_QUERY_KEY]: FRESH_BOOK_QUERY_VALUE,
        date: '2026-07-15',
        serviceId: 'svc-massage',
      },
    });
  });

  it('returns fresh services navigate without date when same day is not requested', async () => {
    const result = await handleBookAnotherServiceLogic(
      makeDeps(),
      'biz-1',
      { bookingId: 'book-1', sessionCustomerId: 'cust-1' },
      'Book another service',
    );

    expect(result.success).toBe(true);
    expect(result.details.navigate).toEqual({
      path: 'services',
      query: {
        [FRESH_BOOK_QUERY_KEY]: FRESH_BOOK_QUERY_VALUE,
      },
    });
  });

  it('returns failure when business is missing', async () => {
    const result = await handleBookAnotherServiceLogic(
      makeDeps({
        businessRepo: {
          findOne: jest.fn(async () => null),
        } as unknown as SelfServiceBookingLogicDeps['businessRepo'],
      }),
      'missing',
      {},
      'Book another service',
    );

    expect(result.success).toBe(false);
  });

  it('returns clarify when prompt is not book another service', async () => {
    const result = await handleBookAnotherServiceLogic(
      makeDeps(),
      'biz-1',
      {},
      'What time is my appointment?',
    );

    expect(result.success).toBe(false);
    expect(result.details.clarify).toBe(true);
  });

  it('resolves anchor booking from signed-in customer when bookingId is absent', async () => {
    const startTime = new Date(Date.now() + 86_400_000);
    const booking = {
      id: 'book-2',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: BookingStatus.CONFIRMED,
      startTime,
      service: { id: 'svc-facial', name: 'Facial' },
    };
    const result = await handleBookAnotherServiceLogic(
      makeDeps({
        bookingRepo: {
          findOne: jest.fn(),
          find: jest.fn(async () => [booking]),
        } as unknown as SelfServiceBookingLogicDeps['bookingRepo'],
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1', _timeZone: 'UTC' },
      'Book another service',
    );

    expect(result.success).toBe(true);
    expect(result.details.bookingId).toBe('book-2');
    expect(result.details.navigate?.query?.date).toBeUndefined();
  });

  it('falls back to services navigate when named service is not in catalog', async () => {
    const result = await handleBookAnotherServiceLogic(
      makeDeps({
        serviceRepo: {
          find: jest.fn(async () => []),
        } as unknown as SelfServiceBookingLogicDeps['serviceRepo'],
      }),
      'biz-1',
      { bookingId: 'book-1', sessionCustomerId: 'cust-1' },
      'Book another wax same day',
    );

    expect(result.success).toBe(true);
    expect(result.details.navigate).toEqual({
      path: 'services',
      query: {
        [FRESH_BOOK_QUERY_KEY]: FRESH_BOOK_QUERY_VALUE,
        date: '2026-07-15',
      },
    });
  });
});
