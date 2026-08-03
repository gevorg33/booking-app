import type { Business } from '../business/entities/business.entity.js';
import type { ClinicLabBookingRequestView } from '../../common/utils/clinic-lab-booking-request.util.js';
import {
  handleBookLabCollectionLogic,
  handleListMyLabBookingRequestsLogic,
  handleListPatientPendingLabRequestsLogic,
  handlePushLabBookingToPatientLogic,
  handleStaffBookLabCollectionLogic,
  type ClinicLabBookingLogicDeps,
} from './ai-clinic-lab-booking.logic.js';

const clinicBusiness = {
  id: 'biz-1',
  timezone: 'UTC',
  settings: { businessType: 'clinic' },
} as Business;

function buildDeps(overrides: Partial<ClinicLabBookingLogicDeps> = {}) {
  const orders = [
    {
      id: 'ord-maria-1',
      status: 'NotCollected',
      displayNames: 'CBC',
      customerName: 'Maria',
      bookingRequestPushedAt: null,
      awaitingPatientBooking: false,
    },
  ];

  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue(clinicBusiness),
    },
    clinicTestOrderService: {
      listLabQueue: jest.fn().mockResolvedValue(orders),
    },
    clinicTestOrderBookingRequestService: {
      getOrderBookingActions: jest.fn().mockResolvedValue({
        orderId: 'ord-maria-1',
        canPush: true,
        canStaffBook: true,
        supportedCollectionServices: [{ id: 'svc-1', name: 'Blood draw' }],
        status: 'NotCollected',
        collectionBookingId: null,
      }),
      pushBookingRequestToPatient: jest.fn().mockResolvedValue({
        orderId: 'ord-maria-1',
        canPush: false,
      }),
      bookCollectionForOrder: jest.fn().mockResolvedValue({
        orderId: 'ord-maria-1',
        collectionBookingId: 'booking-1',
      }),
      listPendingBookingRequestsForCustomer: jest.fn().mockResolvedValue([
        {
          orderId: 'ord-maria-1',
          displayNames: 'CBC',
          collectionServiceName: 'Blood draw',
          collectionServiceId: 'svc-1',
          token: 'tok-1',
          pushedAt: '2026-06-01T10:00:00.000Z',
          collectionBookingId: null,
          bookUrl: 'https://example.com/book',
        } satisfies ClinicLabBookingRequestView,
      ]),
    },
    clinicLabAccessService: {
      scopeLabQueueFilters: jest
        .fn()
        .mockImplementation(async (_b, _u, filters) => filters),
    },
    ...overrides,
  } satisfies ClinicLabBookingLogicDeps;
}

describe('ai-clinic-lab-booking.logic', () => {
  it('requires confirmation before pushing lab booking request', async () => {
    const deps = buildDeps();
    const result = await handlePushLabBookingToPatientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Push lab collection booking to Maria',
      false,
    );
    expect(result.success).toBe(true);
    expect(result.details?.requiresConfirmation).toBe(true);
    expect(
      deps.clinicTestOrderBookingRequestService.pushBookingRequestToPatient,
    ).not.toHaveBeenCalled();
  });

  it('pushes lab booking request after confirmation', async () => {
    const deps = buildDeps();
    const result = await handlePushLabBookingToPatientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Push lab collection booking to Maria',
      true,
    );
    expect(result.success).toBe(true);
    expect(
      deps.clinicTestOrderBookingRequestService.pushBookingRequestToPatient,
    ).toHaveBeenCalledWith('biz-1', 'ord-maria-1', 'svc-1', null);
  });

  it('clarifies missing start time for staff book', async () => {
    const deps = buildDeps();
    const result = await handleStaffBookLabCollectionLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Book lab collection for Maria',
      false,
    );
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toContain('date');
  });

  it('lists pending lab booking requests for signed-in customer', async () => {
    const deps = buildDeps();
    const result = await handleListMyLabBookingRequestsLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'What lab appointments do I need to book?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.count).toBe(1);
  });

  it('returns book link for book_lab_collection', async () => {
    const deps = buildDeps();
    const result = await handleBookLabCollectionLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Book my lab collection',
    );
    expect(result.success).toBe(true);
    expect(result.details?.bookUrl).toBe('https://example.com/book');
  });

  it('appends bookingFirstAvailable to book link for nearest compound step', async () => {
    const deps = buildDeps();
    const result = await handleBookLabCollectionLogic(
      deps,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        bookingFirstAvailable: true,
        timeSlot: null,
      },
      'Book lab draw earliest slot',
    );
    expect(result.success).toBe(true);
    expect(result.details?.bookingFirstAvailable).toBe(true);
    expect(result.details?.bookUrl).toBe(
      'https://example.com/book?bookingFirstAvailable=1',
    );
  });

  it('e2e-bug.202 — fails when named panel matches no pending request', async () => {
    const deps = buildDeps();
    const result = await handleBookLabCollectionLogic(
      deps,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        bookingFirstAvailable: true,
        testName: 'unicorn-panel-xyzzy',
      },
      'Book lab draw earliest slot for unicorn-panel-xyzzy',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('book_lab_collection');
    expect(String(result.summary)).toMatch(/couldn't find.*unicorn-panel-xyzzy/i);
    expect(result.details?.requestedTestName).toBe('unicorn-panel-xyzzy');
  });

  it('e2e-bug.202 — named CBC still resolves pending request', async () => {
    const deps = buildDeps();
    const result = await handleBookLabCollectionLogic(
      deps,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        bookingFirstAvailable: true,
        testName: 'CBC',
      },
      'Book lab draw earliest slot for CBC',
    );
    expect(result.success).toBe(true);
    expect(result.details?.bookUrl).toContain('bookingFirstAvailable=1');
  });

  it('lists pending requests for nearest compound step one', async () => {
    const deps = buildDeps();
    const result = await handleListMyLabBookingRequestsLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Book lab draw earliest slot',
    );
    expect(result.success).toBe(true);
    expect(result.details?.count).toBe(1);
  });

  it('lists provider pending patient lab requests', async () => {
    const deps = buildDeps({
      clinicTestOrderService: {
        listLabQueue: jest.fn().mockResolvedValue([
          {
            id: 'ord-1',
            status: 'NotCollected',
            displayNames: 'Lipid panel',
            customerName: 'Alex',
            bookingRequestPushedAt: '2026-06-02T10:00:00.000Z',
            awaitingPatientBooking: true,
          },
        ]),
      },
    });
    const result = await handleListPatientPendingLabRequestsLogic(
      deps,
      'biz-1',
      'user-1',
      { sessionEmployeeId: 'emp-1' },
    );
    expect(result.success).toBe(true);
    expect(result.details?.count).toBe(1);
  });
});
