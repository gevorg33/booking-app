import {
  BOOK_LAB_COLLECTION_NEAREST_PROMPTS,
  BOOK_LAB_COLLECTION_NEAREST_RESCUE_SCENARIOS,
} from './ai-book-lab-collection-nearest.fixtures.js';
import {
  handleBookLabCollectionLogic,
  handleListMyLabBookingRequestsLogic,
} from './ai-clinic-lab-booking.logic.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';

describe('book_lab_collection_nearest integration (ai-cmd-customer-4.7.3)', () => {
  const clinicBusiness = {
    id: 'biz-1',
    timezone: 'UTC',
    settings: { businessType: 'clinic' },
  };

  const pendingRequest = {
    orderId: 'ord-maria-1',
    displayNames: 'CBC',
    collectionServiceName: 'Blood draw',
    collectionServiceId: 'svc-1',
    token: 'tok-1',
    pushedAt: '2026-06-01T10:00:00.000Z',
    collectionBookingId: null,
    bookUrl: 'https://example.com/book',
  };

  function buildDeps() {
    return {
      businessRepo: {
        findOne: jest.fn().mockResolvedValue(clinicBusiness),
      },
      clinicTestOrderService: {
        listLabQueue: jest.fn(),
      },
      clinicTestOrderBookingRequestService: {
        listPendingBookingRequestsForCustomer: jest
          .fn()
          .mockResolvedValue([pendingRequest]),
      },
      clinicLabAccessService: {
        scopeLabQueueFilters: jest.fn(),
      },
    };
  }

  it.each(
    BOOK_LAB_COLLECTION_NEAREST_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('golden-decomposes customer compound for $id', (_id, row) => {
    const golden = matchGoldenCompoundPattern('customer', row.prompt);
    expect(golden?.steps.map((step) => step.action)).toEqual(
      row.orderedActions,
    );
    expect(golden?.steps[1]?.params.bookingFirstAvailable).toBe(true);
  });

  it.each(
    BOOK_LAB_COLLECTION_NEAREST_RESCUE_SCENARIOS.filter(
      (row) => row.surface === 'public',
    ).map((row) => [row.id, row] as const),
  )('golden-decomposes public compound for $id', (_id, row) => {
    const golden = matchGoldenCompoundPattern('public', row.prompt);
    expect(golden?.recipeId).toBe('public_book_lab_collection_nearest');
    expect(golden?.steps.map((step) => step.action)).toEqual([
      'list_my_lab_booking_requests',
      'book_lab_collection',
    ]);
  });

  it('executes compound steps with bookingFirstAvailable on book link', async () => {
    const prompt = 'Book lab draw earliest slot';
    const decomposition = decomposeDeterministicForSurface('customer', prompt);
    expect(decomposition?.steps.length).toBe(2);

    const deps = buildDeps();
    const listResult = await handleListMyLabBookingRequestsLogic(
      deps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );
    expect(listResult.success).toBe(true);
    expect(listResult.details?.count).toBe(1);

    const bookResult = await handleBookLabCollectionLogic(
      deps as any,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        ...decomposition!.steps[1].params,
      },
      prompt,
    );
    expect(bookResult.success).toBe(true);
    expect(bookResult.details?.bookingFirstAvailable).toBe(true);
    expect(bookResult.details?.bookUrl).toBe(
      'https://example.com/book?bookingFirstAvailable=1',
    );
  });
});
