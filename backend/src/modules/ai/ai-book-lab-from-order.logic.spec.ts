import type { Business } from '../business/entities/business.entity.js';
import type { ClinicLabBookingRequestView } from '../../common/utils/clinic-lab-booking-request.util.js';
import { handleBookLabFromOrderLogic } from './ai-book-lab-from-order.logic.js';
import {
  BOOK_LAB_FROM_ORDER_PROMPTS,
  BOOK_LAB_FROM_ORDER_RESCUE_SCENARIOS,
} from './ai-book-lab-from-order.fixtures.js';
import { rescueBookLabFromOrderIntent } from './ai-book-lab-from-order.util.js';
import type { ClinicLabBookingLogicDeps } from './ai-clinic-lab-booking.logic.js';

const clinicBusiness = {
  id: 'biz-1',
  timezone: 'UTC',
  settings: { businessType: 'clinic' },
} as Business;

function buildDeps(overrides: Partial<ClinicLabBookingLogicDeps> = {}) {
  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue(clinicBusiness),
    },
    clinicTestOrderService: {
      listLabQueue: jest.fn(),
    },
    clinicTestOrderBookingRequestService: {
      getOrderBookingActions: jest.fn(),
      pushBookingRequestToPatient: jest.fn(),
      bookCollectionForOrder: jest.fn(),
      listPendingBookingRequestsForCustomer: jest.fn().mockResolvedValue([
        {
          orderId: 'ord-42',
          displayNames: 'CBC',
          collectionServiceName: 'Blood draw',
          collectionServiceId: 'svc-1',
          token: 'tok-1',
          pushedAt: '2026-06-01T10:00:00.000Z',
          collectionBookingId: null,
          bookUrl: 'https://example.com/book/ord-42',
        } satisfies ClinicLabBookingRequestView,
      ]),
    },
    clinicLabAccessService: {
      scopeLabQueueFilters: jest.fn(),
    },
    ...overrides,
  } satisfies ClinicLabBookingLogicDeps;
}

describe('ai-book-lab-from-order.logic (ai-cmd-customer-4.14.4)', () => {
  it.each(
    BOOK_LAB_FROM_ORDER_PROMPTS.slice(0, 4).map((row) => [row.id, row.prompt]),
  )('handles book_lab_from_order for $0', async (_id, prompt) => {
    const result = await handleBookLabFromOrderLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('book_lab_from_order');
    expect(result.details?.labToBookTab).toBe(true);
    expect(result.details?.navigate?.path).toBe('/lab-to-book');
    expect(result.details?.navigate?.query?.section).toBe('my-lab-requests');
    expect(result.details?.clientAction).toBe('openLabToBookOrder');
  });

  it('requires sign-in', async () => {
    const result = await handleBookLabFromOrderLogic(
      buildDeps(),
      'biz-1',
      {},
      'Book collection for my lab order',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Sign in');
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleBookLabFromOrderLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('filters by order id from prompt', async () => {
    const listPending = jest.fn().mockResolvedValue([
      {
        orderId: 'ord-42',
        displayNames: 'CBC',
        collectionServiceName: 'Blood draw',
        collectionServiceId: 'svc-1',
        token: 'tok-1',
        pushedAt: '2026-06-01T10:00:00.000Z',
        collectionBookingId: null,
        bookUrl: 'https://example.com/book/ord-42',
      },
      {
        orderId: 'ord-99',
        displayNames: 'Lipid panel',
        collectionServiceName: 'Blood draw',
        collectionServiceId: 'svc-1',
        token: 'tok-2',
        pushedAt: '2026-06-01T11:00:00.000Z',
        collectionBookingId: null,
        bookUrl: 'https://example.com/book/ord-99',
      },
    ]);
    const result = await handleBookLabFromOrderLogic(
      buildDeps({
        clinicTestOrderBookingRequestService: {
          getOrderBookingActions: jest.fn(),
          pushBookingRequestToPatient: jest.fn(),
          bookCollectionForOrder: jest.fn(),
          listPendingBookingRequestsForCustomer: listPending,
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Book collection for lab order ord-42',
    );
    expect(result.success).toBe(true);
    expect(result.details?.orderId).toBe('ord-42');
    expect(result.details?.count).toBe(1);
  });

  it.each(BOOK_LAB_FROM_ORDER_RESCUE_SCENARIOS)(
    'pipeline rescues book_lab_from_order for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueBookLabFromOrderIntent(prompt, misclassifiedAction)?.action,
      ).toBe('book_lab_from_order');
    },
  );
});
